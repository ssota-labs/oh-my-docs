# Oh My Docs

Oh My Docs turns a Fumadocs handbook into the docs-first working surface for
product development. Agents install one skill (`oh-my-doc`) and drive a bundled
Node runtime — users do not run a public CLI.

## Install

Ask your coding agent:

```text
Oh My Docs 스킬을 설치하고 이 프로젝트를 세팅해줘
```

The agent should run:

```bash
npx skills add ssota-labs/oh-my-docs --skill oh-my-doc -y
node <skill>/scripts/omd.mjs inspect --json
node <skill>/scripts/omd.mjs adopt --yes --json
node <skill>/scripts/omd.mjs check --json
```

## UI distribution

- Docs shell base: **Fumadocs**
- Planning vocabulary install: **shadcn registry** (code copy), not npm

```bash
npx shadcn add ssota-labs/oh-my-docs/oh-my-docs-ui
```

Offline `adopt` installs the same sources from the skill template snapshot.

## Optional host plugins

Plugin wrappers mirror `skills/oh-my-doc` for marketplace discovery. They do not
own a separate runtime.

| Host | Marketplace |
|---|---|
| Claude Code | `.claude-plugin/marketplace.json` |
| Cursor | `.cursor-plugin/marketplace.json` |
| Codex | `.agents/plugins/marketplace.json` |

## Develop this repository

```bash
pnpm install
pnpm sync:skills
pnpm check:registry
pnpm check:planning
pnpm test
pnpm build
```

Maintainer runtime entrypoint:

```bash
pnpm omd -- help
```
