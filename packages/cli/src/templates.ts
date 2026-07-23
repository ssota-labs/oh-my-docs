import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Resolve the packaged template directory.
 * Published layout: dist/cli.js → ../templates/default
 * Monorepo fallback: ../../templates/default from packages/cli
 */
export function resolveTemplateRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const packaged = join(here, '../templates/default');
  if (existsSync(packaged)) return packaged;

  const monorepo = join(here, '../../templates/default');
  if (existsSync(monorepo)) return monorepo;

  // When running tests via strip-types from src/
  const fromSrc = join(here, '../../../templates/default');
  if (existsSync(fromSrc)) return fromSrc;

  throw new Error(
    `Oh My Docs template not found. Looked in:\n- ${packaged}\n- ${monorepo}\n- ${fromSrc}`,
  );
}
