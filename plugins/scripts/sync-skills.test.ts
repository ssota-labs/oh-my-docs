import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pluginsRoot = join(here, '..');
const sharedSkill = join(pluginsRoot, 'shared/skills/setup');
const syncScript = join(here, 'sync-skills.ts');

const adapterSkills = [
  join(pluginsRoot, 'codex/skills/setup'),
  join(pluginsRoot, 'cursor/skills/setup'),
  join(pluginsRoot, 'claude-code/skills/setup'),
] as const;

test('shared setup skill has progressive disclosure layout', () => {
  for (const rel of [
    'SKILL.md',
    'agents/openai.yaml',
    'scripts/run-setup.mjs',
    'references/methodology.md',
    'references/information-architecture.md',
    'references/planning-workflow.md',
    'references/implementation-workflow.md',
    'references/document-contracts.md',
    'references/agent-compatibility.md',
    'assets/AGENTS.md',
    'assets/CLAUDE.md',
  ]) {
    assert.ok(existsSync(join(sharedSkill, rel)), `missing ${rel}`);
  }

  const skill = readFileSync(join(sharedSkill, 'SKILL.md'), 'utf8');
  assert.match(skill, /disable-model-invocation:\s*true/);
  assert.match(skill, /name:\s*setup/);
  assert.match(skill, /omdocs setup|oh-my-docs/);

  const openai = readFileSync(join(sharedSkill, 'agents/openai.yaml'), 'utf8');
  assert.match(openai, /allow_implicit_invocation:\s*false/);
});

test('sync-skills --check passes for generated adapters', () => {
  const sync = spawnSync(
    process.execPath,
    ['--experimental-strip-types', syncScript],
    { encoding: 'utf8' },
  );
  assert.equal(sync.status, 0, sync.stderr || sync.stdout);

  const check = spawnSync(
    process.execPath,
    ['--experimental-strip-types', syncScript, '--check'],
    { encoding: 'utf8' },
  );
  assert.equal(check.status, 0, check.stderr || check.stdout);

  for (const dest of adapterSkills) {
    assert.ok(existsSync(join(dest, 'SKILL.md')), `missing synced skill at ${dest}`);
    assert.equal(
      readFileSync(join(dest, 'SKILL.md'), 'utf8'),
      readFileSync(join(sharedSkill, 'SKILL.md'), 'utf8'),
    );
  }
});
