# Document contracts

## Frontmatter expectations

Planning documents carry machine-readable frontmatter. Common fields:

| Field | Used by |
|---|---|
| `id` / `ticker` | Stable identity |
| `title`, `description`, `summary` | Human and catalog display |
| `type` | Document role (`guide`, overview, …) |
| `status` / `stage` | Lifecycle |
| `prd`, `specs`, `stories` | Graph links |
| `codeAreas` | Paths a plan authorizes |
| `related` | Handbook cross-links |

Exact validation grows with `omdocs check`. Treat IDs as immutable once
published; update the existing document instead of duplicating intent.

## Marker blocks

`AGENTS.md` and `CLAUDE.md` may contain a managed block:

```html
<!-- oh-my-docs:start -->
…
<!-- oh-my-docs:end -->
```

Only `omdocs setup` should create or refresh that block. Surrounding project
content outside the markers is preserved.

## Skill trees

Installed skills live under host discovery paths. Refresh them with
`omdocs setup` (add `--force` when a local copy diverged and should be replaced).
