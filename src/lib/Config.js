import fs from 'fs';
import path from 'path';

import { CONFIG_FILE } from '../constants.js';

class Config {
  constructor(network) {
    this.network = network;
    this._config = {};

    try {
      const file = path.resolve(process.cwd(), CONFIG_FILE);
      this._config = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      console.error(error);
      throw new Error('Failed to parse Ibis config file');
    }

    if (!this._config.networks[network]) throw new Error(`${network} network not found in Ibis config file`);
  }

  get accountsConfig() {
    return this._config.accounts;
  }

  get contractsConfig() {
    return this._config.contracts;
  }

  get networkConfig() {
    return this._config.networks[this.network];
  }
}

export default Config;