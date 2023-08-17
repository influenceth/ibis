import axios from 'axios';

class StarknetDevnet {
  async advanceTime(context, time) {
    await axios.post(`${context.provider.baseUrl}/advance_time`, { time });
  }

  async createBlock(context) {
    const { data } = await axios.post(`${context.provider.baseUrl}/create_block`);
    return { block_hash: data.block_hash };
  }

  async mint(context, address, amount) {
    const { data } = await axios.post(`${context.provider.baseUrl}/mint`, { address, amount });
    return { transaction_hash: data.tx_hash };
  }

  async predeployedAccountInfo(context, num) {
    const { data } = await axios.get(`${context.provider.baseUrl}/predeployed_accounts`);
    if (!data[num]) return null;
    return { address: data[num].address, privateKey: data[num].private_key, publicKey: data[num].public_key };
  }

  async sendMessageToL2(context, message) {
    return await axios.post(`${context.provider.baseUrl}/postman/send_message_to_l2`, message);
  }

  async setTime(context, time) {
    await axios.post(`${context.provider.baseUrl}/set_time`, { time });
  }

  async restart(context) {
    await axios.post(`${context.provider.baseUrl}/restart`);
  }
}

export default StarknetDevnet;