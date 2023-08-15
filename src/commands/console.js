import chalk from 'chalk';
import * as starknet from 'starknet';
import repl from 'repl';

import Accounts from '../lib/Accounts.js';
import Config from '../lib/Config.js';
import Contracts from '../lib/Contracts.js';
import Provider from '../lib/Provider.js';

export default async function (args) {
  console.log(`
    ${chalk.cyanBright("  ,--.,-----.  ,--. ,---.  ")}
    ${chalk.cyanBright("  |  ||  |) /_ |  |'   .-' ")}
    ${chalk.cyanBright("  |  ||  .-.  \\|  |`.  `-.")}
    ${chalk.cyanBright("  |  ||  '--' /|  |.-'    |")}
    ${chalk.cyanBright("  `--'`------' `--'`-----' ")}

      Available Globals:
        ${chalk.whiteBright('accounts')}: Accounts factory
        ${chalk.whiteBright('contracts')}: Contracts factory
        ${chalk.whiteBright('config')}: Config manager
        ${chalk.whiteBright('provider')}: Provider
        ${chalk.whiteBright('starknet')}: Starknet.js package
  `);

  const r = repl.start({ prompt: chalk.cyanBright('ibis ') + chalk.greenBright('➜ '), ignoreUndefined: true });
  r.context.config = new Config(args.network);
  r.context.provider = Provider.fromConfig(r.context.config);
  r.context.accounts = new Accounts({ config: r.context.config, provider: r.context.provider });
  r.context.contracts = new Contracts({ config: r.context.config, provider: r.context.provider });
  r.context.starknet = starknet;
};
