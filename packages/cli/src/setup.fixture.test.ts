import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { applyFileOperations, planSetup, PROJECT_SKILL_ROOTS } from '@oh-my-docs/core';

import { resolveSkillRoot } from './skills.ts';

test('CLI skill root resolves and setup installs all project discovery paths', () => {
  const skillRoot = resolveSkillRoot();
  assert.ok(existsSync(join(skillRoot, 'SKILL.md')));

  const root = mkdtempSync(join(tmpdir(), 'omdocs-setup-fixture-'));
  try {
    const plan = planSetup({
      cwd: root,
      agent: 'all',
      scope: 'project',
      skillRoot,
      yes: true,
    });
    assert.equal(plan.conflicts.length, 0);
    const result = applyFileOperations(root, plan.operations);
    assert.ok(result.applied.length > 0);

    for (const discovery of Object.values(PROJECT_SKILL_ROOTS)) {
      assert.ok(existsSync(join(root, discovery, 'SKILL.md')), discovery);
      assert.ok(existsSync(join(root, discovery, 'scripts/run-setup.mjs')), discovery);
    }

    assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /oh-my-docs:start/);

    const second = planSetup({
      cwd: root,
      agent: 'all',
      scope: 'project',
      skillRoot,
      yes: true,
    });
    const secondResult = applyFileOperations(root, second.operations);
    assert.equal(secondResult.applied.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
