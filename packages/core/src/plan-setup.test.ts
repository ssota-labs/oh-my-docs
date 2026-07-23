import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { applyFileOperations } from './fs-ops.ts';
import { planSetup } from './plan-setup.ts';
import { PROJECT_SKILL_ROOTS } from './skill-paths.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const skillRoot = join(repoRoot, 'plugins/shared/skills/setup');

const REQUIRED_RELATIVE = [
  'SKILL.md',
  'agents/openai.yaml',
  'scripts/run-setup.mjs',
  'references/methodology.md',
  'references/agent-compatibility.md',
] as const;

test('planSetup installs golden discovery paths per agent', () => {
  const root = mkdtempSync(join(tmpdir(), 'omd-setup-paths-'));
  try {
    for (const [agent, discovery] of Object.entries(PROJECT_SKILL_ROOTS) as [
      'cursor' | 'claude' | 'codex',
      string,
    ][]) {
      const plan = planSetup({
        cwd: root,
        agent,
        scope: 'project',
        skillRoot,
      });
      applyFileOperations(root, plan.operations);

      for (const rel of REQUIRED_RELATIVE) {
        const path = join(root, discovery, rel);
        assert.ok(existsSync(path), `${agent}: missing ${discovery}/${rel}`);
      }

      const skill = readFileSync(join(root, discovery, 'SKILL.md'), 'utf8');
      assert.match(skill, /disable-model-invocation:\s*true/);
      assert.match(skill, /omdocs setup|npx oh-my-docs/);
      assert.match(skill, /Do not\s+(?:hand-edit|edit)/i);
    }

    assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /oh-my-docs:start/);
    assert.match(readFileSync(join(root, 'CLAUDE.md'), 'utf8'), /oh-my-docs:start/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('planSetup second run is idempotent', () => {
  const root = mkdtempSync(join(tmpdir(), 'omd-setup-idem-'));
  try {
    const first = planSetup({ cwd: root, agent: 'all', scope: 'project', skillRoot });
    applyFileOperations(root, first.operations);

    const second = planSetup({ cwd: root, agent: 'all', scope: 'project', skillRoot });
    const applied = applyFileOperations(root, second.operations);
    assert.equal(applied.applied.length, 0);
    assert.equal(second.conflicts.length, 0);
    assert.ok(second.operations.every((op) => op.kind === 'skip'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('planSetup --scope user writes home discovery paths and project markers', () => {
  const root = mkdtempSync(join(tmpdir(), 'omd-setup-user-proj-'));
  const home = mkdtempSync(join(tmpdir(), 'omd-setup-user-home-'));
  try {
    const plan = planSetup({
      cwd: root,
      agent: 'cursor',
      scope: 'user',
      skillRoot,
      home,
    });
    applyFileOperations(root, plan.operations);

    assert.ok(existsSync(join(home, '.cursor/skills/setup/SKILL.md')));
    assert.equal(existsSync(join(root, '.cursor/skills/setup/SKILL.md')), false);
    assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /oh-my-docs:start/);

    const second = planSetup({
      cwd: root,
      agent: 'cursor',
      scope: 'user',
      skillRoot,
      home,
    });
    const applied = applyFileOperations(root, second.operations);
    assert.equal(applied.applied.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  }
});

test('planSetup reports conflict when skill diverges without --force', () => {
  const root = mkdtempSync(join(tmpdir(), 'omd-setup-conflict-'));
  try {
    const discovery = PROJECT_SKILL_ROOTS.codex;
    mkdirSync(join(root, discovery), { recursive: true });
    writeFileSync(join(root, discovery, 'SKILL.md'), '# divergent\n', 'utf8');

    const plan = planSetup({ cwd: root, agent: 'codex', scope: 'project', skillRoot });
    const skillOps = plan.operations.filter((op) => op.path.endsWith('SKILL.md'));
    assert.ok(skillOps.some((op) => op.conflict === true));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
