import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACCOUNTS_FILE,
  CACHE_FILE,
  CONFIG_FILE,
  KEYS_FILE
} from '../src/constants.js';

test('storage file names remain backward compatible', () => {
  assert.equal(ACCOUNTS_FILE, 'ibis.accounts.json');
  assert.equal(KEYS_FILE, 'ibis.encrypted.json');
  assert.equal(CACHE_FILE, 'ibis.contracts.json');
  assert.equal(CONFIG_FILE, 'ibis.config.json');
});
