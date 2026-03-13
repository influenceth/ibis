import test from 'node:test';
import assert from 'node:assert/strict';

import axios from 'axios';
import StarknetDevnet from '../src/lib/devnets/StarknetDevnet.js';

test('advanceTime uses devnet_increaseTime RPC', async (t) => {
  const devnet = new StarknetDevnet();
  const originalPost = axios.post;
  let request = null;

  axios.post = async (url, payload) => {
    request = { url, payload };
    return { data: { result: { timestamp_increased_by: 60 } } };
  };

  t.after(() => {
    axios.post = originalPost;
  });

  await devnet.advanceTime({ baseUrl: 'http://127.0.0.1:5050' }, 60);

  assert.deepEqual(request, {
    url: 'http://127.0.0.1:5050/rpc',
    payload: {
      jsonrpc: '2.0',
      id: 1,
      method: 'devnet_increaseTime',
      params: { time: 60 }
    }
  });
});

test('advanceTime throws rpc error message', async (t) => {
  const devnet = new StarknetDevnet();
  const originalPost = axios.post;

  axios.post = async () => ({
    data: {
      error: {
        message: 'cannot increase time'
      }
    }
  });

  t.after(() => {
    axios.post = originalPost;
  });

  await assert.rejects(
    () => devnet.advanceTime({ baseUrl: 'http://127.0.0.1:5050' }, 60),
    /cannot increase time/
  );
});

test('predeployedAccountInfo uses devnet_getPredeployedAccounts RPC and maps keys', async (t) => {
  const devnet = new StarknetDevnet();
  const originalPost = axios.post;
  let request = null;

  axios.post = async (url, payload) => {
    request = { url, payload };
    return {
      data: {
        result: [
          {
            address: '0xabc',
            private_key: '0x123',
            public_key: '0x456'
          }
        ]
      }
    };
  };

  t.after(() => {
    axios.post = originalPost;
  });

  const account = await devnet.predeployedAccountInfo({ baseUrl: 'http://127.0.0.1:5050' }, 0);

  assert.deepEqual(request, {
    url: 'http://127.0.0.1:5050/rpc',
    payload: {
      jsonrpc: '2.0',
      id: 1,
      method: 'devnet_getPredeployedAccounts',
      params: []
    }
  });
  assert.deepEqual(account, {
    address: '0xabc',
    privateKey: '0x123',
    publicKey: '0x456'
  });
});

test('sendMessageToL2 uses devnet_postmanSendMessageToL2 RPC and normalizes tx hash', async (t) => {
  const devnet = new StarknetDevnet();
  const originalPost = axios.post;
  let request = null;

  axios.post = async (url, payload) => {
    request = { url, payload };
    return {
      data: {
        result: {
          tx_hash: '0xbeef'
        }
      }
    };
  };

  t.after(() => {
    axios.post = originalPost;
  });

  const message = [{ from_address: '0x1', to_address: '0x2', payload: ['0x3'] }];
  const result = await devnet.sendMessageToL2({ baseUrl: 'http://127.0.0.1:5050' }, message);

  assert.deepEqual(request, {
    url: 'http://127.0.0.1:5050/rpc',
    payload: {
      jsonrpc: '2.0',
      id: 1,
      method: 'devnet_postmanSendMessageToL2',
      params: message
    }
  });
  assert.deepEqual(result, {
    data: {
      tx_hash: '0xbeef',
      transaction_hash: '0xbeef'
    }
  });
});

test('sendMessageToL2 throws rpc message on devnet error response', async (t) => {
  const devnet = new StarknetDevnet();
  const originalPost = axios.post;

  axios.post = async () => ({
    data: {
      error: {
        message: 'postman failed'
      }
    }
  });

  t.after(() => {
    axios.post = originalPost;
  });

  const message = [{ from_address: '0x1', to_address: '0x2', payload: ['0x3'] }];
  await assert.rejects(
    () => devnet.sendMessageToL2({ baseUrl: 'http://127.0.0.1:5050' }, message),
    /postman failed/
  );
});
