const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const isCi = process.env.CI === 'true' || process.env.CI === '1';
if (isCi) {
  console.log('CI detected, skipping git hooks.');
  process.exit(0);
}

const binName = process.platform === 'win32' ? 'simple-git-hooks.cmd' : 'simple-git-hooks';
const binPath = path.join(__dirname, '..', 'node_modules', '.bin', binName);
const hooksDir = path.join(__dirname, '..', '.git', 'hooks');

if (!fs.existsSync(hooksDir)) {
  console.log('Git hooks directory not found, skipping.');
  process.exit(0);
}

try {
  fs.accessSync(hooksDir, fs.constants.W_OK);
} catch (err) {
  console.log('Git hooks directory not writable, skipping.');
  process.exit(0);
}

if (!fs.existsSync(binPath)) {
  console.log('simple-git-hooks not installed, skipping.');
  process.exit(0);
}

const result = spawnSync(binPath, { stdio: 'inherit' });
process.exit(result.status ?? 0);
