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
   already exist on the PR base with `stage: ready|active` and `codeAreas`
   covering every non-docs path in the diff.
7. If scope changes during implementation, update and review the plan first.
8. Mark the plan `done` only after implementation and verification complete.

### Exemptions

- **Docs-only** changes under `apps/docs/content/docs/`, `apps/docs/templates/`,
  plus root `README.md` / `CHANGELOG.md`, do not require a prior plan.
- There is **no** general bypass for product, bugfix, or maintenance code.
- Local runs without `BASE_SHA` skip the docs-first script (CI always sets it
  on pull requests).

The dependency direction is:

`product vision → PRD → story → specification/ADR → implementation plan → code`

Earlier documents describe user needs without relying on later implementation
terminology. Use stable IDs and update existing documents instead of duplicating
an idea under a new ID. Register every catalog document in its sibling
`meta.json`.

Create artifacts with `node skills/oh-my-doc/scripts/omd.mjs new prd|story|spec|plan|adr --title "…"`.

## Commands

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm check:planning
pnpm check:docs-first   # requires BASE_SHA in CI; skips locally when unset
pnpm check:release-version   # optional: pass vX.Y.Z to match a release tag
pnpm check:pack-smoke        # build → npm pack → temp install → CLI smoke
node skills/oh-my-doc/scripts/omd.mjs new <kind> --title "…" [--id ID] [--dry-run] [--yes] [--json]
```

Do not hand-edit generated files in `apps/docs/.source`.

## Release

Public packages and plugin manifests share one version. Tag `vX.Y.Z` only after
`check:release-version` and `check:pack-smoke` pass. Publishing uses
`.github/workflows/release.yml` with npm Trusted Publishing (OIDC); humans must
configure Trusted Publishers on npmjs.com before the first tag publish. Do not
publish from a developer machine.
