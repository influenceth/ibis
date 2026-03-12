import axios from 'axios';

class StarknetDevnet {
  #baseUrl(context) {
    return context.baseUrl || context.nodeUrl || '';
  }

  #rpcUrl(context) {
    return `${this.#baseUrl(context).replace(/\/$/, '')}/rpc`;
  }

  async advanceTime(context, time) {
    await axios.post(`${this.#baseUrl(context)}/increase_time`, { time });
  }

  async createBlock(context) {
    const { data } = await axios.post(`${this.#baseUrl(context)}/create_block`);
    return { block_hash: data.block_hash };
  }

  async mint(context, address, amount) {
    const { data } = await axios.post(`${this.#baseUrl(context)}/mint`, { address, amount });
    return { transaction_hash: data.tx_hash };
  }

  async predeployedAccountInfo(context, num) {
    const { data } = await axios.post(this.#rpcUrl(context), {
      jsonrpc: '2.0',
      id: 1,
      method: 'devnet_getPredeployedAccounts',
      params: []
    });

    const accounts = Array.isArray(data?.result) ? data.result : data?.result?.accounts;
    if (!Array.isArray(accounts) || !accounts[num]) return null;

    return {
      address: accounts[num].address,
      privateKey: accounts[num].private_key,
      publicKey: accounts[num].public_key
    };
  }

  async sendMessageToL2(context, message) {
    return await axios.post(`${this.#baseUrl(context)}/postman/send_message_to_l2`, message);
  }

  async setTime(context, time) {
    await axios.post(`${this.#baseUrl(context)}/set_time`, { time });
  }

  async restart(context) {
    await axios.post(`${this.#baseUrl(context)}/restart`);
  }
}

export default StarknetDevnet;
