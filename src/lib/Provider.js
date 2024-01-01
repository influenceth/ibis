import chalk from 'chalk';
import { RpcProvider, constants } from 'starknet';
import StarknetDevnet from './devnets/StarknetDevnet.js';

const DEVNETS = {
  devnet: StarknetDevnet
};

class Provider extends RpcProvider {
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
    if (!config.networkConfig?.network) throw new Error('No network config provided');
    if (!config.networkConfig?.provider) throw new Error('No provider config provided');
    return new Provider(Object.assign({}, config.networkConfig.provider, { network: config.networkConfig.network }));
  };

  // Devnet methods

  async advanceTime(seconds) {
    try {
      return this.devnet.advanceTime(this, seconds);
    } catch (error) {
      console.log(chalk.red(`Advancing time not implemented for ${this.network}`));
      throw new Error(`Advancing time not implemented for ${this.network}`);
    }
  }

  async createBlock() {
    try {
      return this.devnet.createBlock(this);
    } catch (error) {
      console.log(chalk.red(`Creating block not implemented for ${this.network}`));
      throw new Error(`Creating block not implemented for ${this.network}`);
    }
  }

  async mint(address, amount) {
    try {
      return this.devnet.mint(this, address, amount);
    } catch (error) {
      console.log(chalk.red(`Minting not implemented for ${this.network}`));
      throw new Error(`Minting not implemented for ${this.network}`);
    }
  }

  async predeployedAccountInfo(num) {
    try {
      return this.devnet.predeployedAccountInfo(this, num);
    } catch (error) {
      console.log(chalk.red(`Predeployed accounts not implemented for ${this.network}`));
      throw new Error(`Predeployed accounts not implemented for ${this.network}`);
    }
  }

  async sendMessageToL2(message) {
    try {
      return this.devnet.sendMessageToL2(this, message);
    } catch (error) {
      console.log(chalk.red(`Sending message to L2 not implemented for ${this.network}`));
      throw new Error(`Sending message to L2 not implemented for ${this.network}`);
    }
  }

  async setTime(timestamp) {
    try {
      return this.devnet.setTime(this, timestamp);
    } catch (error) {
      console.log(chalk.red(`Setting time not implemented for ${this.network}`));
      throw new Error(`Setting time not implemented for ${this.network}`);
    }
  }

  async restart() {
    try {
      return this.devnet.restart(this);
    } catch (error) {
      console.log(chalk.red(`Restarting not implemented for ${this.network}`));
      throw new Error(`Restarting not implemented for ${this.network}`);
    }
  }
}

export default Provider;