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
      y.option('network', { describe: 'Network config ', demand: true });
    },
    handler: openConsole
  })
  .command({
    command: 'deployAccount',
    desc: 'Deploy a new account',
    help: true,
    builder: (y) => {
      y.version(false);
      y.option('network', { describe: 'Network config ', demand: true });
      y.option('name', { describe: 'Name of the account', demand: true });
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
      y.option('network', { describe: 'Network config ', demand: true });
      y.option('name', { describe: 'Name of the account', demand: true });
    },
    handler: accountInfo
  })
  .help()
  .parse();
