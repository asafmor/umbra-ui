# 05 — Packaging: one package with sub-entries

**Decided** 2026-10-10.

| Import | Content |
|---|---|
| `umbra-ui` | Provider, layout, shell and all non-chart components |
| `umbra-ui/charts` | Chart components (keeps chart code out of apps that do not use it) |
| `umbra-ui/styles.css` | The stylesheet |

- One install, one version number.
- Tree-shakeable, so unused components are dropped by the app's bundler.
- The default icon set is a dependency; built-in icons come from an overridable map on the provider.

**Rejected**: several scoped packages (version juggling, release overhead). Copy-in CLI (users stop receiving updates; the layout system is hard to keep consistent).

**Confirmed 2026-10-10**: TypeScript, ESM only, React 19 and later as the supported range.
