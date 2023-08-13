import Provider from './Provider.js';
import { constants } from 'starknet';

export const getProvider = (config) => {
  let provider;

  if (config.networkConfig.network && constants.NetworkName[config.networkConfig.network]) {
    provider = new Provider({
      sequencer: { network: constants.NetworkName[config.networkConfig.network] },
      network: config.networkConfig.network
    });
  } else {
    provider = new Provider({
      sequencer: { baseUrl: config.networkConfig.url },
      network: config.networkConfig.network
    });
  }

  return provider;
};

export default {
  getProvider
};
