/**
 * Enforces that implementation PRs use an implementation plan already present
 * on the PR base SHA. The base lookup is what prevents adding the plan and code
 * together in a single PR.
 *
 * Environment:
 *   BASE_SHA  PR base commit (required in CI; when missing, the check skips)
 *   HEAD_SHA  PR head commit (defaults to HEAD)
 *   PR_BODY   pull request body containing `Plan: <repo path>`
 */
import { execFileSync } from 'node:child_process';

import {
  gateScriptExistsOnBase,
  isDocumentationOnlyPath,
  validateDocsFirst,
} from '@oh-my-docs/core';

function git(...args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function main(): void {
  const baseSha = process.env.BASE_SHA;
  const headSha = process.env.HEAD_SHA ?? 'HEAD';
  const prBody = process.env.PR_BODY ?? '';

  if (!baseSha) {
    console.log('✓ docs-first skipped (BASE_SHA unset; local/offline mode).');
    return;
  }

  const changedPaths = git('diff', '--name-only', '--diff-filter=ACDMRT', `${baseSha}...${headSha}`)
    .split('\n')
    .filter(Boolean);

  const readBaseFile = (path: string): string => {
    try {
      return execFileSync('git', ['show', `${baseSha}:${path}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      throw new Error(`${path} missing on ${baseSha}`);
    }
  };
  const gatePresent = gateScriptExistsOnBase(readBaseFile);
  const problems = validateDocsFirst({
    changedPaths,
    prBody,
    readBaseFile,
    gatePresentOnBase: gatePresent,
  });

  if (problems.length > 0) {
    console.error(`✗ ${problems.length} problem(s) with docs-first development:\n`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  if (changedPaths.every(isDocumentationOnlyPath)) {
    console.log('✓ documentation-only change; no prior implementation plan required.');
  } else if (!gatePresent && !/^\s*(?:[-*]\s*)?Plan:/im.test(prBody)) {
    console.log('✓ docs-first gate is being introduced; enforcement begins on the next PR.');
  } else {
    console.log('✓ implementation uses a ready plan from the PR base SHA.');
  }
}

main();
