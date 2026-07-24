# Information architecture

Generated and maintained handbooks use a stable top-level IA:

| Section | Role |
|---|---|
| Home | Handbook landing page |
| Vision | Product vision |
| Start here | Shortest path into the product |
| Domain | Living terms, models, and policies |
| Workflow | Planning and development contracts |
| Planning | PRD and story catalogs (index-only) |
| Development | Plans and ADRs (index-only catalogs) |
| Spec | Observable behavior |

Default order:

`Home → Vision → Start here → Domain → Workflow → Planning → Development → Spec`

There is no default **Agent** section. IA is editable later via `.omd/project.json`
and `sync`.

Domain contains:

- `glossary/` (`TERM-*`)
- `models/` (`MODEL-*`)
- `policies/` (`POLICY-*`)

Domain and SPEC are living catalogs. PRDs and PLANs remain change-scoped
catalogs, ADRs remain decision records, and `.omd/tasks` is execution state.

Catalog folders (`planning/prds`, `planning/stories`, `development/plans`,
`development/adr`) stay index-only in the sidebar. Each document is registered
in its sibling `meta.json`.

Browser pages expose a processed Markdown twin at the same URL with `.md`
appended so agents can read the identical SSOT without scraping HTML.
