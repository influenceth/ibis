import test from 'node:test';
import assert from 'node:assert/strict';

import Contract from '../src/lib/Contract.js';

const minimalAbi = [
  {
    type: 'constructor',
    name: 'constructor',
    inputs: [{ name: 'public_key', type: 'core::felt252' }]
  },
  {
    type: 'function',
    name: '__execute__',
    inputs: [{ name: 'calls', type: 'core::array::Array::<core::starknet::account::Call>' }],
    outputs: [],
    state_mutability: 'external'
  }
];

test('contract.connect rebinds providerOrAccount for backward compatibility', () => {
  const initialProvider = { callContract: async () => [] };
  const contract = new Contract(minimalAbi, '0x1', initialProvider);
  const nextProvider = { execute: async () => ({ transaction_hash: '0x1' }) };

  const result = contract.connect(nextProvider);

  assert.equal(result, contract);
  assert.equal(contract.providerOrAccount, nextProvider);
});
