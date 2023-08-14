import fs from 'fs';
import path from 'path';
import { json, CallData } from 'starknet';

const ARTIFACTS_FILE = '/Contract.starknet_artifacts.json';

class Contracts {
  _contracts = [];

  constructor(props) {
    this.config = props.config;

    this._loadContracts();
  }

  _loadContracts() {
    try {
      const contracts = JSON.parse(fs.readFileSync(this.resolvedPath + ARTIFACTS_FILE, 'utf8'));
      this._contracts = contracts.contracts;
    } catch (error) {
      throw new Error('Failed to read contracts artifacts file');
    }
  }

  get resolvedPath() {
    return path.resolve(process.cwd(), this.config.contractsConfig.path);
  }

  _findContract(name, contractPackage) {
    const contract = this._contracts.find(c => {
      return c.contract_name === name && (contractPackage ? c.package_name === contractPackage : true)
    });

    if (!contract) throw new Error(`Contract ${name} not found`);
    return contract;
  }

  /**
   * Declares the spcified contract
   * 
   * @param {String} 
   * @param {Account} account 
   * @param {*} param2 
   * @returns {
   *  transaction_hash: String,
   *  class_hash: String 
   * }
   */
  async declare(name, account, { constructorArgs = {}, contractPackage = null } = {}) {
    const sierra = this.sierra(name, contractPackage);
    const casm = this.casm(name, contractPackage);
    const args = { contract: sierra, casm: casm };
    return account.declare(args);
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

    return await account.declareAndDeploy(declareAndDeployArgs);

  }

  abi(contractName, contractPackage = null) {
    const contract = this._findContract(contractName, contractPackage);

    try {
      return json.parse(fs.readFileSync(path.resolve(this.resolvedPath, contract.artifacts.sierra))
        .toString('ascii')).abi;
    } catch (error) {
      throw new Error(`Failed to read compiled contract ${contractName}`);
    }
  }

  sierra(contractName, contractPackage = null) {
    const contract = this._findContract(contractName, contractPackage);

    try {
      return json.parse(fs.readFileSync(path.resolve(this.resolvedPath, contract.artifacts.sierra)).toString('ascii'));
    } catch (error) {
      throw new Error(`Failed to read compiled contract ${contractName}`);
    }
  }

  casm(contractName, contractPackage = null) {
    const contract = this._findContract(contractName, contractPackage);

    try {
      return json.parse(fs.readFileSync(path.resolve(this.resolvedPath, contract.artifacts.casm)).toString('ascii'));
    } catch (error) {
      throw new Error(`Failed to read compiled contract ${contractName}`);
    }
  }
}

export default Contracts;
