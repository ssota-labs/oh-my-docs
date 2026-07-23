import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_AGENTS_MARKER_BODY,
  hasMarkerBlock,
  mergeMarkerBlock,
  wrapMarkerBlock,
} from './markers.ts';

test('wrapMarkerBlock surrounds managed body', () => {
  const wrapped = wrapMarkerBlock('hello');
  assert.match(wrapped, /<!-- oh-my-docs:start -->/);
  assert.match(wrapped, /hello/);
  assert.match(wrapped, /<!-- oh-my-docs:end -->/);
  assert.equal(hasMarkerBlock(wrapped), true);
});

test('mergeMarkerBlock creates, replaces, and skips idempotently', () => {
  const created = mergeMarkerBlock(null, 'one');
  assert.equal(created.kind, 'create');
  assert.equal(hasMarkerBlock(created.content), true);

  const replaced = mergeMarkerBlock(created.content, 'two');
  assert.equal(replaced.kind, 'merge');
  assert.match(replaced.content, /two/);
  assert.doesNotMatch(replaced.content, /one/);

  const skipped = mergeMarkerBlock(replaced.content, 'two');
  assert.equal(skipped.kind, 'skip');
});

test('mergeMarkerBlock appends when no marker exists', () => {
  const merged = mergeMarkerBlock('# Custom\n\nKeep me.\n', DEFAULT_AGENTS_MARKER_BODY);
  assert.equal(merged.kind, 'merge');
  assert.match(merged.content, /# Custom/);
  assert.match(merged.content, /<!-- oh-my-docs:start -->/);
});
