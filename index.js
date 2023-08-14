#!/usr/bin/env node

import yargs from 'yargs/yargs';

import accountInfo from './src/commands/accountInfo.js';
import deployAccount from './src/commands/deployAccount.js';
import openConsole from './src/commands/console.js';

yargs(process.argv.slice(2))
  .command({
    command: 'console',
    desc: 'Open the console',
    help: true,
    builder: (y) => {
      y.version(false);
      y.option('network', { describe: 'Network config ', alias: 'n', demand: true });
      y.option('account', { describe: 'Account to use', alias: 'a' })
    },
    handler: openConsole
  })
  .command({
    command: 'deployAccount',
    desc: 'Deploy a new account',
    help: true,
    builder: (y) => {
      y.version(false);
      y.option('network', { describe: 'Network config ', alias: 'n', demand: true });
      y.option('account', { describe: 'Name of the account', alias: 'a', demand: true });
      y.option('encrypted', { describe: 'Encrypt private key', boolean: true, alias: 'e' })
    },
    handler: deployAccount
  })
  .command({
    command: 'accountInfo',
    desc: 'Retrieve account info',
    help: true,
    builder: (y) => {
      y.version(false);
      y.option('network', { describe: 'Network config ', alias: 'n', demand: true });
      y.option('account', { describe: 'Name of the account', alias: 'a', demand: true });
    },
    handler: accountInfo
  })
  .help()
  .parse();
