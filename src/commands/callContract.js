import Contracts from '../lib/Contracts.js';
import Config from '../lib/Config.js';
import Provider from '../lib/Provider.js';
import { parseJsonArg, printJson } from './helpers.js';

const callContract = async (args) => {
  const config = new Config(args.network);
  const provider = Provider.fromConfig(config);
  const contracts = new Contracts({ config, provider });
  const contract = contracts.deployed(args.contract, { contractPackage: args.package });
  const calldata = parseJsonArg(args.calldata, '--calldata');
  const callOptions = args.block ? { blockIdentifier: args.block } : undefined;
  const result = await contract.compileAndCall(args.method, calldata, callOptions);
  printJson(result);
};

export default callContract;
