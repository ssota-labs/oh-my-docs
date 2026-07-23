# Marketplace descriptors

Host-facing marketplace manifests live at the repository root (what Claude Code,
Cursor, and Codex resolve when you add this GitHub repo as a marketplace):

| Host | Root manifest | Plugin source |
|---|---|---|
| Claude Code | [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json) | `plugins/claude-code` |
| Cursor | [`.cursor-plugin/marketplace.json`](../.cursor-plugin/marketplace.json) | `plugins/cursor` |
| Codex | [`.agents/plugins/marketplace.json`](../.agents/plugins/marketplace.json) | `plugins/codex` |

The copies under `marketplaces/{claude,cursor,codex}/` mirror those root files
for browsing and review. Keep them in sync when changing plugin sources or
descriptions — `pnpm test` includes a marketplace sync check.
