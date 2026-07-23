# Oh My Docs

Oh My Docs is a docs-first product workspace. The repository starts with a
Fumadocs site that is both the human-readable product handbook and the
single source of truth (SSOT) for planning.

## Prerequisites

- Node.js 24 or newer
- pnpm 11.5.2

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm typecheck
pnpm check:planning
pnpm check:docs-first   # skips locally when BASE_SHA is unset
omdocs new prd --title "…" --yes
```

## Packages

| Package | Name | Role |
|---|---|---|
| `apps/docs` | `@oh-my-docs/docs` | Product handbook (SSOT) |
| `packages/ui` | `@oh-my-docs/ui` | Shared Fumadocs document components |
| `packages/core` | `@oh-my-docs/core` | Detection, planning, validation |
| `packages/cli` | `oh-my-docs` | `omdocs` / `oh-my-docs` CLI |
| `packages/create-oh-my-docs` | `create-oh-my-docs` | `npm create oh-my-docs` entry |
| `plugins/` | `@oh-my-docs/plugins` | Shared setup skill + Codex/Cursor/Claude adapters |
| `templates/default` | — | Canonical user scaffold for `init` |

See [templates/README.md](templates/README.md) for the handbook vs scaffold split,
and [AGENTS.md](AGENTS.md) for the canonical workflow.
