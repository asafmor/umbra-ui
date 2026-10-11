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

**Confirmed 2026-10-10**: npm; MIT licence; `lucide-react` as the default icon set; fonts (Barlow Condensed, Figtree) are loaded by the app, not shipped by the library.

**Changed 2026-10-11 (examples)**: no npm workspaces. Changesets cannot version a root package that is also the workspace root (`changeset version` failed), and a workspace example is not a template that works when copied out. The examples are plain folders, each a complete app with its own `package.json`; `npm run examples` installs each against the built package (as a copy, through `install-links`) and builds it. Release steps: `docs/releasing.md`.

**Confirmed 2026-10-11 (support)**: peer range `react >=19` (checked on 19.0.0: a page, the command palette, a tooltip, and `renderToString` on Node 20, 22 and 24); `engines.node >=20`. Browser support is stated in the README: Chrome and Edge 117, Firefox 121, Safari 16.2, from the CSS the stylesheet needs; tested in Chromium only.
