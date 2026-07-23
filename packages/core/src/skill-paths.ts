import { homedir } from 'node:os';
import { join } from 'node:path';

import type { AgentKind, SetupScope } from './types.ts';

export type ConcreteAgent = Exclude<AgentKind, 'all'>;

/** Official project-relative discovery roots for the `setup` skill. */
export const PROJECT_SKILL_ROOTS: Readonly<Record<ConcreteAgent, string>> = {
  cursor: '.cursor/skills/setup',
  claude: '.claude/skills/setup',
  codex: '.agents/skills/setup',
};

/** Official user-scope discovery roots (absolute) for the `setup` skill. */
export function userSkillRoot(agent: ConcreteAgent, home: string = homedir()): string {
  switch (agent) {
    case 'cursor':
      return join(home, '.cursor/skills/setup');
    case 'claude':
      return join(home, '.claude/skills/setup');
    case 'codex':
      return join(home, '.agents/skills/setup');
  }
}

export function agentsFor(agent: AgentKind | undefined): readonly ConcreteAgent[] {
  if (!agent || agent === 'all') return ['codex', 'cursor', 'claude'];
  return [agent];
}

export function skillInstallRoot(
  agent: ConcreteAgent,
  scope: SetupScope,
  projectRoot: string,
  home: string = homedir(),
): { readonly absolute: string; readonly displayPath: string } {
  if (scope === 'user') {
    const absolute = userSkillRoot(agent, home);
    return { absolute, displayPath: absolute };
  }
  const relative = PROJECT_SKILL_ROOTS[agent];
  return { absolute: join(projectRoot, relative), displayPath: relative };
}
