/**
 * Release gate: skill version + plugin manifests (no public npm packages).
 *
 * Usage:
 *   node scripts/check-release-version.mjs
 *   node scripts/check-release-version.mjs v0.2.0
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkReleaseVersions, versionFromTag } from './lib/release-version.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
const want =
  arg ??
  (process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : process.env.OMD_RELEASE_TAG);
const wantVersion = want ? versionFromTag(want) : undefined;
const result = checkReleaseVersions(root, wantVersion);

if (!result.ok) {
  console.error('Release version check failed:\n');
  for (const problem of result.problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(`Release versions aligned at ${result.version} (skill + plugins; no public npm packages).`);
