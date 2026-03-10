#!/usr/bin/env node

import yargs from 'yargs/yargs';

import { registerCommands } from './src/cli/commandDefinitions.js';

registerCommands(yargs(process.argv.slice(2)))
  .help()
  .parse();
