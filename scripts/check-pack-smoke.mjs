#!/usr/bin/env node
/**
 * Build public packages, npm-pack them, install tarballs into a clean temp dir,
 * and exercise the published CLI surface (`--help`, `init`, `doctor`).
 *
 * Does not publish to the registry.
 *
 * Usage: node scripts/check-pack-smoke.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pnpm = process.env.PNPM_BIN ?? 'pnpm';
const npm = process.env.NPM_BIN ?? 'npm';

/** @param {string} command @param {string[]} args @param {import('node:child_process').ExecFileSyncOptions} [options] */
function run(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(' ')}`);
  return execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });
}

/** @param {string} command @param {string[]} args @param {import('node:child_process').ExecFileSyncOptionsWithStringEncoding} [options] */
function runCapture(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

/** @param {string} packDir @param {(name: string) => boolean} predicate @param {string} label */
function findTarball(packDir, predicate, label) {
  const matches = readdirSync(packDir).filter((name) => name.endsWith('.tgz') && predicate(name));
  if (matches.length !== 1) {
    throw new Error(`expected one ${label} tarball, found: ${matches.join(', ') || '(none)'}`);
  }
  return join(packDir, matches[0]);
}

const packDir = mkdtempSync(join(tmpdir(), 'omdocs-pack-'));
const installDir = mkdtempSync(join(tmpdir(), 'omdocs-install-'));
const projectDir = join(installDir, 'smoke-project');

let failed = false;
try {
  console.log('→ build public packages');
  run(pnpm, ['--filter', 'create-oh-my-docs...', 'run', 'build']);

  console.log('→ pack public packages');
  mkdirSync(packDir, { recursive: true });
  for (const filter of ['@oh-my-docs/core', '@oh-my-docs/ui', 'oh-my-docs', 'create-oh-my-docs']) {
    run(pnpm, ['--filter', filter, 'pack', '--pack-destination', packDir]);
  }

  const coreTgz = findTarball(packDir, (n) => n.startsWith('oh-my-docs-core-'), '@oh-my-docs/core');
  const uiTgz = findTarball(packDir, (n) => n.startsWith('oh-my-docs-ui-'), '@oh-my-docs/ui');
  const cliTgz = findTarball(packDir, (n) => /^oh-my-docs-\d/.test(n), 'oh-my-docs');
  const createTgz = findTarball(packDir, (n) => n.startsWith('create-oh-my-docs-'), 'create-oh-my-docs');

  for (const tgz of [coreTgz, uiTgz, cliTgz, createTgz]) {
    const size = statSync(tgz).size;
    if (size < 200) throw new Error(`tarball too small: ${tgz} (${size} bytes)`);
    console.log(`  packed ${tgz} (${size} bytes)`);
  }

  // Install CLI + create (+ core as local tarball so registry is not required).
  // UI is packed for publish-surface coverage but not installed here — its peer
  // tree (Next/React) would dominate smoke time without exercising the CLI.
  console.log('→ install tarballs into temp project');
  run(npm, ['init', '-y'], { cwd: installDir });
  run(npm, ['install', '--no-fund', '--no-audit', coreTgz, cliTgz, createTgz], {
    cwd: installDir,
  });

  const bin = join(installDir, 'node_modules', '.bin', 'oh-my-docs');
  const createBin = join(installDir, 'node_modules', '.bin', 'create-oh-my-docs');
  if (!existsSync(bin)) throw new Error(`oh-my-docs bin missing at ${bin}`);
  if (!existsSync(createBin)) throw new Error(`create-oh-my-docs bin missing at ${createBin}`);

  console.log('→ oh-my-docs --help');
  const help = runCapture(bin, ['--help'], { cwd: installDir });
  if (!help.includes('init') || !help.includes('doctor')) {
    throw new Error(`unexpected --help output:\n${help}`);
  }

  console.log('→ oh-my-docs init --yes --dry-run');
  run(bin, ['init', projectDir, '--yes', '--dry-run'], { cwd: installDir });

  console.log('→ oh-my-docs init --yes (actual scaffold)');
  mkdirSync(projectDir, { recursive: true });
  run(bin, ['init', projectDir, '--yes'], { cwd: installDir });

  console.log('→ oh-my-docs doctor');
  const doctor = runCapture(bin, ['doctor'], { cwd: projectDir });
  console.log(doctor.trim());
  if (!/docs/i.test(doctor)) {
    throw new Error(`doctor output missing docs signal:\n${doctor}`);
  }

  console.log('→ create-oh-my-docs --help');
  const createHelp = runCapture(createBin, ['--help'], { cwd: installDir });
  if (!/init|Usage|Options/i.test(createHelp)) {
    throw new Error(`unexpected create-oh-my-docs --help output:\n${createHelp}`);
  }

  console.log('✓ pack smoke passed');
} catch (error) {
  failed = true;
  console.error(`✗ pack smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  if (error && typeof error === 'object' && 'stdout' in error && error.stdout) {
    console.error(String(error.stdout));
  }
  if (error && typeof error === 'object' && 'stderr' in error && error.stderr) {
    console.error(String(error.stderr));
  }
  process.exitCode = 1;
} finally {
  rmSync(packDir, { recursive: true, force: true });
  rmSync(installDir, { recursive: true, force: true });
}

if (!failed) process.exit(0);
