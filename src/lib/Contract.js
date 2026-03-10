import { CallData, Contract as StarknetContract } from 'starknet';
import { makeContractCtorArgs } from './starknetCompat.js';

class Contract extends StarknetContract {
  constructor(abiOrOptions, address, providerOrAccount) {
    if (StarknetContract.length <= 1) {
      const options = (abiOrOptions && typeof abiOrOptions === 'object' && abiOrOptions.abi)
        ? abiOrOptions
        : makeContractCtorArgs({ abi: abiOrOptions, address, providerOrAccount });

      super(options);
      return;
    }

    super(abiOrOptions, address, providerOrAccount);
  }

  #compile(method, calldata) {
    if (!calldata || typeof calldata !== 'object' || Array.isArray(calldata)) {
      return calldata;
    }

    if (this.callData?.compile) {
      return this.callData.compile(method, calldata);
    }

    if (this.abi) {
      return new CallData(this.abi).compile(method, calldata);
    }

    return calldata;
  }

  // Extend Starknet.js to allow calls with calldata as an object
  async compileAndCall(method, calldata, options) {
    return await super.call(method, this.#compile(method, calldata), options);
  }

  // Extend Starknet.js to allow invokes with calldata as an object
  async compileAndInvoke(method, calldata, options) {
    return await super.invoke(method, this.#compile(method, calldata), options);
  }

  // Backward compatibility: starknet.js v8 removed Contract.connect().
  connect(providerOrAccount) {
    if (!providerOrAccount) {
      throw new Error('Provider or account is required');
    }

    this.providerOrAccount = providerOrAccount;
    return this;
  }
}

export default Contract;
