import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

import Contracts from '../src/lib/Contracts.js';
import { ARTIFACTS_FILE, CACHE_FILE } from '../src/constants.js';

const withTempCwd = (t) => {
  const previousCwd = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ibis-contracts-artifacts-'));
  process.chdir(dir);
  t.after(() => process.chdir(previousCwd));
  return dir;
};

test('contracts.deployed works when Contract.starknet_artifacts.json contracts is an object', (t) => {
  const tempDir = withTempCwd(t);
  const artifactsDir = path.join(tempDir, 'target/dev');
  const cacheDir = path.join(tempDir, 'cache');
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });

  const contractEntry = {
    id: 'dispatcher-v2',
    package_name: 'influence',
    contract_name: 'Dispatcher',
    artifacts: {
      sierra: 'Dispatcher.sierra.json',
      casm: 'Dispatcher.casm.json'
    }
  };

  fs.writeFileSync(
    path.join(artifactsDir, ARTIFACTS_FILE),
    JSON.stringify({
      contracts: {
        dispatcher: contractEntry
      }
    }, null, 2)
  );

  fs.writeFileSync(
    path.join(artifactsDir, 'Dispatcher.sierra.json'),
    JSON.stringify({
      abi: [
        {
          type: 'constructor',
          name: 'constructor',
          inputs: [{ name: 'public_key', type: 'core::felt252' }]
        },
        {
          type: 'function',
          name: '__execute__',
          inputs: [{ name: 'calls', type: 'core::array::Array::<core::starknet::account::Call>' }],
          outputs: [],
          state_mutability: 'external'
        }
      ],
      sierra_program: [],
      contract_class_version: '0.1.0',
      entry_points_by_type: {}
    }, null, 2)
  );
  fs.writeFileSync(path.join(artifactsDir, 'Dispatcher.casm.json'), JSON.stringify({ bytecode: [] }, null, 2));

  fs.writeFileSync(
    path.join(cacheDir, `sepolia.${CACHE_FILE}`),
    JSON.stringify({
      [`${contractEntry.package_name}.${contractEntry.contract_name}.${contractEntry.id}`]: {
        address: '0x123',
        classHash: '0xabc'
      }
    }, null, 2)
  );

  const contracts = new Contracts({
    config: {
      network: 'sepolia',
      contractsConfig: {
        artifacts: artifactsDir,
        cache: cacheDir
      }
    },
    provider: {}
  });

  const deployed = contracts.deployed('Dispatcher');
  assert.equal(deployed.address, '0x123');
});

test('contracts.classHash throws cache ambiguity error when multiple package slugs match', (t) => {
  const tempDir = withTempCwd(t);
  const artifactsDir = path.join(tempDir, 'target/dev');
  const cacheDir = path.join(tempDir, 'cache');
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });

  fs.writeFileSync(
    path.join(artifactsDir, ARTIFACTS_FILE),
    JSON.stringify({ contracts: [] }, null, 2)
  );

  fs.writeFileSync(
    path.join(cacheDir, `sepolia.${CACHE_FILE}`),
    JSON.stringify({
      'influence.Dispatcher.a': { address: '0x1', classHash: '0xaa' },
      'other.Dispatcher.b': { address: '0x2', classHash: '0xbb' }
    }, null, 2)
  );

  const contracts = new Contracts({
    config: {
      network: 'sepolia',
      contractsConfig: {
        artifacts: artifactsDir,
        cache: cacheDir
      }
    },
    provider: {}
  });

  assert.throws(
    () => contracts.classHash('Dispatcher'),
    (error) => error?.errorCode === 'IbisErrorCode.CONTRACT_CACHE_AMBIGUOUS'
  );
});
