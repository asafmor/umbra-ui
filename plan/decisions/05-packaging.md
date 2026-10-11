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

**Confirmed 2026-10-10**: npm with workspaces; MIT licence; `lucide-react` as the default icon set; fonts (Barlow Condensed, Figtree) are loaded by the app, not shipped by the library.

**Build shape (2026-10-11)**: `dist/` holds one JavaScript file per source module, and the stylesheet stays one file. A single `dist/index.js` did not tree-shake under esbuild: the block assignments (`DataTable.Root = Root`) are top-level statements a bundler must keep, so an app importing only `Button` carried `DataTable` and the table engine (565 KB against 184 KB now, minified, React external). With one file per module, `"sideEffects": ["**/*.css"]` lets every bundler drop a whole unused module. `npm run check:package` (`scripts/check-treeshake.mjs`, run in CI after the build) bundles a Button-only app with esbuild and with Vite and fails if the table engine, d3, a chart or `DataTable` is in the output, or if `dist/` holds a story, sample or test file. Type declarations are emitted only for the modules the two entries reach.
