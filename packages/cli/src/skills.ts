import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Resolve the packaged setup skill tree.
 * Published layout: dist → ../skills/setup
 * Monorepo fallback: plugins/shared/skills/setup
 */
export function resolveSkillRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, '../skills/setup'),
    join(here, '../../skills/setup'),
    join(here, '../../../plugins/shared/skills/setup'),
    join(here, '../../../../plugins/shared/skills/setup'),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'SKILL.md'))) return candidate;
  }

  throw new Error(
    `Oh My Docs setup skill not found. Looked in:\n${candidates.map((c) => `- ${c}`).join('\n')}`,
  );
}
