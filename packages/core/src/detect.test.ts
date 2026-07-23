import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { detectProject } from './detect.ts';

function temp(): string {
  return mkdtempSync(join(tmpdir(), 'oh-my-docs-detect-'));
}

test('detects empty directory', () => {
  const root = temp();
  try {
    const state = detectProject(root);
    assert.equal(state.empty, true);
    assert.equal(state.hasPackageJson, false);
    assert.equal(state.packageManager, null);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test('detects pnpm workspace and instruction files', () => {
  const root = temp();
  try {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({ name: 'demo', packageManager: 'pnpm@11.5.2' }),
    );
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n');
    writeFileSync(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
    writeFileSync(
      join(root, 'AGENTS.md'),
      '# x\n\n<!-- oh-my-docs:start -->\nbody\n<!-- oh-my-docs:end -->\n',
    );
    mkdirSync(join(root, 'docs', 'content', 'docs'), { recursive: true });
    mkdirSync(join(root, 'packages', 'ui', 'src'), { recursive: true });
    writeFileSync(
      join(root, 'packages', 'ui', 'package.json'),
      JSON.stringify({ name: '@oh-my-docs/ui' }),
    );

    const state = detectProject(root);
    assert.equal(state.empty, false);
    assert.equal(state.packageManager, 'pnpm');
    assert.equal(state.isWorkspace, true);
    assert.equal(state.docsPath, 'docs');
    assert.equal(state.uiPath, 'packages/ui');
    assert.equal(state.agentsHasMarker, true);
  } finally {
    rmSync(root, { recursive: true });
  }
});
