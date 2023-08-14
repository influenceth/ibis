import Accounts from '../lib/Accounts.js';
import Config from '../lib/Config.js';
import { getProvider } from '../lib/utils.js';

const accountInfo = async function (args) {
  const config = new Config(args.network);
  const provider = getProvider(config);
  const accounts = new Accounts({ config, provider });
  console.log(await accounts.getAccountInfo(args.account));
}

export default accountInfo;