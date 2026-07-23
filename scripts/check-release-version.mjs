#!/usr/bin/env node
/**
 * Refuse to publish unless the git tag matches every public package version
 * and every agent plugin manifest version.
 *
 * Usage:
 *   node scripts/check-release-version.mjs v0.1.0
 *   node scripts/check-release-version.mjs          # consistency only (no tag)
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkReleaseVersions, versionFromTag } from './lib/release-version.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tag = process.argv[2];

let want;
try {
  want = tag ? versionFromTag(tag) : undefined;
} catch (error) {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}

const result = checkReleaseVersions(root, want);
if (!result.ok) {
  const label = tag ?? `shared version ${result.version || '(unknown)'}`;
  console.error(`✗ ${label} does not match ${result.problems.length} target(s):\n${result.problems.map((p) => `  ${p}`).join('\n')}`);
  console.error('\nBump every public package and plugin manifest to the same version before tagging.');
  process.exit(1);
}

const label = tag ?? `v${result.version}`;
console.log(`✓ ${label} matches all ${result.checked.length} public packages and plugin manifests:`);
for (const name of result.checked.sort()) console.log(`  ${name}@${result.version}`);
