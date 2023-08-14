import chalk from 'chalk';
import { Provider as StarknetProvider, constants } from 'starknet';
import StarknetDevnet from './devnets/starknetDevnet.js';

const DEVNETS = {
  devnet: StarknetDevnet
};

class Provider extends StarknetProvider {
  constructor(props) {
    super(props);

    if (props.network) {
      this.network = props.network;
    }

    if (DEVNETS[props.network]) {
      this.devnet = new DEVNETS[props.network]();
    }
  }

  static fromConfig(config) {
    if (config.networkConfig.network && constants.NetworkName[config.networkConfig.network]) {
      return new Provider({
        sequencer: { network: constants.NetworkName[config.networkConfig.network] },
        network: config.networkConfig.network
      });
    }

    return new Provider({
      sequencer: { baseUrl: config.networkConfig.url },
      network: config.networkConfig.network
    });
  };

  async predeployedAccountInfo(num) {
    try {
      return this.devnet.predeployedAccountInfo(this, num);
    } catch (error) {
      console.log(chalk.red(`Predeployed accountsn not implemented for ${this.network}`));
      throw new Error('Predeployed accounts not implemented');
    }
  }
}

export default Provider;