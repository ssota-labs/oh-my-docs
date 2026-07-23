# Oh My Docs

Oh My Docs is a docs-first product workspace toolkit. It scaffolds a Fumadocs
handbook that is both the human-readable product guide and the single source of
truth (SSOT) for planning, then keeps agent instructions and setup skills in
sync across Codex, Cursor, and Claude Code.

## Prerequisites

- Node.js 24 or newer
- pnpm 11.5.2 (for developing this repository)

## Install (npm CLI)

Scaffold a new docs-first workspace:

```bash
npx oh-my-docs@latest init my-product --yes
# or
npm create oh-my-docs@latest my-product -- --yes
```

In an existing repo, merge the handbook and markers:

```bash
npx oh-my-docs@latest init --yes
npx oh-my-docs@latest setup --agent all --scope project --yes
npx oh-my-docs@latest doctor
```

Until `v0.1.0` is published, use a local build from this monorepo:

```bash
pnpm install
pnpm --filter create-oh-my-docs... build
pnpm omdocs -- init --yes
```

## Install (agent plugins)

The npm CLI and the agent plugins are **separate channels**. The CLI scaffolds
files and validates the planning graph; the plugins expose the `setup` skill so
an agent session can drive that CLI without hand-editing markers.

| Host | Add marketplace | Install plugin |
|---|---|---|
| Claude Code | `/plugin marketplace add ssota-labs/oh-my-docs` | `/plugin install oh-my-docs@oh-my-docs` |
| Cursor | Import the GitHub repo in **Settings → Plugins** (reads `.cursor-plugin/marketplace.json`) | Enable `oh-my-docs` |
| Codex | `codex plugin marketplace add ssota-labs/oh-my-docs` | `codex plugin install oh-my-docs` |

Descriptor sources (mirrored under [`marketplaces/`](marketplaces/README.md)):

- Claude Code → [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) → `plugins/claude-code`
- Cursor → [`.cursor-plugin/marketplace.json`](.cursor-plugin/marketplace.json) → `plugins/cursor`
- Codex → [`.agents/plugins/marketplace.json`](.agents/plugins/marketplace.json) → `plugins/codex`

If the GitHub repository is still named `visual-plan`, substitute that name in
the marketplace add commands until the remote is renamed to `oh-my-docs`.

### Setup skill invocation

The `setup` skill disables implicit model invocation. Call it explicitly:

| Host | Invocation |
|---|---|
| Cursor | `/setup` |
| Claude Code | `/oh-my-docs:setup` |
| Codex | `/skills` → `setup`, or `$setup` |

The skill runs `omdocs setup` (or `npx oh-my-docs@latest setup`) and refreshes
managed `AGENTS.md` / `CLAUDE.md` markers plus host skill trees. Details:
`plugins/shared/skills/setup/references/agent-compatibility.md`.

## Develop this repository

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm typecheck
pnpm check:planning
pnpm check:docs-first   # skips locally when BASE_SHA is unset
pnpm check:release-version
pnpm check:pack-smoke
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
| `plugins/` | `@oh-my-docs/plugins` | Shared setup skill + host adapters |
| `templates/default` | — | Canonical user scaffold for `init` |

## Release

Public packages and plugin manifests share one version (currently **0.1.0**).
See [CHANGELOG.md](CHANGELOG.md).

1. Bump `version` in every public `packages/*/package.json` and in
   `plugins/*/.{claude,codex,cursor}-plugin/plugin.json`.
2. Update marketplace metadata versions when present (Cursor).
3. `node scripts/check-release-version.mjs vX.Y.Z` (or `pnpm check:release-version -- vX.Y.Z`).
4. `pnpm check:pack-smoke` — builds, packs, installs tarballs locally, runs CLI smoke.
5. Commit `release: vX.Y.Z — <summary>`, merge to the default branch.
6. `git tag vX.Y.Z && git push origin vX.Y.Z` — [`.github/workflows/release.yml`](.github/workflows/release.yml)
   publishes with npm Trusted Publishing (OIDC) and provenance.

**Human setup before the first publish:** on npmjs.com, configure Trusted
Publisher for `oh-my-docs`, `create-oh-my-docs`, `@oh-my-docs/core`, and
`@oh-my-docs/ui` pointing at this repo’s `release.yml`. Create the `@oh-my-docs`
org/scope if needed. No long-lived `NPM_TOKEN` is required once OIDC is wired.

## License

[MIT](LICENSE)

See [templates/README.md](templates/README.md) for the handbook vs scaffold
split, and [AGENTS.md](AGENTS.md) for the canonical agent workflow.
