import Accounts from '../lib/Accounts.js';
import Contracts from '../lib/Contracts.js';
import Config from '../lib/Config.js';
import Provider from '../lib/Provider.js';
import { parseJsonArg, printJson } from './helpers.js';

const deployContract = async (args) => {
  const config = new Config(args.network);
  const provider = Provider.fromConfig(config);
  const accounts = new Accounts({ config, provider });
  const contracts = new Contracts({ config, provider });

  const account = await accounts.account(args.account);
  if (!account) throw new Error(`Account ${args.account} not found`);

  const constructorArgs = parseJsonArg(args.constructorArgs, '--constructorArgs');
  const result = await contracts.declareAndDeploy(
    args.contract,
    { account, constructorArgs, contractPackage: args.package }
  );

  printJson(result);
};

export default deployContract;
