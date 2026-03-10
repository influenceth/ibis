import fs from 'fs';
import os from 'os';
import path from 'path';

import { CONFIG_FILE } from '../src/constants.js';

const projectRoot = process.cwd();
const accountsDir = path.resolve(os.homedir(), '.ibis');
const cacheDir = path.resolve(projectRoot, 'cache');
const configPath = path.resolve(projectRoot, CONFIG_FILE);

// Ensure the accounts directory exists
if (!fs.existsSync(accountsDir)){
  fs.mkdirSync(accountsDir, { recursive: true });
}

// Ensure the cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

try {
  fs.readFileSync(configPath);
} catch (error) {
  fs.writeFileSync(configPath, JSON.stringify({
    accounts: {
      path: accountsDir,
    },
    contracts: {
      artifacts: './target/dev',
      cache: './cache'
    },
    networks: {
      devnet: {
        network: 'devnet',
        rpcVersion: '0.10',
        accountType: 'OpenZeppelin-v2.0.0-AccountUpgradeable',
        accountClassHash: '0x07fa937960fd981bc9a7f54f02786cfa6c6f194fc66cb0c35c1588bd83448062',
        provider: {
          nodeUrl: 'http://127.0.0.1:5050'
        }
      },
      testnet: {
        network: 'SN_SEPOLIA',
        rpcVersion: '0.10',
        accountType: 'OpenZeppelin-v2.0.0-AccountUpgradeable',
        accountClassHash: '0x07fa937960fd981bc9a7f54f02786cfa6c6f194fc66cb0c35c1588bd83448062',
        provider: {
          nodeUrl: 'https://starknet-sepolia.public.blastapi.io'
        }
      },
      sepolia: {
        network: 'SN_SEPOLIA',
        rpcVersion: '0.10',
        accountType: 'OpenZeppelin-v2.0.0-AccountUpgradeable',
        accountClassHash: '0x07fa937960fd981bc9a7f54f02786cfa6c6f194fc66cb0c35c1588bd83448062',
        provider: {
          nodeUrl: 'https://starknet-sepolia.public.blastapi.io'
        }
      },
      mainnet: {
        network: 'SN_MAIN',
        rpcVersion: '0.10',
        accountType: 'OpenZeppelin-v2.0.0-AccountUpgradeable',
        accountClassHash: '0x07fa937960fd981bc9a7f54f02786cfa6c6f194fc66cb0c35c1588bd83448062',
        provider: {
          nodeUrl: 'https://starknet-mainnet.public.blastapi.io'
        }
      }
    }
  }, null, 2));
}
