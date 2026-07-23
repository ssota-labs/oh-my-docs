# Changelog

All notable changes to Oh My Docs are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Public npm packages (`oh-my-docs`, `create-oh-my-docs`, `@oh-my-docs/core`,
`@oh-my-docs/ui`) and the three agent plugin manifests share a **single version**.

## [0.1.0] — Unreleased

Foundation release of the Oh My Docs monorepo. Not yet published to npm until a
`v0.1.0` tag is pushed and Trusted Publishing is configured for the package set.

### Added

- `@oh-my-docs/core` — project detection, init/setup plans, planning validation,
  docs-first gate helpers, and `omdocs new` document creation.
- `oh-my-docs` CLI (`omdocs`) — `init`, `setup`, `check`, `new`, `doctor`.
- `create-oh-my-docs` — `npm create oh-my-docs` entry that forwards to `init`.
- `@oh-my-docs/ui` — reusable Fumadocs document components.
- Default scaffold template under `templates/default` (synced into the CLI pack).
- Shared `setup` skill plus Codex, Cursor, and Claude Code plugin adapters.
- Marketplace descriptors for Claude Code, Cursor, and Codex.
- Planning validation (`pnpm check:planning`) and docs-first CI gate.
- Release gates: `check:release-version`, `check:pack-smoke`, and
  `.github/workflows/release.yml` (npm Trusted Publishing / OIDC + provenance).
