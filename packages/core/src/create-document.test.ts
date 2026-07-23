import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { applyFileOperations } from './fs-ops.ts';
import { planCreateDocument, slugifyTitle } from './create-document.ts';
import { validatePlanning } from './planning.ts';

function write(root: string, path: string, contents: string): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function scaffoldDocs(root: string): void {
  write(
    root,
    'apps/docs/templates/prd.mdx',
    `---
title: <initiative>
id: PRD-<initiative>
status: draft
stories:
  - US-<story>
---

## Problem
`,
  );
  write(
    root,
    'apps/docs/templates/user-story.mdx',
    `---
title: <user outcome>
id: US-<story>
---

## Acceptance criteria
`,
  );
  write(
    root,
    'apps/docs/templates/spec.mdx',
    `---
title: <contract>
id: SPEC-<contract>
stage: draft
---

## Scope
`,
  );
  write(
    root,
    'apps/docs/templates/implementation-plan.mdx',
    `---
title: <implementation>
id: PLAN-<initiative>
stage: draft
changeType: product
prd: PRD-<initiative>
specs:
  - SPEC-<contract>
stories:
  - US-<story>
codeAreas:
  - <repository-path>
---

## Scope
`,
  );
  write(
    root,
    'apps/docs/templates/adr.mdx',
    `---
title: <decision>
id: ADR-NNN
stage: draft
---

## Decision
`,
  );
  write(root, 'apps/docs/content/docs/planning/prds/meta.json', '{"pages":["index"]}\n');
  write(root, 'apps/docs/content/docs/planning/stories/meta.json', '{"pages":["index"]}\n');
  write(root, 'apps/docs/content/docs/spec/meta.json', '{"pages":["index"]}\n');
  write(root, 'apps/docs/content/docs/development/plans/meta.json', '{"pages":["index"]}\n');
  write(root, 'apps/docs/content/docs/development/adr/meta.json', '{"pages":["index"]}\n');
}

test('slugifyTitle is deterministic kebab-case', () => {
  assert.equal(slugifyTitle('Hello World'), 'hello-world');
  assert.equal(slugifyTitle('  Foo_Bar!! '), 'foo-bar');
});

test('creates a PRD with meta registration and a valid planning graph', () => {
  const root = mkdtempSync(join(tmpdir(), 'oh-my-docs-new-prd-'));
  try {
    scaffoldDocs(root);
    const planned = planCreateDocument({
      cwd: root,
      kind: 'prd',
      title: 'Shipping Gate',
      docsPath: 'apps/docs',
    });
    assert.equal(planned.id, 'PRD-shipping-gate');
    assert.equal(planned.slug, 'prd-shipping-gate');
    assert.deepEqual(planned.validationProblems, []);

    const applied = applyFileOperations(root, planned.operations);
    assert.equal(applied.applied.length, 2);
    const body = readFileSync(join(root, planned.relativePath), 'utf8');
    assert.match(body, /id: PRD-shipping-gate/);
    assert.match(body, /title: Shipping Gate/);
    const meta = JSON.parse(
      readFileSync(join(root, 'apps/docs/content/docs/planning/prds/meta.json'), 'utf8'),
    ) as { pages: string[] };
    assert.ok(meta.pages.includes('prd-shipping-gate'));
    assert.deepEqual(validatePlanning(join(root, 'apps/docs/content/docs')), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('creates a maintenance plan that validates after create', () => {
  const root = mkdtempSync(join(tmpdir(), 'oh-my-docs-new-plan-'));
  try {
    scaffoldDocs(root);
    const planned = planCreateDocument({
      cwd: root,
      kind: 'plan',
      title: 'Tighten Checks',
      id: 'PLAN-tighten-checks',
      docsPath: 'apps/docs',
    });
    assert.equal(planned.id, 'PLAN-tighten-checks');
    assert.deepEqual(planned.validationProblems, []);
    applyFileOperations(root, planned.operations);
    const body = readFileSync(join(root, planned.relativePath), 'utf8');
    assert.match(body, /changeType: maintenance/);
    assert.match(body, /stage: draft/);
    assert.match(body, /codeAreas:\n  - packages\//);
    assert.deepEqual(validatePlanning(join(root, 'apps/docs/content/docs')), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects duplicate ids', () => {
  const root = mkdtempSync(join(tmpdir(), 'oh-my-docs-new-dup-'));
  try {
    scaffoldDocs(root);
    write(
      root,
      'apps/docs/content/docs/spec/spec-one.mdx',
      '---\ntitle: One\nid: SPEC-one\nstage: draft\n---\n',
    );
    write(root, 'apps/docs/content/docs/spec/meta.json', '{"pages":["index","spec-one"]}\n');
    assert.throws(
      () =>
        planCreateDocument({
          cwd: root,
          kind: 'spec',
          title: 'one',
          docsPath: 'apps/docs',
        }),
      /already exists/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
