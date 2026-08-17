const fs = require('node:fs');
const path = require('node:path');
const __partsDir = path.join(__dirname, 'server_chunks');
const __bundleSource = fs.readdirSync(__partsDir)
  .filter((name) => /^chunk-\d+\.txt$/.test(name))
  .sort()
  .map((name) => fs.readFileSync(path.join(__partsDir, name), 'utf8'))
  .join('');
eval(__bundleSource);
