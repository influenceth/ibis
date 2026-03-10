import Accounts from '../lib/Accounts.js';
import Contracts from '../lib/Contracts.js';
import Config from '../lib/Config.js';
import Provider from '../lib/Provider.js';
import { extractTxHash } from '../lib/starknetCompat.js';
import { parseJsonArg, printJson } from './helpers.js';

const invokeContract = async (args) => {
  const config = new Config(args.network);
  const provider = Provider.fromConfig(config);
  const accounts = new Accounts({ config, provider });
  const contracts = new Contracts({ config, provider });

  const account = await accounts.account(args.account);
  if (!account) throw new Error(`Account ${args.account} not found`);

  const contract = contracts.deployed(args.contract, { account, contractPackage: args.package });
  const calldata = parseJsonArg(args.calldata, '--calldata');
  const invokeResult = await contract.compileAndInvoke(args.method, calldata);
  const transactionHash = extractTxHash(invokeResult);

  if (transactionHash) {
    await provider.waitForTransaction(transactionHash);
  }

  printJson({
    transaction_hash: transactionHash,
    result: invokeResult
  });
};

export default invokeContract;
