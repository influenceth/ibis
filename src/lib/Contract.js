import { CallData, Contract as StarknetContract } from 'starknet';

class Contract extends StarknetContract {
  constructor(...args) {
    super(...args);
  }

  async invoke(method, calldata, options) {
    if (typeof args === 'object') calldata = this.callData.compile(method, args);
    return await super.invoke(method, calldata, options);
  }
}

export default Contract;