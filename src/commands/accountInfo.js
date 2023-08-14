import Accounts from '../lib/Accounts.js';
import Config from '../lib/Config.js';
import Provider from '../lib/Provider.js';

const accountInfo = async function (args) {
  const config = new Config(args.network);
  const provider = Provider.fromConfig(config);
  const accounts = new Accounts({ config, provider });
  console.log(await accounts.getAccountInfo(args.account));
}

export default accountInfo;