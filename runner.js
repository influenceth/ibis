#!/usr/bin/env node

import { exec } from 'child_process';
import yargs from 'yargs/yargs';

import deployAccount from './src/commands/deployAccount.js';
import openConsole from './src/commands/console.js';
import clean from './src/commands/clean.js';

yargs(process.argv.slice(2))
  .command({
    command: 'build',
    desc: 'Build the contracts',
    help: true,
    builder: (y) => {
      y.version(false);
    },
    handler: () => exec('scarb build').stdout.on('data', (data) => console.log(data))
  })
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
    command: 'clean',
    desc: 'Clean the cache directory',
    help: true,
    builder: (y) => {
      y.version(false);
      y.option('network', { describe: 'Network config ', alias: 'n', demand: true });
    },
    handler: clean
  })
  .help()
  .parse();
