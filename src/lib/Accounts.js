import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import promptSync from 'prompt-sync';
import { createStore } from 'key-store'
import { ec, stark, hash, CallData } from 'starknet';

import Account from './Account.js';
import { DEFAULT_ACCOUNT_TYPE, DEFAULT_CLASS_HASH, ACCOUNTS_FILE, KEYS_FILE } from '../constants.js';

const prompt = promptSync();

class Accounts {
  #accounts = null;
  #keyStore = null;

  constructor(props) {
    this.provider = props.provider;
    this.config = props.config;
  }

  get keyStore() {
    if (this.#keyStore) return this.#keyStore;

    if (!fs.existsSync(this.#keysFile)) {
      console.log('Initializing private keys file...');
      fs.writeFileSync(this.#keysFile, JSON.stringify({}, null, 2));
    }

    const saveKeys = data => fs.writeFileSync(this.#keysFile, JSON.stringify(data), 'utf8');
    const readKeys = () => JSON.parse(fs.readFileSync(this.#keysFile, 'utf8'));
    this.#keyStore = createStore(saveKeys, readKeys());

    return this.#keyStore;
  }

  get accounts() {
    if (this.#accounts) return this.#accounts;

    if (!fs.existsSync(this.#accountsFile)) {
      console.log('Initializing accounts file...');
      fs.writeFileSync(this.#accountsFile, JSON.stringify({}, null, 2));
    }

    try {
      const file = fs.readFileSync(this.#accountsFile);
      this.#accounts = JSON.parse(file);
    } catch (error) {
      throw new Error('Failed to read accounts file');
    }

    return this.#accounts;
  }

  accountInfo(name) {
    const slug = this.#slugify(name);

    if (!this.accounts[slug]) {
      return {};
    }

    const account = this.accounts[slug];

    if (account.privateKey == 'ENCRYPTED') {
      const password = prompt.hide(chalk.cyan(`Enter password to decrypt ${slug}: `));

      try {
        const { privateKey } = this.keyStore.getPrivateKeyData(slug, password);
        account.privateKey = privateKey;
      } catch (error) {
        console.log(chalk.red('Incorrect password'));
        return;
      }
    }

    return account;
  }

  async account(name) {
    try {
      const accountInfo = this.accountInfo(name);
      const cairoVersion = accountInfo.type === 'OpenZeppelin-v0.5.1' ? 0 : 1;
      return new Account(this.provider, accountInfo.address, accountInfo.privateKey, cairoVersion);
    } catch (error) {
      return;
    }
  }

  async predeployedAccount(num = 0) {
    try {
      const info = await this.provider.predeployedAccountInfo(num);
      const cairoVersion = accountInfo.type === 'OpenZeppelin-v0.5.1' ? 0 : 1;
      return new Account(this.provider, info.address, info.privateKey, cairoVersion);
    } catch (error) {
      return;
    }
  }

  async deploy(name, { encrypted = false } = {}) {
    if (!name) {
      console.log(chalk.red('Account name is required'));
      return;
    }

    const encryptedMsg = encrypted ? ' (encrypted) ' : ' ';
    console.log(chalk.cyan(`Deploying${encryptedMsg}account ${name} on ${this.config.network}...`));

    let accountInfo = this.accountInfo(name);

    if (accountInfo.deployed) {
      console.log(chalk.red('Account already exists, please choose a different name'));
      return;
    }

    // Generate public and private key pair.
    const privateKey = stark.randomAddress();
    const publicKey = ec.starkCurve.getStarkKey(privateKey);

    // Calculate future address of the account
    const accountConstructorCallData = CallData.compile({ publicKey });
    const address = hash.calculateContractAddressFromHash(
        publicKey, DEFAULT_CLASS_HASH, accountConstructorCallData, 0
    );

    // Store account info, encrypted if password is provided
    accountInfo = { type: DEFAULT_ACCOUNT_TYPE, address, publicKey, privateKey, deployed: false };
    const slug = this.#slugify(name);
    this.accounts[slug] = Object.assign({}, accountInfo);

    // Now deploy the account
    if (accountInfo === {} || accountInfo.deployed === true) {
      console.log(chalk.red('Account not found or already deployed'));
      return;
    }

    // Fund accounts created on devnet with 1 ETH
    if (this.config.network === 'devnet') {
      const { url } = this.config.networkConfig;
      await axios.post(`${url}/mint`, { address: accountInfo.address, amount: 1e18 });
    } else {
      prompt(`Please pre-fund ${accountInfo.address} and press enter to continue after confirmation...`);
    }

    // Deploy the account
    const cairoVersion = DEFAULT_ACCOUNT_TYPE === 'OpenZeppelin-v0.5.1' ? 0 : 1;
    const account = new Account(this.provider, accountInfo.address, accountInfo.privateKey, cairoVersion);
    let deployedAddress;

    try {
      const result = await account.deployAccount({
          classHash: DEFAULT_CLASS_HASH,
          constructorCalldata: accountConstructorCallData,
          addressSalt: accountInfo.publicKey
      });

      await this.provider.waitForTransaction(result.transaction_hash);
      deployedAddress = result.contract_address;
    } catch (error) {
      console.log(chalk.red('Account already deployed at this address'));
      return;
    };

    // Update the stored account values
    accountInfo.deployed = true;

    if (encrypted) {
      const password = prompt.hide(chalk.cyan(`Enter password to encrypt ${slug}: `));
      const confirm = prompt.hide(chalk.cyan(`Confirm password: `));

      if (password !== confirm) {
        console.log(chalk.red('Passwords do not match'));
        return;
      }

      await this.keyStore.saveKey(slug, password, { privateKey: privateKey });
      accountInfo.privateKey = 'ENCRYPTED';
    }

    console.log('Updating account file with new account info...');
    this.accounts[slug] = accountInfo;
    fs.writeFileSync(this.#accountsFile, JSON.stringify(this.accounts, null, 2));

    console.log(chalk.green(`Account deployed at ${deployedAddress}`));
    return account
  }

  async encrypt(name) {
    // Get the account
    const accountInfo = this.accountInfo(name);
    const slug = this.#slugify(name);

    // Encrypt the account
    const password = prompt.hide(chalk.cyan(`Enter password to encrypt ${slug}: `));
    const confirm = prompt.hide(chalk.cyan(`Confirm password: `));

    if (password !== confirm) {
      console.log(chalk.red('Passwords do not match'));
      return;
    }

    await this.keyStore.saveKey(slug, password, { privateKey: accountInfo.privateKey });
    accountInfo.privateKey = 'ENCRYPTED';

    // Overwrite the un-encrypted key
    console.log('Updating account file with new account info...');
    this.accounts[slug] = accountInfo;
    fs.writeFileSync(this.#accountsFile, JSON.stringify(this.accounts, null, 2));

    return accountInfo;
  }

  get #accountsFile() {
    return path.resolve(process.cwd(), this.config.accountsConfig.path, ACCOUNTS_FILE);
  }

  get #keysFile() {
    return path.resolve(process.cwd(), this.config.accountsConfig.path, KEYS_FILE);
  }

  #slugify(name) {
    return `${this.config.network}.${name}`;
  }
}

export default Accounts;