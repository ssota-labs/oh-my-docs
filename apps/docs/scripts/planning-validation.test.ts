import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { validatePlanning } from './planning-validation.ts';

function write(root: string, path: string, contents: string): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function document(frontmatter: string): string {
  return `---\n${frontmatter.trim()}\n---\n`;
}

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'oh-my-docs-planning-'));
  write(
    root,
    'planning/prds/prd-one.mdx',
    document('title: One\nid: PRD-one\nstatus: active\nstories: [US-one]'),
  );
  write(root, 'planning/prds/meta.json', '{"pages":["prd-one"]}\n');
  write(root, 'planning/stories/us-one.mdx', document('title: One\nid: US-one'));
  write(root, 'planning/stories/meta.json', '{"pages":["us-one"]}\n');
  write(
    root,
    'spec/spec-one.mdx',
    document('title: One\nid: SPEC-one\nstage: accepted'),
  );
  write(root, 'spec/meta.json', '{"pages":["spec-one"]}\n');
  write(
    root,
    'development/adr/adr-one.mdx',
    document('title: One\nid: ADR-one\nstage: accepted'),
  );
  write(root, 'development/adr/meta.json', '{"pages":["adr-one"]}\n');
  write(
    root,
    'development/plans/plan-one.mdx',
    document(`
title: One
id: PLAN-one
stage: ready
changeType: product
prd: PRD-one
specs: [SPEC-one]
stories: [US-one]
codeAreas: [apps/example]
`),
  );
  write(root, 'development/plans/meta.json', '{"pages":["plan-one"]}\n');
  return root;
}

test('accepts a complete product planning graph', () => {
  const root = fixture();
  try {
    assert.deepEqual(validatePlanning(root), []);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test('reports duplicate IDs, missing references, and navigation gaps', () => {
  const root = fixture();
  try {
    write(root, 'planning/stories/us-two.mdx', document('title: Two\nid: US-one'));
    write(root, 'planning/stories/meta.json', '{"pages":["us-one"]}\n');
    write(
      root,
      'development/plans/plan-one.mdx',
      document(`
title: One
id: PLAN-one
stage: ready
changeType: product
prd: PRD-missing
specs: [SPEC-missing]
stories: [US-missing]
codeAreas: [apps/example]
`),
    );
    const problems = validatePlanning(root).join('\n');
    assert.match(problems, /duplicate id US-one/);
    assert.match(problems, /us-two is not registered/);
    assert.match(problems, /PRD-missing/);
    assert.match(problems, /SPEC-missing/);
    assert.match(problems, /US-missing/);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test('rejects an implementation-ready plan with draft prerequisites', () => {
  const root = fixture();
  try {
    write(
      root,
      'planning/prds/prd-one.mdx',
      document('title: One\nid: PRD-one\nstatus: draft\nstories: [US-one]'),
    );
    write(root, 'spec/spec-one.mdx', document('title: One\nid: SPEC-one\nstage: draft'));
    const problems = validatePlanning(root).join('\n');
    assert.match(problems, /references draft PRD PRD-one/);
    assert.match(problems, /requires accepted spec SPEC-one/);
  } finally {
    rmSync(root, { recursive: true });
  }
});
