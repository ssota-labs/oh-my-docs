/**
 * Enforces that implementation PRs use an implementation plan already present
 * on the PR base SHA.
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
} from '../skills/oh-my-doc/runtime/docs-first.mjs';

function git(...args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function main() {
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

  /** Must throw when the path is absent — gateScriptExistsOnBase relies on that. */
  const readBaseFile = (path) => {
    try {
      return git('show', `${baseSha}:${path}`);
    } catch {
      throw new Error(`${path} missing on ${baseSha}`);
    }
  };

  const gatePresent = gateScriptExistsOnBase(readBaseFile);
  const problems = validateDocsFirst({
    prBody,
    changedPaths,
    readBaseFile,
    gatePresentOnBase: gatePresent,
  });

  if (problems.length > 0) {
    console.error(`Docs-first gate failed (${problems.length}):\n`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }

  if (changedPaths.every(isDocumentationOnlyPath)) {
    console.log('✓ documentation-only change; no prior implementation plan required.');
  } else if (!gatePresent) {
    console.log('✓ docs-first gate is being introduced; enforcement begins on the next PR.');
  } else {
    console.log('✓ implementation uses a ready plan from the PR base SHA.');
  }
}

main();
