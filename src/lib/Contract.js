import { CallData, Contract as StarknetContract } from 'starknet';

class Contract extends StarknetContract {
  constructor(...args) {
    super(...args);
  }

  async compileAndInvoke(method, args, options) {
    const calldata = this.callData.compile(method, args);
    return await this.invoke(method, calldata, options);
  }
}

export default Contract;