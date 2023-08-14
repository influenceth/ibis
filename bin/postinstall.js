import fs from 'fs';
import os from 'os';
import path from 'path';

import { CONFIG_FILE } from '../src/constants.js';

const accountsDir = path.resolve(os.homedir(), '.ibis');

// Ensure the accounts directory exists
if (!fs.existsSync(accountsDir)){
  fs.mkdirSync(accountsDir);
}

try {
  fs.readFileSync(path.resolve(process.cwd(), CONFIG_FILE));
} catch (error) {
  fs.writeFileSync(path.resolve(process.cwd(), CONFIG_FILE), JSON.stringify({
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
        url: 'http://127.0.0.1:5050'
      },
      testnet: {
        network: 'SN_GOERLI'
      },
      mainnet: {
        network: 'SN_MAIN'
      }
    }
  }, null, 2));
}
