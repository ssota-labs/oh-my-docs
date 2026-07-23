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
```

The docs app lives in `apps/docs`. Product work begins in its PRD, story,
specification, ADR, and implementation-plan catalogs before code changes begin.
See [AGENTS.md](AGENTS.md) for the canonical workflow.
