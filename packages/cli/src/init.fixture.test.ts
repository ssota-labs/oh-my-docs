import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { applyFileOperations, planInit } from '@oh-my-docs/core';

import { resolveTemplateRoot } from './templates.ts';

test('CLI template: empty init then second run is idempotent', () => {
  const target = mkdtempSync(join(tmpdir(), 'omdocs-fixture-'));
  const templateRoot = resolveTemplateRoot();
  try {
    const firstPlan = planInit({ cwd: target, yes: true }, templateRoot);
    assert.ok(firstPlan.operations.length > 0);
    assert.equal(firstPlan.conflicts.length, 0);
    const first = applyFileOperations(target, firstPlan.operations);
    assert.ok(first.applied.length > 0);
    assert.match(readFileSync(join(target, 'package.json'), 'utf8'), /private/);
    assert.match(readFileSync(join(target, 'AGENTS.md'), 'utf8'), /oh-my-docs:start/);
    assert.ok(readFileSync(join(target, 'docs/package.json'), 'utf8').length > 0);

    const secondPlan = planInit({ cwd: target, yes: true }, templateRoot);
    const second = applyFileOperations(target, secondPlan.operations);
    assert.equal(
      second.applied.length,
      0,
      `second run wrote: ${second.applied.map((o) => `${o.kind}:${o.path}`).join(', ')}`,
    );
    assert.equal(secondPlan.conflicts.length, 0);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
