import { Account as StarknetAccount } from 'starknet';

class Account extends StarknetAccount {
  constructor(...args) {
    super(...args);
  }
}

export default Account;