import { CallData, Contract as StarknetContract } from 'starknet';

class Contract extends StarknetContract {
  constructor(...args) {
    super(...args);
  }

  // Extend Starknet.js to allow calls with calldata as an object
  async call(method, calldata, options) {
    if (typeof calldata === 'object') calldata = this.callData.compile(method, calldata);
    return await super.call(method, calldata, options);
  }

  // Extend Starknet.js to allow invokes with calldata as an object
  async invoke(method, calldata, options) {
    if (typeof calldata === 'object') calldata = this.callData.compile(method, calldata);
    return await super.invoke(method, calldata, options);
  }
}

export default Contract;