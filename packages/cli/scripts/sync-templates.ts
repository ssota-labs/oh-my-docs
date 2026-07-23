import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const repoTemplate = join(packageRoot, '../../templates/default');
const dest = join(packageRoot, 'templates/default');

if (!existsSync(repoTemplate)) {
  console.error(`Canonical template missing at ${repoTemplate}`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dirname(dest), { recursive: true });
cpSync(repoTemplate, dest, { recursive: true });
console.log(`Synced templates/default → packages/cli/templates/default`);
