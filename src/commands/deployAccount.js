import Accounts from '../lib/Accounts.js';
import Config from '../lib/Config.js';
import { getProvider } from '../lib/utils.js';

const deployAccount = async (args) => {
  const config = new Config(args.network);
  const provider = getProvider(config);
  const accounts = new Accounts({ config, provider });
  await accounts.deploy(args.name, { encrypted: args.encrypted, overwrite: args.overwrite });
}

export default deployAccount;