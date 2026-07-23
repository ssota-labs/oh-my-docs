import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkReleaseVersions,
  createVersionFixture,
  removeFixture,
  versionFromTag,
} from './lib/release-version.mjs';

test('versionFromTag strips v prefix and rejects junk', () => {
  assert.equal(versionFromTag('v0.1.0'), '0.1.0');
  assert.equal(versionFromTag('1.2.3-beta.1'), '1.2.3-beta.1');
  assert.throws(() => versionFromTag('release-1'), /semver/);
});

test('checkReleaseVersions passes when packages and manifests share a version', () => {
  const root = createVersionFixture({ version: '0.1.0' });
  try {
    const result = checkReleaseVersions(root, '0.1.0');
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.version, '0.1.0');
      assert.ok(result.checked.includes('oh-my-docs'));
      assert.ok(result.checked.includes('plugins/cursor/.cursor-plugin/plugin.json'));
    }
  } finally {
    removeFixture(root);
  }
});

test('checkReleaseVersions fails when a public package drifts', () => {
  const root = createVersionFixture({
    version: '0.1.0',
    packageVersions: { 'oh-my-docs': '0.1.1' },
  });
  try {
    const result = checkReleaseVersions(root, '0.1.0');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.problems.some((p) => p.includes('oh-my-docs') && p.includes('0.1.1')));
    }
  } finally {
    removeFixture(root);
  }
});

test('checkReleaseVersions fails when a plugin manifest drifts', () => {
  const root = createVersionFixture({
    version: '0.1.0',
    manifestVersions: {
      'plugins/claude-code/.claude-plugin/plugin.json': '0.0.9',
    },
  });
  try {
    const result = checkReleaseVersions(root, 'v0.1.0'.replace(/^v/, ''));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.problems.some((p) => p.includes('claude-code') && p.includes('0.0.9')));
    }
  } finally {
    removeFixture(root);
  }
});

test('checkReleaseVersions without wantVersion uses shared package version', () => {
  const root = createVersionFixture({ version: '0.2.0' });
  try {
    const result = checkReleaseVersions(root);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.version, '0.2.0');
  } finally {
    removeFixture(root);
  }
});

test('checkReleaseVersions fails when an expected public package is missing', () => {
  const root = createVersionFixture({
    version: '0.1.0',
    omitPackages: ['@oh-my-docs/ui'],
  });
  try {
    const result = checkReleaseVersions(root, '0.1.0');
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.problems.some((p) => p.includes('@oh-my-docs/ui')));
    }
  } finally {
    removeFixture(root);
  }
});
