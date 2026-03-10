import { exec } from 'child_process';

import callContract from '../commands/callContract.js';
import clean from '../commands/clean.js';
import declareContract from '../commands/declareContract.js';
import deployAccount from '../commands/deployAccount.js';
import deployContract from '../commands/deployContract.js';
import encryptAccount from '../commands/encryptAccount.js';
import invokeContract from '../commands/invokeContract.js';
import openConsole from '../commands/console.js';
import rescueAssets from '../commands/rescueAssets.js';

const withBaseBuilder = (yargs, options = []) => {
  yargs.version(false);
  options.forEach((option) => yargs.option(option.name, option.config));
  return yargs;
};

const commandOption = (name, config) => ({ name, config });

export const commandDefinitions = [
  {
    command: 'build',
    desc: 'Build the contracts',
    options: [],
    handler: () => exec('scarb build').stdout.on('data', (data) => console.log(data))
  },
  {
    command: 'console',
    desc: 'Open the console',
    options: [
      commandOption('network', { describe: 'Network config', alias: 'n', demand: true }),
      commandOption('account', { describe: 'Account to use', alias: 'a' })
    ],
    handler: openConsole
  },
  {
    command: 'deployAccount',
    desc: 'Deploy a new account',
    options: [
      commandOption('network', { describe: 'Network config', alias: 'n', demand: true }),
      commandOption('account', { describe: 'Name of the account', alias: 'a', demand: true }),
      commandOption('encrypted', { describe: 'Encrypt private key', boolean: true, alias: 'e' })
    ],
    handler: deployAccount
  },
  {
    command: 'encryptAccount',
    desc: 'Encrypt an existing account',
    options: [
      commandOption('network', { describe: 'Network config', alias: 'n', demand: true }),
      commandOption('account', { describe: 'Name of the account', alias: 'a', demand: true })
    ],
    handler: encryptAccount
  },
  {
    command: 'clean',
    desc: 'Clean the cache directory',
    options: [
      commandOption('network', { describe: 'Network config', alias: 'n', demand: true })
    ],
    handler: clean
  },
  {
    command: 'call',
    desc: 'Call a function on a deployed contract',
    options: [
      commandOption('network', { describe: 'Network config', alias: 'n', demand: true }),
      commandOption('contract', { describe: 'Contract name', alias: 'c', demand: true }),
      commandOption('package', { describe: 'Contract package name', alias: 'p' }),
      commandOption('method', { describe: 'Method name', alias: 'm', demand: true }),
      commandOption('calldata', { describe: 'Calldata JSON object', alias: 'd', default: '{}' }),
      commandOption('block', { describe: 'Block identifier', alias: 'b' })
    ],
    handler: callContract
  },
  {
    command: 'invoke',
    desc: 'Invoke a function on a deployed contract',
    options: [
      commandOption('network', { describe: 'Network config', alias: 'n', demand: true }),
      commandOption('account', { describe: 'Name of the account', alias: 'a', demand: true }),
      commandOption('contract', { describe: 'Contract name', alias: 'c', demand: true }),
      commandOption('package', { describe: 'Contract package name', alias: 'p' }),
      commandOption('method', { describe: 'Method name', alias: 'm', demand: true }),
      commandOption('calldata', { describe: 'Calldata JSON object', alias: 'd', default: '{}' })
    ],
    handler: invokeContract
  },
  {
    command: 'declare',
    desc: 'Declare a contract class',
    options: [
      commandOption('network', { describe: 'Network config', alias: 'n', demand: true }),
      commandOption('account', { describe: 'Name of the account', alias: 'a', demand: true }),
      commandOption('contract', { describe: 'Contract name', alias: 'c', demand: true }),
      commandOption('package', { describe: 'Contract package name', alias: 'p' })
    ],
    handler: declareContract
  },
  {
    command: 'deploy',
    desc: 'Declare and deploy a contract',
    options: [
      commandOption('network', { describe: 'Network config', alias: 'n', demand: true }),
      commandOption('account', { describe: 'Name of the account', alias: 'a', demand: true }),
      commandOption('contract', { describe: 'Contract name', alias: 'c', demand: true }),
      commandOption('package', { describe: 'Contract package name', alias: 'p' }),
      commandOption('constructorArgs', { describe: 'Constructor args JSON object', alias: 'x', default: '{}' })
    ],
    handler: deployContract
  },
  {
    command: 'rescue',
    desc: 'Rescue assets by executing transfer calls from a legacy account',
    options: [
      commandOption('network', { describe: 'Network config', alias: 'n', demand: true }),
      commandOption('account', { describe: 'Name of the source account', alias: 'a', demand: true }),
      commandOption('to', { describe: 'Destination account address', alias: 't', type: 'string' }),
      commandOption('calls', { describe: 'Raw calls JSON array', default: '[]', type: 'string' }),
      commandOption('erc20', { describe: 'ERC20 transfer list JSON array', default: '[]', type: 'string' }),
      commandOption('erc721', { describe: 'ERC721 transfer list JSON array', default: '[]', type: 'string' }),
      commandOption('erc1155', { describe: 'ERC1155 transfer list JSON array', default: '[]', type: 'string' }),
      commandOption('dryRun', { describe: 'Print calls without sending', boolean: true, default: false }),
      commandOption('noWait', { describe: 'Do not wait for transaction confirmation', boolean: true, default: false })
    ],
    handler: rescueAssets
  }
];

export const registerCommands = (yargsInstance) => {
  commandDefinitions.forEach((definition) => {
    yargsInstance.command({
      command: definition.command,
      desc: definition.desc,
      help: true,
      builder: (y) => withBaseBuilder(y, definition.options),
      handler: definition.handler
    });
  });

  return yargsInstance;
};
