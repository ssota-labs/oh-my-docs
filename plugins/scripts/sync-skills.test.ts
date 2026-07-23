import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pluginsRoot = join(here, '..');
const repoRoot = join(pluginsRoot, '..');
const canonicalSkill = join(repoRoot, 'skills/oh-my-doc');
const syncScript = join(here, 'sync-skills.ts');

const adapterSkills = [
  join(pluginsRoot, 'codex/skills/oh-my-doc'),
  join(pluginsRoot, 'cursor/skills/oh-my-doc'),
  join(pluginsRoot, 'claude-code/skills/oh-my-doc'),
] as const;

test('canonical oh-my-doc skill has progressive disclosure layout', () => {
  for (const rel of [
    'SKILL.md',
    'agents/openai.yaml',
    'scripts/omd.mjs',
    'references/methodology.md',
    'references/information-architecture.md',
    'references/planning-workflow.md',
    'references/implementation-workflow.md',
    'references/document-contracts.md',
    'references/agent-compatibility.md',
    'assets/AGENTS.md',
    'assets/CLAUDE.md',
    'VERSION',
  ]) {
    assert.ok(existsSync(join(canonicalSkill, rel)), `missing ${rel}`);
  }

  const skill = readFileSync(join(canonicalSkill, 'SKILL.md'), 'utf8');
  assert.match(skill, /name:\s*oh-my-doc/);
  assert.match(skill, /omd\.mjs|Oh My Docs/);

  const openai = readFileSync(join(canonicalSkill, 'agents/openai.yaml'), 'utf8');
  assert.match(openai, /allow_implicit_invocation:\s*true/);
});

test('sync-skills --check passes for plugin wrappers', () => {
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
      readFileSync(join(canonicalSkill, 'SKILL.md'), 'utf8'),
    );
  }
});
