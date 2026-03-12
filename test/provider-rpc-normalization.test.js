import test from 'node:test';
import assert from 'node:assert/strict';

import Provider from '../src/lib/Provider.js';
import { normalizeNodeUrl } from '../src/lib/starknetCompat.js';

test('normalizeNodeUrl keeps versioned rpc path for non-devnet networks', () => {
  assert.equal(
    normalizeNodeUrl('https://example.com', '0.10'),
    'https://example.com/rpc/v0_10'
  );
});

test('normalizeNodeUrl enforces /rpc without version for devnet', () => {
  assert.equal(
    normalizeNodeUrl('http://127.0.0.1:5050', 'devnet'),
    'http://127.0.0.1:5050/rpc'
  );
  assert.equal(
    normalizeNodeUrl('http://127.0.0.1:5050/rpc/v0_10', 'devnet'),
    'http://127.0.0.1:5050/rpc'
  );
});

test('Provider.fromConfig uses /rpc only for devnet', () => {
  const provider = Provider.fromConfig({
    networkConfig: {
      network: 'devnet',
      rpcVersion: '0.10',
      provider: {
        nodeUrl: 'http://127.0.0.1:5050'
      }
    }
  });

  assert.equal(provider.channel.nodeUrl, 'http://127.0.0.1:5050/rpc');
});

test('Provider.fromConfig falls back to default rpc URL for legacy config without provider.nodeUrl', () => {
  const provider = Provider.fromConfig({
    networkConfig: {
      network: 'SN_MAIN'
    }
  });

  assert.equal(provider.channel.nodeUrl, 'https://starknet-mainnet.public.blastapi.io/rpc/v0_10');
});

test('Provider.fromConfig defaults rpcVersion to 0.10 when omitted', () => {
  const provider = Provider.fromConfig({
    networkConfig: {
      network: 'mainnet',
      provider: {
        nodeUrl: 'https://rpc.influenceth.io'
      }
    }
  });

  assert.equal(provider.channel.nodeUrl, 'https://rpc.influenceth.io/rpc/v0_10');
});
