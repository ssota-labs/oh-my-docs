import type { ApplyResult, DoctorReport, PlanResult } from '@oh-my-docs/core';

export interface GlobalFlags {
  readonly dryRun: boolean;
  readonly yes: boolean;
  readonly json: boolean;
  readonly force: boolean;
}

export function printPlan(plan: PlanResult, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }
  console.log(`Project: ${plan.project.root}`);
  console.log(`Operations: ${plan.operations.length} (conflicts: ${plan.conflicts.length})`);
  for (const op of plan.operations) {
    const flag = op.conflict ? 'CONFLICT' : op.kind.toUpperCase();
    console.log(`  [${flag}] ${op.path} — ${op.reason}`);
  }
}

export function printApply(result: ApplyResult, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.dryRun) {
    console.log(`Dry run — would apply ${result.applied.length} change(s), skip ${result.skipped.length}.`);
    return;
  }
  console.log(`Applied ${result.applied.length} change(s), skipped ${result.skipped.length}.`);
}

export function printDoctor(report: DoctorReport, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(report.ok ? 'Doctor: OK' : 'Doctor: issues found');
  for (const note of report.notes) console.log(`- ${note}`);
}

export function confirmOrExit(flags: GlobalFlags, message: string): void {
  if (flags.dryRun || flags.yes) return;
  console.error(`${message} Re-run with --yes to continue.`);
  process.exit(1);
}
