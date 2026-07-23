/**
 * Sync plugins/shared/skills/setup → platform adapters and the CLI skill bundle.
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
const sharedSkill = join(pluginsRoot, 'shared/skills/setup');

const destinations = [
  join(pluginsRoot, 'codex/skills/setup'),
  join(pluginsRoot, 'cursor/skills/setup'),
  join(pluginsRoot, 'claude-code/skills/setup'),
  join(repoRoot, 'packages/cli/skills/setup'),
] as const;

function listFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return [path];
  });
}

function relativePosix(from: string, to: string): string {
  return relative(from, to).split('\\').join('/');
}

function syncCopy(dest: string): void {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(sharedSkill, dest, { recursive: true });
}

function checkInSync(dest: string): string[] {
  const problems: string[] = [];
  if (!existsSync(dest)) {
    problems.push(`missing destination: ${relativePosix(repoRoot, dest)}`);
    return problems;
  }

  const sharedFiles = listFiles(sharedSkill);
  const destFiles = listFiles(dest);
  const sharedRel = new Set(sharedFiles.map((file) => relativePosix(sharedSkill, file)));
  const destRel = new Set(destFiles.map((file) => relativePosix(dest, file)));

  for (const rel of sharedRel) {
    if (!destRel.has(rel)) {
      problems.push(`missing in ${relativePosix(repoRoot, dest)}: ${rel}`);
      continue;
    }
    const left = readFileSync(join(sharedSkill, rel));
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

  if (!existsSync(join(sharedSkill, 'SKILL.md'))) {
    console.error(`Shared skill missing at ${sharedSkill}`);
    process.exit(1);
  }
  if (!statSync(sharedSkill).isDirectory()) {
    console.error(`Shared skill path is not a directory: ${sharedSkill}`);
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
    console.log('Skill adapters and CLI bundle match plugins/shared/skills/setup');
    return;
  }

  for (const dest of destinations) {
    syncCopy(dest);
    console.log(`Synced → ${relativePosix(repoRoot, dest)}`);
  }
}

main();
