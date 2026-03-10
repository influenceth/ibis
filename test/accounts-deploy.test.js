import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

import axios from 'axios';

import Account from '../src/lib/Account.js';
import Accounts from '../src/lib/Accounts.js';
import { ACCOUNTS_FILE, DEFAULT_ACCOUNT_TYPE, DEFAULT_CLASS_HASH } from '../src/constants.js';

const withTempCwd = (t) => {
  const previousCwd = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ibis-accounts-deploy-'));
  process.chdir(dir);
  t.after(() => process.chdir(previousCwd));
  return dir;
};

const makeDevnetConfig = (accountsPath, networkOverrides = {}) => ({
  network: 'devnet',
  accountsConfig: { path: accountsPath },
  networkConfig: {
    network: 'devnet',
    provider: {
      nodeUrl: 'http://127.0.0.1:5050'
    },
    ...networkOverrides
  }
});

test('accounts.deploy on devnet mints and deploys with default account class hash', async (t) => {
  const tempDir = withTempCwd(t);

  const config = makeDevnetConfig(tempDir);
  let waitedForTx = null;
  const provider = {
    baseUrl: 'http://127.0.0.1:5050',
    waitForTransaction: async (txHash) => {
      waitedForTx = txHash;
    }
  };

  const originalAxiosPost = axios.post;
  const originalDeployAccount = Account.prototype.deployAccount;

  let mintCall = null;
  let deployCall = null;

  axios.post = async (url, payload) => {
    mintCall = { url, payload };
    return { data: { ok: true } };
  };

  Account.prototype.deployAccount = async function mockDeployAccount(payload) {
    deployCall = payload;
    return { transaction_hash: '0xabc123', contract_address: this.address };
  };

  t.after(() => {
    axios.post = originalAxiosPost;
    Account.prototype.deployAccount = originalDeployAccount;
  });

  const accounts = new Accounts({ config, provider });
  await accounts.deploy('alice');

  assert.equal(mintCall.url, 'http://127.0.0.1:5050/mint');
  assert.equal(mintCall.payload.amount, 1e18);
  assert.equal(deployCall.classHash, DEFAULT_CLASS_HASH);
  assert.equal(waitedForTx, '0xabc123');

  const rawAccounts = JSON.parse(fs.readFileSync(path.join(tempDir, ACCOUNTS_FILE), 'utf8'));
  assert.equal(mintCall.payload.address, rawAccounts['devnet.alice'].address);
  assert.equal(rawAccounts['devnet.alice'].type, DEFAULT_ACCOUNT_TYPE);
  assert.equal(rawAccounts['devnet.alice'].deployed, true);
});

test('accounts.deploy honors network accountType and accountClassHash overrides', async (t) => {
  const tempDir = withTempCwd(t);

  const overrideClassHash = '0x12345';
  const overrideType = 'OpenZeppelin-v2.0.0-AccountUpgradeable-Override';
  const config = makeDevnetConfig(tempDir, {
    accountClassHash: overrideClassHash,
    accountType: overrideType
  });

  const provider = {
    baseUrl: 'http://127.0.0.1:5050',
    waitForTransaction: async () => {}
  };

  const originalAxiosPost = axios.post;
  const originalDeployAccount = Account.prototype.deployAccount;

  let deployCall = null;
  axios.post = async () => ({ data: { ok: true } });
  Account.prototype.deployAccount = async function mockDeployAccount(payload) {
    deployCall = payload;
    return { transaction_hash: '0xdef456', contract_address: this.address };
  };

  t.after(() => {
    axios.post = originalAxiosPost;
    Account.prototype.deployAccount = originalDeployAccount;
  });

  const accounts = new Accounts({ config, provider });
  await accounts.deploy('bob');

  assert.equal(deployCall.classHash, overrideClassHash);

  const rawAccounts = JSON.parse(fs.readFileSync(path.join(tempDir, ACCOUNTS_FILE), 'utf8'));
  assert.equal(rawAccounts['devnet.bob'].type, overrideType);
  assert.equal(rawAccounts['devnet.bob'].deployed, true);
});
