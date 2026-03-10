import chalk from 'chalk';
import { RpcProvider } from 'starknet';
import StarknetDevnet from './devnets/StarknetDevnet.js';
import { normalizeNodeUrl, stripRpcPath } from './starknetCompat.js';

const DEVNETS = {
  devnet: StarknetDevnet
};

const DEFAULT_RPC_ENDPOINTS = {
  SN_MAIN: 'https://starknet-mainnet.public.blastapi.io',
  SN_SEPOLIA: 'https://starknet-sepolia.public.blastapi.io',
  SN_GOERLI: 'https://alpha4.starknet.io'
};

const resolveNetworkName = (network) => {
  if (!network) return null;
  if (network === 'mainnet') return 'SN_MAIN';
  if (network === 'sepolia' || network === 'testnet') return 'SN_SEPOLIA';
  if (network === 'devnet') return 'devnet';
  return network;
};

const resolveRpcUrl = (networkConfig = {}) => {
  const network = resolveNetworkName(networkConfig.network);
  if (network === 'devnet') return 'http://127.0.0.1:5050';
  return DEFAULT_RPC_ENDPOINTS[network] || null;
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

    this.baseUrl = props.baseUrl || stripRpcPath(props.nodeUrl || '');
  }

  static fromConfig(config) {
    if (!config.networkConfig?.network) throw new Error('No network config provided');

    const providerConfig = Object.assign({}, config.networkConfig.provider || {});
    const rpcVersion = providerConfig.rpcVersion || config.networkConfig.rpcVersion || '0.10';
    const fallbackRpc = resolveRpcUrl(config.networkConfig);

    if (!providerConfig.nodeUrl && fallbackRpc) {
      providerConfig.nodeUrl = fallbackRpc;
    }

    if (!providerConfig.nodeUrl) {
      throw new Error('No provider config provided');
    }

    providerConfig.nodeUrl = normalizeNodeUrl(providerConfig.nodeUrl, rpcVersion);
    providerConfig.baseUrl = stripRpcPath(providerConfig.nodeUrl);
    return new Provider(Object.assign({}, providerConfig, { network: config.networkConfig.network }));
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
