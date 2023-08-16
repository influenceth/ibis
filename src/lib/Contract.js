import { CallData, Contract as StarknetContract } from 'starknet';

class Contract extends StarknetContract {
  constructor(...args) {
    super(...args);
  }

  async invoke(method, _calldata, options) {
    let calldata = _calldata;
    if (typeof args === 'object') calldata = this.callData.compile(method, _calldata);
    return await super.invoke(method, calldata, options);
  }
}

export default Contract;