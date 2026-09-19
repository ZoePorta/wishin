// scripts/link-env.js
const fs = require('fs');
const path = require('path');

const rootEnv = path.resolve(__dirname, '..', '.env');
const targetDir = path.resolve(__dirname, '..', 'apps/expo-client');
const targetEnv = path.join(targetDir, '.env');
const relativeTarget = path.relative(targetDir, rootEnv); // '../../.env'

// If the root .env doesn't exist yet (e.g. fresh clone before setup,
// or a remote environment like EAS Build), there's nothing to link. Exit quietly.
if (!fs.existsSync(rootEnv)) {
  process.exit(0);
}

// If something already exists at the target (previous symlink or manual file), leave it alone.
try {
  fs.lstatSync(targetEnv);
  process.exit(0); // already exists, don't overwrite
} catch {
  // doesn't exist yet, continue
}

try {
  fs.symlinkSync(relativeTarget, targetEnv);
  console.log(`✓ Linked apps/expo-client/.env -> ${relativeTarget}`);
} catch (err) {
  // Windows without symlink permissions (missing developer mode): fall back to a copy
  fs.copyFileSync(rootEnv, targetEnv);
  console.log('⚠ Could not create symlink (likely Windows without developer mode). Copied the .env instead — remember to keep it in sync manually if you edit it.');
}