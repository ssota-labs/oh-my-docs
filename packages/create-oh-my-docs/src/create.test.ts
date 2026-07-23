import assert from 'node:assert/strict';
import test from 'node:test';

test('create-oh-my-docs package forwards to oh-my-docs init', async () => {
  const mod = await import('oh-my-docs');
  assert.equal(typeof mod.runCli, 'function');
});
