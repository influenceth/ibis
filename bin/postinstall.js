import fs from 'fs';
import os from 'os';
import path from 'path';

import { CONFIG_FILE } from '../src/constants.js';

try {
  fs.readFileSync(path.resolve(process.cwd(), CONFIG_FILE));
} catch (error) {
  fs.writeFileSync(path.resolve(process.cwd(), CONFIG_FILE), JSON.stringify({
    accounts: {
      path: path.resolve(os.homedir(), '.ibis'),
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
