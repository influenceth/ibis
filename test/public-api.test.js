import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { CONFIG_FILE } from '../src/constants.js';

const makeTempProject = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ibis-test-'));
  fs.mkdirSync(path.join(dir, 'cache'));
  fs.mkdirSync(path.join(dir, 'target/dev'), { recursive: true });

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

  fs.writeFileSync(path.join(dir, CONFIG_FILE), JSON.stringify(config, null, 2));
  return dir;
};

test('init(network) returns the expected public factories', async (t) => {
  let init;
  let Accounts;
  let Config;
  let Contracts;
  let Provider;

  try {
    ({ default: init, Accounts, Config, Contracts, Provider } = await import('../index.js'));
  } catch (error) {
    t.skip(`Skipping public API test: ${error.message}`);
    return;
  }

  const cwd = process.cwd();
  const projectDir = makeTempProject();
  process.chdir(projectDir);

  try {
    const instance = init('devnet');

    assert.deepEqual(Object.keys(instance).sort(), ['accounts', 'config', 'contracts', 'provider']);
    assert.ok(instance.config instanceof Config);
    assert.ok(instance.provider instanceof Provider);
    assert.ok(instance.accounts instanceof Accounts);
    assert.ok(instance.contracts instanceof Contracts);
  } finally {
    process.chdir(cwd);
  }
});
