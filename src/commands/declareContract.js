import Accounts from '../lib/Accounts.js';
import Contracts from '../lib/Contracts.js';
import Config from '../lib/Config.js';
import Provider from '../lib/Provider.js';
import { printJson } from './helpers.js';

const declareContract = async (args) => {
  const config = new Config(args.network);
  const provider = Provider.fromConfig(config);
  const accounts = new Accounts({ config, provider });
  const contracts = new Contracts({ config, provider });

  const account = await accounts.account(args.account);
  if (!account) throw new Error(`Account ${args.account} not found`);

  const result = await contracts.declare(
    args.contract,
    { account, contractPackage: args.package }
  );

  printJson(result);
};

export default declareContract;
