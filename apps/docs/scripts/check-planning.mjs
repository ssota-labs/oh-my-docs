import { resolve } from 'node:path';

import { validatePlanning } from '../../../skills/oh-my-doc/runtime/planning.mjs';

const contentDirectory = resolve(import.meta.dirname, '../content/docs');
const problems = validatePlanning(contentDirectory);

if (problems.length > 0) {
  console.error(`Planning validation found ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log('Planning IDs, references, lifecycle states, and navigation are valid.');
