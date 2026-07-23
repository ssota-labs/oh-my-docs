# Information architecture

Generated and maintained handbooks use a stable top-level IA:

| Section | Role |
|---|---|
| Start here | Shortest path into the product |
| Workflow | Planning and development contracts |
| Planning | PRD and story catalogs (index-only) |
| Spec | Observable behavior |
| Development | Plans and ADRs (index-only catalogs) |
| Agent | Host-facing guidance for coding agents |

Catalog folders (`planning/prds`, `planning/stories`, `development/plans`,
`development/adr`) stay index-only in the sidebar. Each document is registered
in its sibling `meta.json`.

Browser pages expose a processed Markdown twin at the same URL with `.md`
appended so agents can read the identical SSOT without scraping HTML.
