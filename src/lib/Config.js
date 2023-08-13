import fs from 'fs';

const DEFAULT_CONFIG_PATH = '/ibis.config.json';

class Config {
  constructor(network) {
    this.network = network;
    this._config = {};

    try {
      this._config = JSON.parse(fs.readFileSync(process.cwd() + DEFAULT_CONFIG_PATH, 'utf8'));
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