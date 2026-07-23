import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { applyFileOperations } from './fs-ops.ts';
import { planInit } from './plan-init.ts';

function temp(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function writeTemplate(root: string): void {
  mkdirSync(join(root, 'docs', 'content', 'docs'), { recursive: true });
  writeFileSync(join(root, 'docs', 'content', 'docs', 'index.mdx'), '---\ntitle: Home\n---\n\nHi\n');
  mkdirSync(join(root, 'packages', 'ui', 'src'), { recursive: true });
  writeFileSync(
    join(root, 'packages', 'ui', 'package.json'),
    JSON.stringify({ name: '@oh-my-docs/ui' }, null, 2),
  );
  writeFileSync(join(root, 'packages', 'ui', 'src', 'index.ts'), 'export {};\n');
  writeFileSync(join(root, 'gitignore'), 'node_modules/\n');
  writeFileSync(join(root, 'AGENTS.md'), 'ignored template agents\n');
  writeFileSync(join(root, 'CLAUDE.md'), 'ignored template claude\n');
}

test('planInit scaffolds empty directory and second apply is idempotent', () => {
  const template = temp('omd-template-');
  const target = temp('omd-target-');
  try {
    writeTemplate(template);
    const plan = planInit({ cwd: target }, template);
    assert.ok(plan.operations.some((op) => op.path === 'package.json' && op.kind === 'create'));
    assert.ok(plan.operations.some((op) => op.path === 'docs/content/docs/index.mdx'));
    assert.equal(plan.conflicts.length, 0);

    const first = applyFileOperations(target, plan.operations);
    assert.equal(first.dryRun, false);
    assert.ok(first.applied.length > 0);
    assert.match(readFileSync(join(target, 'AGENTS.md'), 'utf8'), /oh-my-docs:start/);

    const secondPlan = planInit({ cwd: target }, template);
    const second = applyFileOperations(target, secondPlan.operations);
    assert.equal(
      second.applied.length,
      0,
      `expected no writes on second run, got ${second.applied.map((o) => o.path).join(', ')}`,
    );
    assert.equal(secondPlan.conflicts.length, 0);
  } finally {
    rmSync(template, { recursive: true });
    rmSync(target, { recursive: true });
  }
});

test('planInit preserves conflicting files unless forced', () => {
  const template = temp('omd-template-');
  const target = temp('omd-target-');
  try {
    writeTemplate(template);
    mkdirSync(join(target, 'docs', 'content', 'docs'), { recursive: true });
    writeFileSync(join(target, 'docs', 'content', 'docs', 'index.mdx'), '---\ntitle: Keep\n---\n');

    const plan = planInit({ cwd: target }, template);
    const conflict = plan.operations.find((op) => op.path === 'docs/content/docs/index.mdx');
    assert.ok(conflict?.conflict);

    applyFileOperations(target, plan.operations);
    assert.equal(
      readFileSync(join(target, 'docs', 'content', 'docs', 'index.mdx'), 'utf8'),
      '---\ntitle: Keep\n---\n',
    );

    const forced = planInit({ cwd: target, force: true }, template);
    applyFileOperations(target, forced.operations, { force: true });
    assert.match(
      readFileSync(join(target, 'docs', 'content', 'docs', 'index.mdx'), 'utf8'),
      /title: Home/,
    );
  } finally {
    rmSync(template, { recursive: true });
    rmSync(target, { recursive: true });
  }
});

test('dry-run does not write files', () => {
  const template = temp('omd-template-');
  const target = temp('omd-target-');
  try {
    writeTemplate(template);
    const plan = planInit({ cwd: target, dryRun: true }, template);
    const result = applyFileOperations(target, plan.operations, { dryRun: true });
    assert.equal(result.dryRun, true);
    assert.ok(result.applied.length > 0);
    assert.equal(existsSync(join(target, 'package.json')), false);
  } finally {
    rmSync(template, { recursive: true });
    rmSync(target, { recursive: true });
  }
});
