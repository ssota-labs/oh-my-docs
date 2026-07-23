---
name: setup
description: Install or refresh Oh My Docs agent instructions and discovery skills via the CLI. Use when the user asks to set up Oh My Docs, refresh AGENTS.md/CLAUDE.md markers, or install agent skills. Do not hand-edit managed marker blocks or skill files — run the CLI.
disable-model-invocation: true
---

# Oh My Docs setup

Install or refresh project markers and agent skills by calling the CLI. Do not
edit `AGENTS.md`, `CLAUDE.md`, or skill trees by hand when the CLI can do it.

## Run setup

Prefer a local binary when available, otherwise use `npx`:

```bash
omdocs setup --agent all --scope project --yes
# or
npx oh-my-docs@latest setup --agent all --scope project --yes
```

Or run the bundled helper (same behavior):

```bash
node scripts/run-setup.mjs all project
```

Flags:

| Flag | Values | Default |
|---|---|---|
| `--agent` | `codex`, `cursor`, `claude`, `all` | `all` |
| `--scope` | `project`, `user` | `project` |
| `--dry-run` | | plan only |
| `--force` | | overwrite divergent skill files |

`project` scope writes under the repository. `user` scope writes skills under
the home discovery directories and still refreshes project marker blocks.

## After setup

1. Confirm `AGENTS.md` / `CLAUDE.md` contain the managed `oh-my-docs` marker.
2. Confirm the host discovery path contains this `setup` skill.
3. Read `references/` only when the task needs methodology detail.

## Progressive disclosure

| File | When to read |
|---|---|
| `references/methodology.md` | Product intent and docs-first principles |
| `references/information-architecture.md` | Handbook section layout |
| `references/planning-workflow.md` | How to plan before code |
| `references/implementation-workflow.md` | How to implement under a ready plan |
| `references/document-contracts.md` | Frontmatter, IDs, and catalog rules |
| `references/agent-compatibility.md` | Host invocation and discovery paths |
| `assets/AGENTS.md` / `assets/CLAUDE.md` | Marker body templates (CLI-managed) |

## Hard rules

- Never invent product requirements from code alone.
- Never skip the docs-first gate for product, bugfix, or maintenance work.
- Never hand-edit managed marker blocks; re-run setup (or `--force` when
  refreshing divergent skill copies).
