import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import type { ApplyResult, FileOperation } from './types.ts';

function ensureParent(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

function writeAtomic(path: string, content: string): void {
  ensureParent(path);
  const dir = dirname(path);
  const temp = join(dir, `.oh-my-docs-${process.pid}-${Date.now()}.tmp`);
  writeFileSync(temp, content, 'utf8');
  renameSync(temp, path);
}

/**
 * Apply planned file operations with backups and rollback on failure.
 * Skip operations and conflict operations (unless force) are not written.
 */
export function applyFileOperations(
  root: string,
  operations: readonly FileOperation[],
  options: { readonly dryRun?: boolean; readonly force?: boolean } = {},
): ApplyResult {
  const dryRun = options.dryRun === true;
  const force = options.force === true;
  const applied: FileOperation[] = [];
  const skipped: FileOperation[] = [];

  const writable = operations.filter((op) => {
    if (op.kind === 'skip') {
      skipped.push(op);
      return false;
    }
    if (op.conflict && !force) {
      skipped.push(op);
      return false;
    }
    if (op.content === undefined) {
      skipped.push(op);
      return false;
    }
    return true;
  });

  if (dryRun) {
    return { applied: writable, skipped, rolledBack: false, dryRun: true };
  }

  const backupRoot = mkdtempSync(join(tmpdir(), 'oh-my-docs-backup-'));
  const backups: { readonly absolute: string; readonly backup: string | null }[] = [];

  try {
    for (const op of writable) {
      const absolute = resolve(root, op.path);
      const backupPath = join(backupRoot, op.path);
      if (existsSync(absolute)) {
        ensureParent(backupPath);
        copyFileSync(absolute, backupPath);
        backups.push({ absolute, backup: backupPath });
      } else {
        backups.push({ absolute, backup: null });
      }
      writeAtomic(absolute, op.content ?? '');
      applied.push(op);
    }
    rmSync(backupRoot, { recursive: true, force: true });
    return { applied, skipped, rolledBack: false, dryRun: false };
  } catch (error) {
    for (const entry of backups.reverse()) {
      if (entry.backup && existsSync(entry.backup)) {
        ensureParent(entry.absolute);
        copyFileSync(entry.backup, entry.absolute);
      } else if (existsSync(entry.absolute)) {
        rmSync(entry.absolute, { force: true });
      }
    }
    rmSync(backupRoot, { recursive: true, force: true });
    throw error;
  }
}

export function readTextIfExists(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}
