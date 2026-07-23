import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { applyFileOperations } from './fs-ops.ts';
import { planSetup } from './plan-setup.ts';

test('planSetup writes markers and skill stubs idempotently', () => {
  const root = mkdtempSync(join(tmpdir(), 'omd-setup-'));
  try {
    const first = planSetup({ cwd: root, agent: 'cursor', scope: 'project' });
    applyFileOperations(root, first.operations);
    assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /oh-my-docs:start/);
    assert.match(
      readFileSync(join(root, '.cursor/skills/oh-my-docs-setup/SKILL.md'), 'utf8'),
      /omdocs setup/,
    );

    const second = planSetup({ cwd: root, agent: 'cursor', scope: 'project' });
    const applied = applyFileOperations(root, second.operations);
    assert.equal(applied.applied.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
