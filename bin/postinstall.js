import fs from 'fs';
import os from 'os';
import path from 'path';

import { CONFIG_FILE } from '../src/constants.js';

const accountsDir = path.resolve(os.homedir(), '.ibis');
const cacheDir = path.resolve(process.cwd(), '../../../', 'cache');

// Ensure the accounts directory exists
if (!fs.existsSync(accountsDir)){
  fs.mkdirSync(accountsDir);
}

// Ensure the cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

try {
  fs.readFileSync(path.resolve(process.cwd(), '../../../', CONFIG_FILE));
} catch (error) {
  fs.writeFileSync(path.resolve(process.cwd(), '../../..', CONFIG_FILE), JSON.stringify({
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
        provider: {
          nodeUrl: 'http://127.0.0.1:5050'
        }
      },
      testnet: {
        network: 'SN_GOERLI'
      },
      sepolia: {
        network: 'SN_SEPOLIA'
      },
      mainnet: {
        network: 'SN_MAIN'
      }
    }
  }, null, 2));
}
