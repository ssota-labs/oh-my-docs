# Agent compatibility

## Explicit invocation

This skill disables implicit model invocation. Call it on purpose:

| Host | Invocation |
|---|---|
| Cursor | `/setup` |
| Claude Code | `/oh-my-docs:setup` |
| Codex | `/skills` then choose `setup`, or `$setup` |

## Discovery paths (`omdocs setup`)

| Host | Project scope | User scope |
|---|---|---|
| Cursor | `.cursor/skills/setup` | `~/.cursor/skills/setup` |
| Codex | `.agents/skills/setup` | `~/.agents/skills/setup` |
| Claude Code | `.claude/skills/setup` | `~/.claude/skills/setup` |

Cursor also discovers `.agents/skills/`; Oh My Docs installs Cursor skills under
`.cursor/skills` so the path stays host-specific and stable.

## Plugin packages

Marketplace / local-load adapters live in this repository:

| Host | Plugin root | Manifest |
|---|---|---|
| Codex | `plugins/codex` | `.codex-plugin/plugin.json` |
| Cursor | `plugins/cursor` | `.cursor-plugin/plugin.json` |
| Claude Code | `plugins/claude-code` | `.claude-plugin/plugin.json` |

Skill content is authored once under `plugins/shared/skills/setup` and synced
into each adapter (and into the CLI package for `omdocs setup` installs).

## Implicit invocation controls

| Host | Control |
|---|---|
| Cursor / Claude Code | `disable-model-invocation: true` in `SKILL.md` |
| Codex | `agents/openai.yaml` → `policy.allow_implicit_invocation: false` |
