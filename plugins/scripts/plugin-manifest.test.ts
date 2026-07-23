import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const pluginsRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

interface ManifestCase {
  readonly label: string;
  readonly path: string;
  readonly required: readonly string[];
}

const manifests: readonly ManifestCase[] = [
  {
    label: 'codex',
    path: join(pluginsRoot, 'codex/.codex-plugin/plugin.json'),
    required: ['name', 'version', 'description', 'skills', 'author', 'license'],
  },
  {
    label: 'cursor',
    path: join(pluginsRoot, 'cursor/.cursor-plugin/plugin.json'),
    required: ['name', 'version', 'description', 'skills', 'author', 'license'],
  },
  {
    label: 'claude-code',
    path: join(pluginsRoot, 'claude-code/.claude-plugin/plugin.json'),
    required: ['name', 'version', 'description', 'author', 'license'],
  },
];

function asRecord(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, 'object');
  assert.notEqual(value, null);
  return value as Record<string, unknown>;
}

for (const item of manifests) {
  test(`plugin manifest schema: ${item.label}`, () => {
    const raw = JSON.parse(readFileSync(item.path, 'utf8')) as unknown;
    const manifest = asRecord(raw);
    for (const field of item.required) {
      assert.ok(field in manifest, `missing required field "${field}"`);
      const value = manifest[field];
      if (field === 'author') {
        const author = asRecord(value);
        assert.equal(typeof author.name, 'string');
        assert.ok(author.name.length > 0);
      } else if (typeof value === 'string') {
        assert.ok(value.length > 0, `"${field}" must be non-empty`);
      } else {
        assert.ok(value !== undefined && value !== null, `"${field}" must be present`);
      }
    }
    assert.equal(manifest.name, 'oh-my-docs');
    assert.match(String(manifest.version), /^\d+\.\d+\.\d+/);
  });
}
