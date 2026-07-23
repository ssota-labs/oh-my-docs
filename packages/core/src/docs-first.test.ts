import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractPlanPath,
  isDocumentationOnlyPath,
  validateDocsFirst,
} from './docs-first.ts';

const plan = ({
  stage = 'ready',
  codeAreas = ['packages/core'],
  id = 'PLAN-one',
}: {
  stage?: string;
  codeAreas?: readonly string[];
  id?: string;
} = {}) => `---
id: ${id}
stage: ${stage}
codeAreas: [${codeAreas.join(', ')}]
---
`;

const body =
  '## Planning\n\nPlan: apps/docs/content/docs/development/plans/plan-one.mdx\n';

test('extracts Plan paths for apps/docs and docs layouts', () => {
  assert.equal(
    extractPlanPath('Plan: apps/docs/content/docs/development/plans/plan-one.mdx'),
    'apps/docs/content/docs/development/plans/plan-one.mdx',
  );
  assert.equal(
    extractPlanPath('- Plan: docs/content/docs/development/plans/plan-two.mdx'),
    'docs/content/docs/development/plans/plan-two.mdx',
  );
  assert.equal(extractPlanPath('Plan: packages/core/README.md'), null);
});

test('classifies documentation-only paths', () => {
  assert.equal(isDocumentationOnlyPath('apps/docs/content/docs/workflow/planning.mdx'), true);
  assert.equal(isDocumentationOnlyPath('docs/templates/prd.mdx'), true);
  assert.equal(isDocumentationOnlyPath('README.md'), true);
  assert.equal(isDocumentationOnlyPath('packages/core/src/planning.ts'), false);
  assert.equal(isDocumentationOnlyPath('AGENTS.md'), false);
});

test('allows documentation-only changes without a plan', () => {
  assert.deepEqual(
    validateDocsFirst({
      changedPaths: ['apps/docs/content/docs/planning/prds/prd-one.mdx'],
      prBody: '',
      readBaseFile: () => {
        throw new Error('must not read');
      },
    }),
    [],
  );
});

test('rejects code changes without a Plan entry when the gate exists on base', () => {
  assert.match(
    validateDocsFirst({
      changedPaths: ['packages/core/src/planning.ts'],
      prBody: '',
      gatePresentOnBase: true,
      readBaseFile: () => plan(),
    }).join('\n'),
    /code changes require a valid/,
  );
});

test('skips enforcement while the gate is being introduced', () => {
  assert.deepEqual(
    validateDocsFirst({
      changedPaths: ['packages/core/src/docs-first.ts', 'scripts/check-docs-first.ts'],
      prBody: '',
      gatePresentOnBase: false,
      readBaseFile: () => {
        throw new Error('must not read');
      },
    }),
    [],
  );
});

test('rejects a draft plan on the base SHA', () => {
  assert.match(
    validateDocsFirst({
      changedPaths: ['packages/core/src/planning.ts'],
      prBody: body,
      gatePresentOnBase: true,
      readBaseFile: () => plan({ stage: 'draft' }),
    }).join('\n'),
    /stage must be ready or active/,
  );
});

test('rejects paths outside codeAreas', () => {
  assert.match(
    validateDocsFirst({
      changedPaths: ['packages/cli/src/cli.ts'],
      prBody: body,
      gatePresentOnBase: true,
      readBaseFile: () => plan({ codeAreas: ['packages/core'] }),
    }).join('\n'),
    /not covered by PLAN-one codeAreas/,
  );
});

test('accepts a ready base plan covering every changed code path', () => {
  assert.deepEqual(
    validateDocsFirst({
      changedPaths: [
        'packages/core/src/planning.ts',
        'apps/docs/content/docs/development/plans/plan-one.mdx',
      ],
      prBody: body,
      gatePresentOnBase: true,
      readBaseFile: () => plan(),
    }),
    [],
  );
});

test('rejects a plan that only exists on the PR head', () => {
  assert.match(
    validateDocsFirst({
      changedPaths: ['packages/core/src/planning.ts'],
      prBody: body,
      gatePresentOnBase: true,
      readBaseFile: () => {
        throw new Error('missing at base');
      },
    }).join('\n'),
    /does not exist on the PR base SHA/,
  );
});
