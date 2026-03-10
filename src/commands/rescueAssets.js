import Accounts from '../lib/Accounts.js';
import Config from '../lib/Config.js';
import Provider from '../lib/Provider.js';
import { extractTxHash } from '../lib/starknetCompat.js';
import { parseJsonArg, printJson } from './helpers.js';

const U128_MASK = (1n << 128n) - 1n;

const toBigInt = (value, label) => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string' && value.trim() !== '') return BigInt(value);
  throw new Error(`Invalid ${label} value: ${value}`);
};

const toHex = (value) => `0x${value.toString(16)}`;

const toFelt = (value, label) => toHex(toBigInt(value, label));

const toAddressString = (value, label) => {
  if (typeof value === 'number') {
    throw new Error(`Invalid ${label}: numeric value received (likely precision loss). Pass as quoted 0x string.`);
  }

  if (typeof value === 'bigint') {
    return toHex(value);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  throw new Error(`Invalid ${label} value: ${value}`);
};

const splitU256 = (value, label) => {
  const big = toBigInt(value, label);
  const low = big & U128_MASK;
  const high = big >> 128n;
  return [toHex(low), toHex(high)];
};

const normalizeRawCalls = (calls) => {
  return calls.map((call, index) => {
    if (!call?.to || !call?.entrypoint || !Array.isArray(call?.calldata)) {
      throw new Error(`Invalid raw call at index ${index}. Required keys: to, entrypoint, calldata[]`);
    }

    return {
      contractAddress: toAddressString(call.to, `raw call ${index} "to"`),
      entrypoint: call.entrypoint,
      calldata: call.calldata.map((value) => String(value))
    };
  });
};

const buildErc20Calls = ({ erc20, to }) => {
  return erc20.map((entry, index) => {
    if (!entry?.token) throw new Error(`Missing token address for erc20 item ${index}`);

    const recipient = toAddressString(entry.to || to, `erc20[${index}].to`);
    if (!recipient) throw new Error(`Missing recipient (--to or erc20[${index}].to)`);

    const method = entry.method || 'transfer';
    const calldata = entry.calldata || [
      recipient,
      ...splitU256(entry.amount, `erc20[${index}].amount`)
    ];

    return {
      contractAddress: toAddressString(entry.token, `erc20[${index}].token`),
      entrypoint: method,
      calldata: calldata.map((value) => String(value))
    };
  });
};

const buildErc721Calls = ({ erc721, accountAddress, to }) => {
  return erc721.map((entry, index) => {
    if (!entry?.token) throw new Error(`Missing token address for erc721 item ${index}`);

    const from = toAddressString(entry.from || accountAddress, `erc721[${index}].from`);
    const recipient = toAddressString(entry.to || to, `erc721[${index}].to`);
    if (!recipient) throw new Error(`Missing recipient (--to or erc721[${index}].to)`);

    const method = entry.method || 'safeTransferFrom';
    const tokenIdType = entry.tokenIdType || 'u256';

    let tokenIdCalldata;
    if (tokenIdType === 'felt') {
      tokenIdCalldata = [toFelt(entry.tokenId, `erc721[${index}].tokenId`)];
    } else {
      tokenIdCalldata = splitU256(entry.tokenId, `erc721[${index}].tokenId`);
    }

    const calldata = entry.calldata || [from, recipient, ...tokenIdCalldata];

    return {
      contractAddress: toAddressString(entry.token, `erc721[${index}].token`),
      entrypoint: method,
      calldata: calldata.map((value) => String(value))
    };
  });
};

const buildErc1155Calls = ({ erc1155, accountAddress, to }) => {
  return erc1155.map((entry, index) => {
    if (!entry?.token) throw new Error(`Missing token address for erc1155 item ${index}`);

    const from = toAddressString(entry.from || accountAddress, `erc1155[${index}].from`);
    const recipient = toAddressString(entry.to || to, `erc1155[${index}].to`);
    if (!recipient) throw new Error(`Missing recipient (--to or erc1155[${index}].to)`);

    const method = entry.method || 'safeTransferFrom';
    const idType = entry.idType || 'u256';
    const valueType = entry.valueType || 'u256';

    const idCalldata = idType === 'felt'
      ? [toFelt(entry.id, `erc1155[${index}].id`)]
      : splitU256(entry.id, `erc1155[${index}].id`);

    const valueCalldata = valueType === 'felt'
      ? [toFelt(entry.value, `erc1155[${index}].value`)]
      : splitU256(entry.value, `erc1155[${index}].value`);

    const data = (entry.data || []).map((value) => String(value));
    const calldata = entry.calldata || [
      from,
      recipient,
      ...idCalldata,
      ...valueCalldata,
      toHex(BigInt(data.length)),
      ...data
    ];

    return {
      contractAddress: toAddressString(entry.token, `erc1155[${index}].token`),
      entrypoint: method,
      calldata: calldata.map((value) => String(value))
    };
  });
};

const rescueAssets = async (args) => {
  const config = new Config(args.network);
  const provider = Provider.fromConfig(config);
  const accounts = new Accounts({ config, provider });

  const account = await accounts.account(args.account);
  if (!account) throw new Error(`Account ${args.account} not found`);

  const rawCalls = parseJsonArg(args.calls || '[]', '--calls');
  const erc20 = parseJsonArg(args.erc20 || '[]', '--erc20');
  const erc721 = parseJsonArg(args.erc721 || '[]', '--erc721');
  const erc1155 = parseJsonArg(args.erc1155 || '[]', '--erc1155');

  if (!Array.isArray(rawCalls) || !Array.isArray(erc20) || !Array.isArray(erc721) || !Array.isArray(erc1155)) {
    throw new Error('Expected --calls, --erc20, --erc721, --erc1155 to be JSON arrays');
  }

  const calls = [
    ...normalizeRawCalls(rawCalls),
    ...buildErc20Calls({ erc20, to: args.to }),
    ...buildErc721Calls({ erc721, accountAddress: account.address, to: args.to }),
    ...buildErc1155Calls({ erc1155, accountAddress: account.address, to: args.to })
  ];

  if (calls.length === 0) {
    throw new Error('No calls provided. Supply at least one of --calls, --erc20, --erc721, or --erc1155');
  }

  if (args.dryRun) {
    printJson({
      account: account.address,
      calls
    });
    return;
  }

  const result = await account.execute(calls);
  const transactionHash = extractTxHash(result);

  if (!args.noWait && transactionHash) {
    await provider.waitForTransaction(transactionHash);
  }

  printJson({
    transaction_hash: transactionHash,
    calls
  });
};

export default rescueAssets;
