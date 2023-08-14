import Accounts from '../lib/Accounts.js';
import Config from '../lib/Config.js';
import Provider from '../lib/Provider.js';

const deployAccount = async (args) => {
  const config = new Config(args.network);
  const provider = Provider.fromConfig(config);
  const accounts = new Accounts({ config, provider });
  await accounts.deploy(args.account, { encrypted: args.encrypted, overwrite: args.overwrite });
}

export default deployAccount;