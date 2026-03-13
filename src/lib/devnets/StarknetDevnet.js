import axios from 'axios';

class StarknetDevnet {
  #baseUrl(context) {
    return context.baseUrl || context.nodeUrl || '';
  }

  #rpcUrl(context) {
    return `${this.#baseUrl(context).replace(/\/$/, '')}/rpc`;
  }

  async advanceTime(context, time) {
    const { data } = await axios.post(this.#rpcUrl(context), {
      jsonrpc: '2.0',
      id: 1,
      method: 'devnet_increaseTime',
      params: { time }
    });

    if (data?.error) {
      throw new Error(data.error.message || 'devnet_increaseTime failed');
    }
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
    const { data } = await axios.post(this.#rpcUrl(context), {
      jsonrpc: '2.0',
      id: 1,
      method: 'devnet_postmanSendMessageToL2',
      params: message
    });

    if (data?.error) {
      throw new Error(data.error.message || 'devnet_postmanSendMessageToL2 failed');
    }

    // keep existing call sites working (they expect axios-like { data: ... })
    const result = data?.result || {};
    return {
      data: {
        ...result,
        transaction_hash: result.transaction_hash || result.tx_hash
      }
    };
  }

  async setTime(context, time) {
    await axios.post(`${this.#baseUrl(context)}/set_time`, { time });
  }

  async restart(context) {
    await axios.post(`${this.#baseUrl(context)}/restart`);
  }
}

export default StarknetDevnet;
