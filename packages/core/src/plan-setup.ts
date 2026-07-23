import { join } from 'node:path';

import { detectProject } from './detect.ts';
import { readTextIfExists } from './fs-ops.ts';
import {
  DEFAULT_AGENTS_MARKER_BODY,
  DEFAULT_CLAUDE_MARKER_BODY,
  mergeMarkerBlock,
} from './markers.ts';
import type { AgentKind, FileOperation, PlanResult, SetupOptions, SetupScope } from './types.ts';

function op(
  path: string,
  kind: FileOperation['kind'],
  reason: string,
  content?: string,
  conflict?: boolean,
): FileOperation {
  return {
    path,
    kind,
    reason,
    ...(content !== undefined ? { content } : {}),
    ...(conflict ? { conflict: true } : {}),
  };
}

function skillStub(agent: Exclude<AgentKind, 'all'>): { readonly path: string; readonly content: string } {
  const body = `---
name: oh-my-docs-setup
description: Install or refresh Oh My Docs agent instructions via the CLI. Do not edit project files directly — run omdocs setup.
---

# Oh My Docs setup

Use the CLI to apply changes:

\`\`\`bash
npx oh-my-docs@latest setup --agent ${agent} --scope project
\`\`\`

Full platform plugins ship in a later release. This stub keeps discovery stable.
`;

  switch (agent) {
    case 'cursor':
      return { path: '.cursor/skills/oh-my-docs-setup/SKILL.md', content: body };
    case 'claude':
      return { path: '.claude/skills/oh-my-docs-setup/SKILL.md', content: body };
    case 'codex':
      return { path: '.agents/skills/oh-my-docs-setup/SKILL.md', content: body };
  }
}

function agentsFor(agent: AgentKind | undefined): readonly Exclude<AgentKind, 'all'>[] {
  if (!agent || agent === 'all') return ['codex', 'cursor', 'claude'];
  return [agent];
}

function decideSkillWrite(
  root: string,
  relativePath: string,
  content: string,
  force: boolean,
): FileOperation {
  const existing = readTextIfExists(join(root, relativePath));
  if (existing === null) return op(relativePath, 'create', 'install agent skill stub', content);
  if (existing === content) return op(relativePath, 'skip', 'skill stub already up to date', content);
  if (force) return op(relativePath, 'update', 'refresh agent skill stub', content);
  return op(relativePath, 'skip', 'skill stub exists with different content', content, true);
}

/**
 * Plan marker updates and minimal agent skill stubs.
 * Scope \`user\` is reported but not written in Phase 3 (project-only).
 */
export function planSetup(options: SetupOptions): PlanResult {
  const force = options.force === true;
  const scope: SetupScope = options.scope ?? 'project';
  const project = detectProject(options.cwd);
  const operations: FileOperation[] = [];

  if (scope === 'user') {
    operations.push(
      op(
        '(user scope)',
        'skip',
        'user-scope skill install is deferred to Phase 4 plugin adapters',
      ),
    );
  }

  for (const [file, body] of [
    ['AGENTS.md', DEFAULT_AGENTS_MARKER_BODY],
    ['CLAUDE.md', DEFAULT_CLAUDE_MARKER_BODY],
  ] as const) {
    const existing = readTextIfExists(join(project.root, file));
    const merged = mergeMarkerBlock(existing, body, { force: true });
    if (merged.kind === 'skip') {
      operations.push(op(file, 'skip', 'marker already up to date', merged.content));
    } else {
      operations.push(op(file, merged.kind, 'update oh-my-docs marker block', merged.content));
    }
  }

  if (scope === 'project') {
    for (const agent of agentsFor(options.agent)) {
      const stub = skillStub(agent);
      operations.push(decideSkillWrite(project.root, stub.path, stub.content, force));
    }
  }

  const conflicts = operations.filter((item) => item.conflict);
  return { project, operations, conflicts };
}
