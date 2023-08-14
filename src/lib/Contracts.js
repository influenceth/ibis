import fs from 'fs';
import path from 'path';
import { json, CallData } from 'starknet';

const ARTIFACTS_FILE = 'Contract.starknet_artifacts.json';
const CACHE_FILE = 'ibis_contracts.json';

class Contracts {
  _artifacts = null;
  _cache = null;

  constructor(props) {
    this.config = props.config;
  }

  get artifactsPath() {
    return path.resolve(process.cwd(), this.config.contractsConfig.artifacts);
  }

  get artifacts() {
    if (this._artifacts) return this._artifacts;

    try {
      const file = path.resolve(this.config.contractsConfig.artifacts, ARTIFACTS_FILE);
      this._artifacts = JSON.parse(fs.readFileSync(file, 'utf8')).contracts;
    } catch (error) {
      this._artifacts = {};
    }

    return this._artifacts;
  }

  get cache() {
    if (this._cache) return this._cache;

    try {
      const file = path.resolve(this.config.contractsConfig.cache, CACHE_FILE);
      this._cache = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      this._cache = {};
    }

    return this._cache;
  }

  /**
   * Declares the spcified contract
   *
   * @param {String} name
   * @param {Account} account
   * @returns {
   *  transaction_hash: String,
   *  class_hash: String
   * }
   */
  async declare(name, account, { contractPackage = null } = {}) {
    const sierra = this.sierra(name, contractPackage);
    const casm = this.casm(name, contractPackage);
    const args = { contract: sierra, casm: casm };
    const res = await account.declare(args);

    // Update cache
    this.cacheContract(name, contractPackage, {
      declaredAt: Date.now(),
      declareTxHash: res.transaction_hash,
      classHash: res.class_hash
    });

    return res;
  };

  async declareAndDeploy(name, account, { constructorArgs = {}, contractPackage = null } = {}) {
    const abi = this.abi(name, contractPackage);
    const sierra = this.sierra(name, contractPackage);
    const casm = this.casm(name, contractPackage);
    const declareAndDeployArgs = { contract: sierra, casm: casm };

    // Check for constructor and format calldata
    const constructor = abi.find(f => f.type === 'constructor');

    if (constructor) {
      const calldata = new CallData(abi);
      declareAndDeployArgs.constructorCalldata = calldata.compile('constructor', constructorArgs);
    }

    const res = await account.declareAndDeploy(declareAndDeployArgs);

    // Update cache
    this.cacheContract(name, contractPackage, {
      address: res.deploy.address,
      classHash: res.declare.class_hash,
      constructorArgs: constructorArgs,
      declaredAt: Date.now(),
      declareTxHash: res.declare.transaction_hash,
      deployedAt: Date.now(),
      deployTxHash: res.deploy.transaction_hash,
      deployer: account.address
    });

    return res;
  }

  cacheContract(name, contractPackage, data) {
    let artifactData = this._findArtifacts(name, contractPackage);
    let slug = `${this.config.network}.${artifactData.package_name}.${artifactData.contract_name}.${artifactData.id}`;
    this._cache = Object.assign({}, this.cache, { [slug]: data });
    const file = path.resolve(this.config.contractsConfig.cache, CACHE_FILE);
    fs.writeFileSync(file, JSON.stringify(this.cache, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  }

  abi(contractName, contractPackage = null) {
    const contract = this._findArtifacts(contractName, contractPackage);

    try {
      return json.parse(fs.readFileSync(path.resolve(this.artifactsPath, contract.artifacts.sierra))
        .toString('ascii')).abi;
    } catch (error) {
      throw new Error(`Failed to read compiled contract ${contractName}`);
    }
  }

  sierra(contractName, contractPackage = null) {
    const contract = this._findArtifacts(contractName, contractPackage);

    try {
      return json.parse(fs.readFileSync(path.resolve(this.artifactsPath, contract.artifacts.sierra)).toString('ascii'));
    } catch (error) {
      throw new Error(`Failed to read compiled contract ${contractName}`);
    }
  }

  casm(contractName, contractPackage = null) {
    const contract = this._findArtifacts(contractName, contractPackage);

    try {
      return json.parse(fs.readFileSync(path.resolve(this.artifactsPath, contract.artifacts.casm)).toString('ascii'));
    } catch (error) {
      throw new Error(`Failed to read compiled contract ${contractName}`);
    }
  }

  // Finds a contract by name (and package) in the parsed artifacts
  _findArtifacts(name, contractPackage) {
    const contract = this.artifacts.find(c => {
      return c.contract_name === name && (contractPackage ? c.package_name === contractPackage : true)
    });

    if (!contract) throw new Error(`Contract ${name} not found`);
    return contract;
  }
}

export default Contracts;
