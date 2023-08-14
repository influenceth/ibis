import axios from 'axios';

class StarknetDevnet {
  async predeployedAccountInfo(context, num) {
    const { data } = await axios.get(`${context.provider.baseUrl}/predeployed_accounts`);

    if (!data[num]) {
      return null;
    }

    return {
      address: data[num].address,
      privateKey: data[num].private_key,
      publicKey: data[num].public_key
    };
  }
}

export default StarknetDevnet;