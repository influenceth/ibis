import { Account as StarknetAccount } from 'starknet';
import { makeAccountCtorArgs } from './starknetCompat.js';

class Account extends StarknetAccount {
  constructor(providerOrOptions, address, signer, cairoVersion) {
    if (StarknetAccount.length <= 1) {
      const options = (providerOrOptions && typeof providerOrOptions === 'object' && providerOrOptions.provider)
        ? providerOrOptions
        : makeAccountCtorArgs({ provider: providerOrOptions, address, signer, cairoVersion });

      super(options);
      return;
    }

    super(providerOrOptions, address, signer, cairoVersion);
  }
}

export default Account;
