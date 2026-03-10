# Ibis Starknet RPC 0.10 Migration

## Target

- Starknet RPC target: `0.10`
- Starknet.js target: `^8.9.0`
- Node.js runtime target: `>=22`

## Preserved Public Interfaces

- `init(network)` still returns `{ config, provider, accounts, contracts }`.
- Existing CLI commands remain available:
  - `build`
  - `console`
  - `deployAccount`
  - `encryptAccount`
  - `clean`
- Existing account and contract cache file names remain unchanged:
  - `ibis.accounts.json`
  - `ibis.encrypted.json`
  - `<network>.ibis.contracts.json`

## New CLI Commands

- `call`: call a function on a deployed cached contract
- `invoke`: invoke a function on a deployed cached contract
- `declare`: declare a compiled contract class
- `deploy`: declare and deploy a compiled contract
- `rescue`: batch transfer assets out of legacy accounts using ERC20/ERC721/ERC1155 call builders

## Internal Compatibility Layer

`src/lib/starknetCompat.js` provides:

- provider URL normalization for `/rpc/v0_10`
- account/contract constructor compatibility helpers
- response normalization for transaction hash/class hash/address fields
- fallback deploy flow for versions that expose `deployContract` instead of `declareAndDeploy`

## Config Compatibility

- Existing configs continue to load.
- `rpcVersion` can now be set per network config (`"0.10"` by default).
- If a network entry has no `provider.nodeUrl`, ibis now applies a network-based fallback URL.
- Account deployment defaults now target OpenZeppelin `AccountUpgradeable` (`v2.0.0`) class hash:
  - `0x07fa937960fd981bc9a7f54f02786cfa6c6f194fc66cb0c35c1588bd83448062`
- You can override account deployment config per network:
  - `networks.<name>.accountType`
  - `networks.<name>.accountClassHash`

## Validation Checklist

- `npm test`
- `npm run test:integration` with environment values:
  - `IBIS_INTEGRATION_NETWORKS=devnet,sepolia`
  - optional `IBIS_INTEGRATION_ACCOUNT=<name>`
  - optional contract call set:
    - `IBIS_INTEGRATION_CONTRACT=<contract>`
    - `IBIS_INTEGRATION_METHOD=<method>`
    - `IBIS_INTEGRATION_CALLDATA='{"key":"value"}'`
