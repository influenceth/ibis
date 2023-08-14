import chalk from 'chalk';
import { Provider as StarknetProvider } from 'starknet';
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