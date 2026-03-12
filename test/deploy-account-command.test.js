import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

import deployAccount from '../src/commands/deployAccount.js';
import Accounts from '../src/lib/Accounts.js';
import { CONFIG_FILE } from '../src/constants.js';

const withTempProject = (t) => {
  const previousCwd = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ibis-deploy-command-'));
  process.chdir(dir);
  t.after(() => process.chdir(previousCwd));

  const config = {
    accounts: { path: dir },
    contracts: {
      artifacts: './target/dev',
      cache: './cache'
    },
    networks: {
      devnet: {
        network: 'devnet',
        rpcVersion: '0.10',
        provider: {
          nodeUrl: 'http://127.0.0.1:5050'
        }
      }
    }
  };

  fs.mkdirSync(path.join(dir, 'target/dev'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'cache'), { recursive: true });
  fs.writeFileSync(path.join(dir, CONFIG_FILE), JSON.stringify(config, null, 2));
};

test('deployAccount command passes parsed args to Accounts.deploy', async (t) => {
  withTempProject(t);

  const originalDeploy = Accounts.prototype.deploy;
  let deployArgs = null;

  Accounts.prototype.deploy = async function mockedDeploy(name, options) {
    deployArgs = { name, options, network: this.config.network };
  };

  t.after(() => {
    Accounts.prototype.deploy = originalDeploy;
  });

  await deployAccount({
    network: 'devnet',
    account: 'smoke',
    encrypted: true,
    overwrite: true
  });

  assert.deepEqual(deployArgs, {
    name: 'smoke',
    options: { encrypted: true, overwrite: true },
    network: 'devnet'
  });
});
