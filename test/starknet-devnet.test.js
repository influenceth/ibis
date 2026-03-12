import test from 'node:test';
import assert from 'node:assert/strict';

import axios from 'axios';
import StarknetDevnet from '../src/lib/devnets/StarknetDevnet.js';

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
