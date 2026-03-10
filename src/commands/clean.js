import fs from 'fs';
import path from 'path';

import Config from '../lib/Config.js';
import { CACHE_FILE } from '../constants.js';

const clean = (args) => {
  const config = new Config(args.network);
  const cacheFile = path.resolve(config.contractsConfig.cache, `${config.network}.${CACHE_FILE}`);

  if (!fs.existsSync(cacheFile)) {
    console.log(`No cache file found for network ${config.network}`);
    return;
  }

  fs.unlinkSync(cacheFile);
  console.log(`Removed ${cacheFile}`);
}

export default clean;
