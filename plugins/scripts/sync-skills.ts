/**
 * Sync skills/oh-my-doc → optional host plugin wrappers.
 *
 * Usage:
 *   node --experimental-strip-types plugins/scripts/sync-skills.ts
 *   node --experimental-strip-types plugins/scripts/sync-skills.ts --check
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pluginsRoot = join(here, '..');
const repoRoot = join(pluginsRoot, '..');
const canonicalSkill = join(repoRoot, 'skills/oh-my-doc');

const destinations = [
  join(pluginsRoot, 'codex/skills/oh-my-doc'),
  join(pluginsRoot, 'cursor/skills/oh-my-doc'),
  join(pluginsRoot, 'claude-code/skills/oh-my-doc'),
] as const;

function listFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') return [];
      return listFiles(path);
    }
    return [path];
  });
}

function relativePosix(from: string, to: string): string {
  return relative(from, to).split('\\').join('/');
}

function syncCopy(dest: string): void {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(canonicalSkill, dest, { recursive: true });
}

function checkInSync(dest: string): string[] {
  const problems: string[] = [];
  if (!existsSync(dest)) {
    problems.push(`missing destination: ${relativePosix(repoRoot, dest)}`);
    return problems;
  }

  const sharedFiles = listFiles(canonicalSkill);
  const destFiles = listFiles(dest);
  const sharedRel = new Set(sharedFiles.map((file) => relativePosix(canonicalSkill, file)));
  const destRel = new Set(destFiles.map((file) => relativePosix(dest, file)));

  for (const rel of sharedRel) {
    if (!destRel.has(rel)) {
      problems.push(`missing in ${relativePosix(repoRoot, dest)}: ${rel}`);
      continue;
    }
    const left = readFileSync(join(canonicalSkill, rel));
    const right = readFileSync(join(dest, rel));
    if (!left.equals(right)) {
      problems.push(`drift in ${relativePosix(repoRoot, dest)}: ${rel}`);
    }
  }
  for (const rel of destRel) {
    if (!sharedRel.has(rel)) {
      problems.push(`extra in ${relativePosix(repoRoot, dest)}: ${rel}`);
    }
  }
  return problems;
}

function main(): void {
  const checkOnly = process.argv.includes('--check');

  if (!existsSync(join(canonicalSkill, 'SKILL.md'))) {
    console.error(`Canonical skill missing at ${canonicalSkill}`);
    process.exit(1);
  }
  if (!statSync(canonicalSkill).isDirectory()) {
    console.error(`Canonical skill path is not a directory: ${canonicalSkill}`);
    process.exit(1);
  }

  if (checkOnly) {
    const problems = destinations.flatMap((dest) => checkInSync(dest));
    if (problems.length > 0) {
      console.error('Skill sync check failed:\n');
      for (const problem of problems) console.error(`- ${problem}`);
      console.error('\nRun: node --experimental-strip-types plugins/scripts/sync-skills.ts');
      process.exit(1);
    }
    console.log('Plugin skill wrappers match skills/oh-my-doc');
    return;
  }

  for (const dest of destinations) {
    syncCopy(dest);
    console.log(`Synced → ${relativePosix(repoRoot, dest)}`);
  }
}

main();
