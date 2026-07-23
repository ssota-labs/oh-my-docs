import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import {
  applyFileOperations,
  doctorProject,
  planInit,
  planSetup,
  validatePlanning,
  type AgentKind,
  type PackageManager,
  type SetupScope,
} from '@oh-my-docs/core';
import { Command } from 'commander';

import { confirmOrExit, printApply, printDoctor, printPlan, type GlobalFlags } from './output.ts';
import { resolveSkillRoot } from './skills.ts';
import { resolveTemplateRoot } from './templates.ts';

const VERSION = (createRequire(import.meta.url)('../package.json') as { version: string }).version;

function addGlobalOptions(command: Command): Command {
  return command
    .option('--dry-run', 'print the plan without writing files')
    .option('--yes', 'skip confirmation prompts')
    .option('--json', 'emit machine-readable JSON')
    .option('--force', 'overwrite conflicting files');
}

function globalFlags(opts: Record<string, unknown>): GlobalFlags {
  return {
    dryRun: opts.dryRun === true,
    yes: opts.yes === true,
    json: opts.json === true,
    force: opts.force === true,
  };
}

export async function runCli(argv: readonly string[] = process.argv): Promise<void> {
  const program = new Command();
  program.name('oh-my-docs').description('Scaffold and maintain docs-first product workspaces').version(VERSION);

  addGlobalOptions(
    program
      .command('init')
      .description('Scaffold or merge Oh My Docs into a directory')
      .argument('[directory]', 'target directory', '.')
      .option('--ui-path <path>', 'UI package path relative to project root', 'packages/ui')
      .option('--package-manager <pm>', 'pnpm | npm | yarn | bun'),
  ).action(async (directory: string, opts: Record<string, unknown>) => {
    const globals = globalFlags(opts);
    const cwd = resolve(process.cwd(), directory);
    const templateRoot = resolveTemplateRoot();
    const uiPath = typeof opts.uiPath === 'string' ? opts.uiPath : 'packages/ui';
    const initOptions = {
      cwd,
      dryRun: globals.dryRun,
      yes: globals.yes,
      force: globals.force,
      json: globals.json,
      uiPath,
      ...(typeof opts.packageManager === 'string'
        ? { packageManager: opts.packageManager as PackageManager }
        : {}),
    };
    const plan = planInit(initOptions, templateRoot);
    if (!globals.json) printPlan(plan, false);
    if (plan.conflicts.length > 0 && !globals.force) {
      console.error(
        `\n${plan.conflicts.length} conflict(s) preserved. Re-run with --force to overwrite.`,
      );
    }
    confirmOrExit(globals, 'About to apply scaffold changes.');
    const result = applyFileOperations(cwd, plan.operations, {
      dryRun: globals.dryRun,
      force: globals.force,
    });
    if (globals.json) {
      console.log(JSON.stringify({ plan, result }, null, 2));
    } else {
      printApply(result, false);
    }
    if (plan.conflicts.length > 0 && !globals.force) process.exitCode = 2;
  });

  addGlobalOptions(
    program
      .command('setup')
      .description('Install or refresh AGENTS/CLAUDE markers and official agent setup skills')
      .option('--agent <agent>', 'codex | cursor | claude | all', 'all')
      .option('--scope <scope>', 'project | user', 'project'),
  ).action(async (opts: Record<string, unknown>) => {
    const globals = globalFlags(opts);
    const skillRoot = resolveSkillRoot();
    const plan = planSetup({
      cwd: process.cwd(),
      dryRun: globals.dryRun,
      yes: globals.yes,
      force: globals.force,
      json: globals.json,
      agent: (typeof opts.agent === 'string' ? opts.agent : 'all') as AgentKind,
      scope: (typeof opts.scope === 'string' ? opts.scope : 'project') as SetupScope,
      skillRoot,
    });
    if (!globals.json) printPlan(plan, false);
    confirmOrExit(globals, 'About to apply setup changes.');
    const result = applyFileOperations(process.cwd(), plan.operations, {
      dryRun: globals.dryRun,
      force: globals.force,
    });
    if (globals.json) {
      console.log(JSON.stringify({ plan, result }, null, 2));
    } else {
      printApply(result, false);
    }
    if (plan.conflicts.length > 0 && !globals.force) process.exitCode = 2;
  });

  addGlobalOptions(
    program
      .command('check')
      .description('Validate the planning document graph')
      .option('--docs-path <path>', 'docs app path (auto-detected when omitted)'),
  ).action(async (opts: Record<string, unknown>) => {
    const json = opts.json === true;
    const report = doctorProject({ cwd: process.cwd() });
    const docsPath =
      typeof opts.docsPath === 'string' ? opts.docsPath : report.project.docsPath;
    if (!docsPath) {
      const message = 'No docs app found (expected docs/ or apps/docs/).';
      if (json) console.log(JSON.stringify({ ok: false, problems: [message] }, null, 2));
      else console.error(message);
      process.exitCode = 1;
      return;
    }
    const contentDirectory = resolve(process.cwd(), docsPath, 'content/docs');
    const problems = validatePlanning(contentDirectory);
    if (json) {
      console.log(JSON.stringify({ ok: problems.length === 0, problems }, null, 2));
    } else if (problems.length > 0) {
      console.error(`Planning validation found ${problems.length} problem(s):\n`);
      for (const problem of problems) console.error(`- ${problem}`);
    } else {
      console.log('Planning IDs, references, lifecycle states, and navigation are valid.');
    }
    if (problems.length > 0) process.exitCode = 1;
  });

  addGlobalOptions(
    program
      .command('doctor')
      .description('Report detected project state and missing pieces')
      .option('--ui-path <path>', 'expected UI package path', 'packages/ui'),
  ).action(async (opts: Record<string, unknown>) => {
    const report = doctorProject({
      cwd: process.cwd(),
      ...(typeof opts.uiPath === 'string' ? { uiPath: opts.uiPath } : {}),
    });
    printDoctor(report, opts.json === true);
    if (!report.ok) process.exitCode = 1;
  });

  await program.parseAsync(argv);
}
