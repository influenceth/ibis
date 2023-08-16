import { CallData, Contract as StarknetContract } from 'starknet';

class Contract extends StarknetContract {
  constructor(...args) {
    super(...args);
  }

  // Extend Starknet.js to allow calls with calldata as an object
  async compileAndcall(method, calldata, options) {
    return await super.call(method, this.callData.compile(method, calldata), options);
  }

  // Extend Starknet.js to allow invokes with calldata as an object
  async compileAndinvoke(method, calldata, options) {
    return await super.invoke(method, this.callData.compile(method, calldata), options);
  }
}

export default Contract;