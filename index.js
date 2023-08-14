import Accounts from './src/lib/Accounts.js';
import Config from './src/lib/Config.js';
import Contracts from './src/lib/Contracts.js';
import Provider from './src/lib/Provider.js';

const init = (network) => {
  const config = new Config(network);
  const provider = Provider.fromConfig(config);
  const accounts = new Accounts({ config, provider });
  const contracts = new Contracts({ config, provider });

  return { config, provider, accounts, contracts };
};

export { Accounts, Config, Contracts, Provider };
export default init;