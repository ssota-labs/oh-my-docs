import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const pairs = [
  {
    label: 'claude',
    host: '.claude-plugin/marketplace.json',
    mirror: 'marketplaces/claude/marketplace.json',
    pluginSource: './plugins/claude-code',
  },
  {
    label: 'cursor',
    host: '.cursor-plugin/marketplace.json',
    mirror: 'marketplaces/cursor/marketplace.json',
    pluginSource: './plugins/cursor',
  },
  {
    label: 'codex',
    host: '.agents/plugins/marketplace.json',
    mirror: 'marketplaces/codex/marketplace.json',
    pluginSource: './plugins/codex',
  },
] as const;

for (const pair of pairs) {
  test(`marketplace mirror matches host descriptor: ${pair.label}`, () => {
    const host = readFileSync(join(root, pair.host), 'utf8');
    const mirror = readFileSync(join(root, pair.mirror), 'utf8');
    assert.equal(mirror, host, `${pair.mirror} must match ${pair.host}`);
  });

  test(`marketplace points at plugin package: ${pair.label}`, () => {
    const raw = JSON.parse(readFileSync(join(root, pair.host), 'utf8')) as {
      plugins: Array<{ source: string | { path: string } }>;
    };
    assert.ok(Array.isArray(raw.plugins) && raw.plugins.length >= 1);
    const source = raw.plugins[0]?.source;
    if (typeof source === 'string') {
      assert.equal(source, pair.pluginSource);
    } else {
      assert.equal(source?.path, pair.pluginSource);
    }
  });
}
