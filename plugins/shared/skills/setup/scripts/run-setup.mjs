#!/usr/bin/env node
/**
 * Call `omdocs setup` / `npx oh-my-docs setup` instead of editing files ad hoc.
 *
 * Usage: node run-setup.mjs [agent] [scope]
 *   agent: codex | cursor | claude | all  (default: all)
 *   scope: project | user               (default: project)
 */
import { spawnSync } from 'node:child_process';

const agent = process.argv[2] ?? 'all';
const scope = process.argv[3] ?? 'project';

const args = ['setup', '--agent', agent, '--scope', scope, '--yes'];

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
}

let result = run('omdocs', args);
if (result.error || (result.status !== 0 && result.status !== null)) {
  result = run('npx', ['--yes', 'oh-my-docs@latest', ...args]);
}

process.exit(result.status ?? 1);
