# Repository instructions

This file is the canonical instruction set for coding agents. `CLAUDE.md`
only points here.

## Project

Oh My Docs is a docs-first product workspace. `apps/docs/content/docs` is the
single source of truth for product intent, observable contracts, decisions,
and implementation plans.

- Node.js >= 24
- pnpm 11.5.2 and Turborepo
- TypeScript strict mode and ESM

## Docs-first gate

Read `workflow/planning.mdx` and `workflow/development.mdx` before changing
product code.

1. Classify the change as `product`, `bugfix`, `maintenance`, or docs-only.
2. Product changes require an active PRD, a story, an accepted specification,
   and a ready implementation plan.
3. Bug fixes require an existing PRD/specification and a ready plan.
4. Maintenance requires a ready plan; add a specification if an observable
   contract changes.
5. If required documents are missing, create and review a docs-only change
   first. Do not combine a new plan and its implementation.
6. An implementation PR must include
   `Plan: apps/docs/content/docs/development/plans/plan-….mdx`; that plan must
   already exist on the PR base with `stage: ready|active`.
7. If scope changes during implementation, update and review the plan first.
8. Mark the plan `done` only after implementation and verification complete.

The dependency direction is:

`product vision → PRD → story → specification/ADR → implementation plan → code`

Earlier documents describe user needs without relying on later implementation
terminology. Use stable IDs and update existing documents instead of duplicating
an idea under a new ID. Register every catalog document in its sibling
`meta.json`.

Docs-only edits are exempt from a prior plan. There is no general bypass.

## Commands

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm check:planning
```

Do not hand-edit generated files in `apps/docs/.source`.
