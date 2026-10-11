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

## Build shape (2026-10-11)

Found by the Milestone 1 and release reviews; `npm run check:package` (`scripts/check-treeshake.mjs`, run in CI after the build) checks every line below against the packed tarball.

| Decision | Why |
|---|---|
| One JavaScript file per source module; the stylesheet stays one minified file | A single `dist/index.js` kept every component for any import: the block assignments (`DataTable.Root = Root`) are top-level statements a bundler must keep. With one file per module, `"sideEffects": ["**/*.css"]` lets a bundler drop a whole unused module. `Skeleton` alone went from 61 KB to 0.5 KB gzip through Vite, and from 175 KB to 0.4 KB through esbuild. |
| Not minified; source maps with the source embedded (`sourcesContent`) | The app's bundler minifies. Component names stay readable in React DevTools and in error stacks, and the maps work without `src/` in the package. |
| Blocks get a `displayName` (`Card.Header`) in the build | A block's function is named `Header`; DevTools should say which component it belongs to. A small Vite plugin adds it after each `X.Y = Z` assignment, and to a component the bundler had to rename (`Button`, which shares its name with an import). |
| Every module starts with `"use client"` | The components use hooks, context and browser APIs, so a React Server Components framework must load them as client code. The directive is a banner on every file, since a bundler keeps it per module. Server rendering (`renderToString`) works and is tested. A Server Component can render `<Card title=… />`, but it cannot reach a block (`Card.Header`) through the client reference: compose blocks in a client file. |
| Declarations: relative imports carry `.js`, stylesheet imports are removed, and only files the two entries reach are published (`scripts/fix-types.mjs`) | Without extensions the types did not resolve under `node16` and `nodenext` (an error with `skipLibCheck: false`, silently `any` with it on). No declaration bundler was added: the fix is a 50-line script. |
| `process.env.NODE_ENV` stays in the output | The app's bundler replaces it; the development warnings (`[umbra-ui] …`) are gone from a production bundle under esbuild and Vite. |
| `engines.node` is `>=24` | The only version the build and the checks were run on. Lower it once CI runs a matrix. |

`CheckMark` and `Hint`, the two pieces of a menu row that `Button` draws, moved from `Menu.tsx` to `src/internal/menuRow.tsx`, so a `Button` no longer imports `Menu`. A `Button` still holds React Aria's menu item, because it renders as one inside an overflow menu.
