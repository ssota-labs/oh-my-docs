import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { applyFileOperations, planCreateDocument, validatePlanning } from '@oh-my-docs/core';

function write(root: string, path: string, contents: string): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function scaffold(root: string): void {
  write(
    root,
    'docs/templates/prd.mdx',
    `---
title: <initiative>
id: PRD-<initiative>
status: draft
stories:
  - US-<story>
---

Body
`,
  );
  write(root, 'docs/content/docs/planning/prds/meta.json', '{"pages":["index"]}\n');
}

test('CLI new: create PRD, register meta, pass validation', () => {
  const root = mkdtempSync(join(tmpdir(), 'omdocs-new-'));
  try {
    scaffold(root);
    const planned = planCreateDocument({
      cwd: root,
      kind: 'prd',
      title: 'Catalog Search',
      docsPath: 'docs',
    });
    assert.deepEqual(planned.validationProblems, []);
    const result = applyFileOperations(root, planned.operations);
    assert.ok(result.applied.length >= 1);
    const body = readFileSync(join(root, planned.relativePath), 'utf8');
    assert.match(body, /id: PRD-catalog-search/);
    const meta = JSON.parse(
      readFileSync(join(root, 'docs/content/docs/planning/prds/meta.json'), 'utf8'),
    ) as { pages: string[] };
    assert.ok(meta.pages.includes('prd-catalog-search'));
    assert.deepEqual(validatePlanning(join(root, 'docs/content/docs')), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
