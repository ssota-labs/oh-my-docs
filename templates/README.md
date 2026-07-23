# Templates

`templates/default` is the canonical user scaffold copied by `oh-my-docs init`
(and packaged into `packages/cli/templates/default` on build).

`apps/docs` is the Oh My Docs product handbook for this repository. It is not
the user scaffold. Both share the same docs-first IA and `@oh-my-docs/ui` shape;
product content intentionally differs.

When you change `packages/ui`, refresh the scaffold copy:

```bash
rm -rf templates/default/packages/ui
cp -a packages/ui templates/default/packages/ui
rm -rf templates/default/packages/ui/node_modules templates/default/packages/ui/.turbo
```
