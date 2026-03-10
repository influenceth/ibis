const DOT_VERSION_REGEX = /^v?\d+\.\d+(\.\d+)?$/;
const UNDERSCORE_VERSION_REGEX = /^v?\d+_\d+(_\d+)?$/;

const toCairoVersion = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  return String(value);
};

export const normalizeRpcVersion = (version = '0.10') => {
  if (UNDERSCORE_VERSION_REGEX.test(version)) {
    return version.replace(/^v/, '');
  }

  if (DOT_VERSION_REGEX.test(version)) {
    return version.replace(/^v/, '').replace(/\./g, '_');
  }

  return '0_10';
};

export const normalizeNodeUrl = (url, rpcVersion = '0.10') => {
  if (!url) return url;
  if (!url.includes('/rpc')) return `${url.replace(/\/$/, '')}/rpc/v${normalizeRpcVersion(rpcVersion)}`;
  if (/\/rpc\/v\d+_\d+/.test(url)) return url;
  if (url.endsWith('/rpc')) return `${url}/v${normalizeRpcVersion(rpcVersion)}`;
  return url;
};

export const stripRpcPath = (nodeUrl = '') => {
  return nodeUrl.replace(/\/rpc(\/v\d+_\d+)?\/?$/, '');
};

export const makeAccountCtorArgs = ({ provider, address, signer, cairoVersion }) => {
  return {
    provider,
    address,
    signer,
    cairoVersion: toCairoVersion(cairoVersion)
  };
};

export const makeContractCtorArgs = ({ abi, address, providerOrAccount }) => {
  return {
    abi,
    address,
    providerOrAccount
  };
};

export const extractErrorCode = (error) => {
  return error?.errorCode
    || error?.code
    || error?.data?.error_code
    || error?.data?.errorCode
    || error?.response?.data?.error_code
    || error?.response?.data?.errorCode;
};

export const isClassAlreadyDeclared = (error) => {
  const code = String(extractErrorCode(error) || '');
  const message = String(error?.message || '');

  return (
    code.includes('CLASS_ALREADY_DECLARED')
    || message.includes('CLASS_ALREADY_DECLARED')
    || message.includes('is already declared')
  );
};

export const extractTxHash = (res = {}) => {
  return res.transaction_hash || res.transactionHash || res.tx_hash || res.txHash || null;
};

export const extractClassHash = (res = {}) => {
  return res.class_hash || res.classHash || null;
};

export const extractContractAddress = (res = {}) => {
  return res.contract_address || res.contractAddress || res.address || null;
};

export const normalizeDeclareResult = (res = {}) => {
  return {
    class_hash: extractClassHash(res),
    transaction_hash: extractTxHash(res)
  };
};

export const normalizeDeclareAndDeployResult = (res = {}) => {
  const declare = res.declare || res.declaration || {};
  const deploy = res.deploy || res.deployment || {};

  return {
    declare: {
      class_hash: extractClassHash(declare) || extractClassHash(res),
      transaction_hash: extractTxHash(declare) || extractTxHash(res)
    },
    deploy: {
      address: extractContractAddress(deploy) || extractContractAddress(res),
      transaction_hash: extractTxHash(deploy) || extractTxHash(res)
    }
  };
};

export const deployDeclaredClass = async ({ account, classHash, abi, constructorCalldata, options = {} }) => {
  if (typeof account.deployContract === 'function') {
    const deployResult = await account.deployContract({ classHash, constructorCalldata }, options);
    return {
      address: extractContractAddress(deployResult),
      transaction_hash: extractTxHash(deployResult)
    };
  }

  throw new Error('Account.deployContract is not available on this Starknet.js version');
};
