import fs from 'fs';
import path from 'path';
import { json, CallData, hash } from 'starknet';
import Account from './Account.js';
import Contract from './Contract.js';
import { ARTIFACTS_FILE, CACHE_FILE } from '../constants.js';
import {
  deployDeclaredClass,
  extractClassHash,
  extractTxHash,
  isClassAlreadyDeclared,
  normalizeDeclareAndDeployResult,
  normalizeDeclareResult
} from './starknetCompat.js';

const hasContractShape = (value) => {
  return Boolean(
    value
    && typeof value === 'object'
    && typeof value.contract_name === 'string'
    && value.artifacts
  );
};

const flattenContracts = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap(flattenContracts);
  }

  if (hasContractShape(value)) {
    return [value];
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(flattenContracts);
  }

  return [];
};


class Contracts {
  #artifacts = null;
  #cache = null;

  constructor(props) {
    this.config = props.config;
    this.provider = props.provider;
  }

  get artifactsPath() {
    return path.resolve(process.cwd(), this.config.contractsConfig.artifacts);
  }

  get artifacts() {
    if (this.#artifacts) return this.#artifacts;

    try {
      const file = path.resolve(this.config.contractsConfig.artifacts, ARTIFACTS_FILE);
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      this.#artifacts = flattenContracts(parsed?.contracts ?? parsed);
    } catch (error) {
      this.#artifacts = [];
    }

    return this.#artifacts;
  }

  get cache() {
    if (this.#cache) return this.#cache;

    try {
      const file = path.resolve(this.config.contractsConfig.cache, `${this.config.network}.${CACHE_FILE}`);
      this.#cache = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      this.#cache = {};
    }

    return this.#cache;
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
  async declare(name, { account = null, contractPackage = null } = {}, options = {}) {
    if (!(account instanceof Account)) throw new Error('Invalid or no account not specified');

    const sierra = this.sierra(name, { contractPackage });
    const casm = this.casm(name, { contractPackage });
    const args = { contract: sierra, casm: casm };
    let transaction_hash;
    let class_hash;

    // attempt to declare, if already declared, use computed class hash
    try {
      ({ transaction_hash, class_hash } = normalizeDeclareResult(await account.declare(args, options)));
    } catch (error) {
      if (isClassAlreadyDeclared(error)) {
        console.warn('class already delcared, using computed class hash');
        class_hash = hash.computeContractClassHash(sierra);
      } else {
        throw error;
      }
    }

    // Update cache
    this.#cacheContract(name, contractPackage, {
      declaredAt: Date.now(),
      declareTxHash: transaction_hash,
      classHash: class_hash
    });

    return { class_hash, transaction_hash };
  };

  deployed(name, { account = null, contractPackage = null } = {}) {
    if (account && !(account instanceof Account)) throw new Error('Invalid or no account not specified');
    const slug = this.#slugify(name, contractPackage, { allowCacheFallback: true });
    const cache = this.cache[slug];

    if (!cache) {
      const error = new Error('Contract not found in cache');
      error.errorCode = 'IbisErrorCode.CONTRACT_CACHE_MISS';
      throw error;
    }

    const { address } = cache;
    const abi = this.abi(name, { contractPackage });
    const providerOrAccount = account || this.provider;

    return new Contract(abi, address, providerOrAccount);
  }

  async declareAndDeploy(name, { account = null, constructorArgs = {}, contractPackage = null } = {}, options = {}) {
    if (!account) {
      const error = new Error('Account not specified');
      error.errorCode = 'IbisErrorCode.ACCOUNT_NOT_SPECIFIED';
      throw error;
    }

    const abi = this.abi(name, { contractPackage });
    const sierra = this.sierra(name, { contractPackage });
    const casm = this.casm(name, { contractPackage });
    const declareAndDeployArgs = { contract: sierra, casm: casm };

    // Check for constructor and format calldata
    const constructor = abi.find(f => f.type === 'constructor');

    if (constructor) {
      const calldata = new CallData(abi);
      declareAndDeployArgs.constructorCalldata = calldata.compile('constructor', constructorArgs);
    }

    let res;
    if (typeof account.declareAndDeploy === 'function') {
      res = normalizeDeclareAndDeployResult(await account.declareAndDeploy(declareAndDeployArgs, options));
    } else {
      const declareRes = await this.declare(name, { account, contractPackage }, options);
      const classHash = extractClassHash(declareRes);
      const deployRes = await deployDeclaredClass({
        account,
        classHash,
        abi,
        constructorCalldata: declareAndDeployArgs.constructorCalldata,
        options
      });

      res = normalizeDeclareAndDeployResult({ declare: declareRes, deploy: deployRes });
    }

    // Update cache
    this.#cacheContract(name, contractPackage, {
      address: res.deploy.address,
      classHash: res.declare.class_hash,
      constructorArgs: constructorArgs,
      declaredAt: Date.now(),
      declareTxHash: extractTxHash(res.declare),
      deployedAt: Date.now(),
      deployTxHash: extractTxHash(res.deploy),
      deployer: account.address
    });

    return res;
  }

  abi(contractName, { contractPackage = null } = {}) {
    const contract = this.#findArtifacts(contractName, contractPackage);

    try {
      return json.parse(fs.readFileSync(path.resolve(this.artifactsPath, contract.artifacts.sierra))
        .toString('ascii')).abi;
    } catch (error) {
      const newError = new Error(`Failed to read compiled contract ${contractName}`);
      newError.errorCode = 'IbisErrorCode.CONTRACT_ABI_NOT_FOUND';
      throw newError;
    }
  }

  casm(contractName, { contractPackage = null } = {}) {
    const contract = this.#findArtifacts(contractName, contractPackage);

    try {
      return json.parse(fs.readFileSync(path.resolve(this.artifactsPath, contract.artifacts.casm)).toString('ascii'));
    } catch (error) {
      const newError = new Error(`Failed to read compiled contract ${contractName}`);
      newError.errorCode = 'IbisErrorCode.CONTRACT_CASM_NOT_FOUND';
      throw newError;
    }
  }

  classHash(name, { contractPackage = null } = {}) {
    const slug = this.#slugify(name, contractPackage, { allowCacheFallback: true });
    const cache = this.cache[slug];

    if (!cache) {
      const error = new Error('Contract not found in cache');
      error.errorCode = 'IbisErrorCode.CONTRACT_CACHE_MISS';
      throw error;
    }

    return cache.classHash;
  }

  sierra(contractName, { contractPackage = null } = {}) {
    const contract = this.#findArtifacts(contractName, contractPackage);

    try {
      return json.parse(fs.readFileSync(path.resolve(this.artifactsPath, contract.artifacts.sierra)).toString('ascii'));
    } catch (error) {
      const newError = new Error(`Failed to read compiled contract ${contractName}`);
      newError.errorCode = 'IbisErrorCode.CONTRACT_SIERRA_NOT_FOUND';
      throw newError;
    }
  }

  #cacheContract(name, contractPackage = null, data) {
    const slug = this.#slugify(name, contractPackage);
    const current = this.cache[slug] || {};
    this.#cache[slug] = Object.assign(current, data);
    const file = path.resolve(this.config.contractsConfig.cache, `${this.config.network}.${CACHE_FILE}`);
    fs.writeFileSync(file, JSON.stringify(this.cache, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  }

  // Finds a contract by name (and package) in the parsed artifacts
  #findArtifacts(name, contractPackage = null) {
    const contract = this.artifacts.find(c => {
      return c.contract_name === name && (contractPackage ? c.package_name === contractPackage : true)
    });

    if (!contract) {
      const error = new Error(`Contract ${name} not found`);
      error.errorCode = 'IbisErrorCode.CONTRACT_ARTIFACT_NOT_FOUND';
      throw error;
    }

    return contract;
  }

  #slugify(name, contractPackage = null, { allowCacheFallback = false } = {}) {
    if (allowCacheFallback) {
      const fromCache = this.#cacheSlug(name, contractPackage);
      if (fromCache) return fromCache;
    }

    let artifactData = this.#findArtifacts(name, contractPackage);
    return `${artifactData.package_name}.${artifactData.contract_name}.${artifactData.id}`;
  }

  #cacheSlug(name, contractPackage = null) {
    const matches = Object.keys(this.cache).filter((slug) => {
      const parts = slug.split('.');
      if (parts.length < 3) return false;

      const [pkg, contractName] = parts;
      if (contractName !== name) return false;
      if (contractPackage && pkg !== contractPackage) return false;

      return true;
    });

    if (matches.length === 1) {
      return matches[0];
    }

    if (matches.length > 1 && !contractPackage) {
      const error = new Error(`Multiple cached contracts named ${name} found; specify contract package`);
      error.errorCode = 'IbisErrorCode.CONTRACT_CACHE_AMBIGUOUS';
      throw error;
    }

    return null;
  }
}

export default Contracts;
