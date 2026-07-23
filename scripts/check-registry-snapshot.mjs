/**
 * Ensure skill template UI snapshot matches packages/ui (registry source).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'packages/ui/src');
const snapshot = join(root, 'skills/oh-my-doc/templates/default/packages/ui/src');
const registryPath = join(root, 'registry.json');

function listFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return [path];
  });
}

function relativePosix(from, to) {
  return relative(from, to).split('\\').join('/');
}

const problems = [];

if (!existsSync(registryPath)) {
  problems.push('registry.json missing at repo root');
} else {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  if (registry.name !== 'oh-my-docs') problems.push('registry.json name must be oh-my-docs');
  if (!Array.isArray(registry.items) || registry.items.length === 0) {
    problems.push('registry.json has no items');
  }
}

const leftFiles = listFiles(source);
const rightFiles = listFiles(snapshot);
const leftRel = new Set(leftFiles.map((f) => relativePosix(source, f)));
const rightRel = new Set(rightFiles.map((f) => relativePosix(snapshot, f)));

for (const rel of leftRel) {
  if (!rightRel.has(rel)) {
    problems.push(`missing in skill template UI snapshot: ${rel}`);
    continue;
  }
  const a = readFileSync(join(source, rel));
  const b = readFileSync(join(snapshot, rel));
  if (!a.equals(b)) problems.push(`drift in skill template UI snapshot: ${rel}`);
}
for (const rel of rightRel) {
  if (!leftRel.has(rel)) problems.push(`extra in skill template UI snapshot: ${rel}`);
}

if (problems.length > 0) {
  console.error('Registry/template snapshot check failed:\n');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log('registry.json present; packages/ui matches skill template UI snapshot.');
