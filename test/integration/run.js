import process from 'process';

import init from '../../index.js';

const networks = (process.env.IBIS_INTEGRATION_NETWORKS || '').split(',').map((n) => n.trim()).filter(Boolean);

if (networks.length === 0) {
  console.log('Skipping integration tests: set IBIS_INTEGRATION_NETWORKS to run.');
  process.exit(0);
}

const runForNetwork = async (network) => {
  console.log(`Running integration checks on ${network}...`);
  const { provider, accounts, contracts } = init(network);
  const blockNumber = await provider.getBlockNumber();
  console.log(`Latest block number on ${network}: ${blockNumber}`);

  if (process.env.IBIS_INTEGRATION_ACCOUNT) {
    const account = await accounts.account(process.env.IBIS_INTEGRATION_ACCOUNT);
    if (!account) {
      throw new Error(`Account ${process.env.IBIS_INTEGRATION_ACCOUNT} not found for ${network}`);
    }
  }

  if (process.env.IBIS_INTEGRATION_CONTRACT && process.env.IBIS_INTEGRATION_METHOD) {
    const deployed = contracts.deployed(process.env.IBIS_INTEGRATION_CONTRACT, {
      contractPackage: process.env.IBIS_INTEGRATION_PACKAGE || null
    });
    const calldata = process.env.IBIS_INTEGRATION_CALLDATA ? JSON.parse(process.env.IBIS_INTEGRATION_CALLDATA) : {};
    const result = await deployed.compileAndCall(process.env.IBIS_INTEGRATION_METHOD, calldata);
    console.log(`Contract call result on ${network}:`, result);
  }
};

for (const network of networks) {
  await runForNetwork(network);
}

console.log('Integration checks completed.');
