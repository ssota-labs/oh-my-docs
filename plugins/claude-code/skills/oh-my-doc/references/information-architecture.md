# Information architecture

Generated and maintained handbooks use a stable top-level IA:

| Section | Role |
|---|---|
| Home | Handbook landing page |
| Vision | Product vision |
| Start here | Shortest path into the product |
| Workflow | Planning and development contracts |
| Planning | PRD and story catalogs (index-only) |
| Plans | Implementation plans (index-only catalog) |
| ADR | Architecture decisions (index-only catalog) |
| Spec | Typed living contract pages (children visible) |

Default order:

`Home → Vision → Start here → Workflow → Planning → Plans → ADR → Spec`

There is no default **Development** or **Agent** section. IA is editable later
via `.omd/project.json` and `sync`.

Catalog folders (`planning/prds`, `planning/stories`, `plans`, `adr`) stay
index-only in the sidebar. Each document is registered in its sibling
`meta.json`. Spec uses typed pages such as `data-model`, `system-model`, and
`cli` instead of an index-only SPEC catalog.

Browser pages expose a processed Markdown twin at the same URL with `.md`
appended so agents can read the identical SSOT without scraping HTML.
