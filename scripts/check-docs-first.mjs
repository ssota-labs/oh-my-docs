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

  const readBaseFile = (path) => git('show', `${baseSha}:${path}`);

  const problems = validateDocsFirst({
    prBody,
    changedPaths,
    readBaseFile,
    gatePresentOnBase: gateScriptExistsOnBase((path) => {
      try {
        git('show', `${baseSha}:${path}`);
        return true;
      } catch {
        return false;
      }
    }),
  });

  if (problems.length > 0) {
    console.error(`Docs-first gate failed (${problems.length}):\n`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }

  console.log('✓ docs-first gate passed.');
}

main();
