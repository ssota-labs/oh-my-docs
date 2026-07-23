/**
 * Shared release-version checks for public npm packages and agent plugin manifests.
 *
 * All public packages and plugin manifests share one version on purpose so a
 * tagged release cannot ship a CLI that expects a different core, or a plugin
 * that `claude plugin update` treats as already current.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const PUBLIC_PACKAGE_NAMES = Object.freeze([
  'oh-my-docs',
  'create-oh-my-docs',
  '@oh-my-docs/core',
  '@oh-my-docs/ui',
]);

export const PLUGIN_MANIFEST_RELATIVE_PATHS = Object.freeze([
  'plugins/claude-code/.claude-plugin/plugin.json',
  'plugins/codex/.codex-plugin/plugin.json',
  'plugins/cursor/.cursor-plugin/plugin.json',
]);

/** Cursor marketplace descriptors that carry an explicit version field. */
export const MARKETPLACE_VERSION_PATHS = Object.freeze([
  '.cursor-plugin/marketplace.json',
  'marketplaces/cursor/marketplace.json',
]);

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

/**
 * @param {string} tag
 * @returns {string}
 */
export function versionFromTag(tag) {
  const want = tag.replace(/^v/, '');
  if (!SEMVER.test(want)) {
    throw new Error(`tag ${tag} is not a semver version`);
  }
  return want;
}

/**
 * @param {string} root
 * @returns {{ name: string, version: string, path: string }[]}
 */
export function collectPublicPackages(root) {
  const pkgsDir = join(root, 'packages');
  /** @type {{ name: string, version: string, path: string }[]} */
  const found = [];
  for (const name of readdirSync(pkgsDir)) {
    const path = join(pkgsDir, name, 'package.json');
    if (!existsSync(path)) continue;
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    if (pkg.private) continue;
    found.push({ name: pkg.name, version: pkg.version, path });
  }
  return found;
}

/**
 * @param {string} root
 * @returns {{ name: string, version: string, path: string }[]}
 */
export function collectPluginManifests(root) {
  return PLUGIN_MANIFEST_RELATIVE_PATHS.map((rel) => {
    const path = join(root, rel);
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    return { name: rel, version: pkg.version, path };
  });
}

/**
 * @param {string} root
 * @returns {{ name: string, version: string, path: string }[]}
 */
export function collectMarketplaceVersions(root) {
  /** @type {{ name: string, version: string, path: string }[]} */
  const found = [];
  for (const rel of MARKETPLACE_VERSION_PATHS) {
    const path = join(root, rel);
    if (!existsSync(path)) continue;
    const doc = JSON.parse(readFileSync(path, 'utf8'));
    const metaVersion = doc?.metadata?.version;
    if (typeof metaVersion === 'string') {
      found.push({ name: `${rel}#metadata.version`, version: metaVersion, path });
    }
    const pluginVersion = doc?.plugins?.[0]?.version;
    if (typeof pluginVersion === 'string') {
      found.push({ name: `${rel}#plugins[0].version`, version: pluginVersion, path });
    }
  }
  return found;
}

/**
 * @param {string} root
 * @param {string} [wantVersion] when omitted, uses the first public package version
 * @returns {{ ok: true, version: string, checked: string[] } | { ok: false, version: string, problems: string[], checked: string[] }}
 */
export function checkReleaseVersions(root, wantVersion) {
  const packages = collectPublicPackages(root);
  const manifests = collectPluginManifests(root);
  const marketplaces = collectMarketplaceVersions(root);
  const checked = [
    ...packages.map((p) => p.name),
    ...manifests.map((m) => m.name),
    ...marketplaces.map((m) => m.name),
  ];

  if (packages.length === 0) {
    return {
      ok: false,
      version: wantVersion ?? '',
      problems: ['no public packages found under packages/'],
      checked,
    };
  }

  const expectedNames = new Set(PUBLIC_PACKAGE_NAMES);
  const foundNames = new Set(packages.map((p) => p.name));
  /** @type {string[]} */
  const problems = [];

  for (const name of expectedNames) {
    if (!foundNames.has(name)) problems.push(`missing public package ${name}`);
  }
  for (const name of foundNames) {
    if (!expectedNames.has(name)) {
      problems.push(`unexpected public package ${name} (update PUBLIC_PACKAGE_NAMES if intentional)`);
    }
  }

  const version = wantVersion ?? packages[0].version;
  if (!SEMVER.test(version)) {
    problems.push(`version ${version} is not a semver version`);
  }

  for (const pkg of packages) {
    if (pkg.version !== version) {
      problems.push(`${pkg.name}: package.json says ${pkg.version}, expected ${version}`);
    }
  }
  for (const manifest of manifests) {
    if (manifest.version !== version) {
      problems.push(`${manifest.name}: says ${manifest.version}, expected ${version}`);
    }
  }
  for (const marketplace of marketplaces) {
    if (marketplace.version !== version) {
      problems.push(`${marketplace.name}: says ${marketplace.version}, expected ${version}`);
    }
  }

  if (problems.length > 0) {
    return { ok: false, version, problems, checked };
  }
  return { ok: true, version, checked };
}

/**
 * Fixture helper for unit tests — builds a tiny repo tree with public packages
 * and plugin manifests at the given version (or per-path overrides).
 *
 * @param {{
 *   version?: string,
 *   packageVersions?: Record<string, string>,
 *   manifestVersions?: Record<string, string>,
 *   omitPackages?: string[],
 * }} [options]
 * @returns {string} temp root path
 */
export function createVersionFixture(options = {}) {
  const version = options.version ?? '0.1.0';
  const root = mkdtempSync(join(tmpdir(), 'omdocs-release-version-'));
  mkdirSync(join(root, 'packages'), { recursive: true });

  const packageDirs = {
    'oh-my-docs': 'cli',
    'create-oh-my-docs': 'create-oh-my-docs',
    '@oh-my-docs/core': 'core',
    '@oh-my-docs/ui': 'ui',
  };

  for (const [name, dir] of Object.entries(packageDirs)) {
    if (options.omitPackages?.includes(name)) continue;
    const pkgVersion = options.packageVersions?.[name] ?? version;
    mkdirSync(join(root, 'packages', dir), { recursive: true });
    writeFileSync(
      join(root, 'packages', dir, 'package.json'),
      JSON.stringify({ name, version: pkgVersion }, null, 2),
    );
  }

  // Private package should be ignored by the collector.
  mkdirSync(join(root, 'packages', 'internal-config'), { recursive: true });
  writeFileSync(
    join(root, 'packages', 'internal-config', 'package.json'),
    JSON.stringify({ name: '@oh-my-docs/internal', version: '9.9.9', private: true }, null, 2),
  );

  for (const rel of PLUGIN_MANIFEST_RELATIVE_PATHS) {
    const manifestVersion = options.manifestVersions?.[rel] ?? version;
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), JSON.stringify({ name: 'oh-my-docs', version: manifestVersion }, null, 2));
  }

  return root;
}

/**
 * @param {string} root
 */
export function removeFixture(root) {
  rmSync(root, { recursive: true, force: true });
}
