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

**Confirmed 2026-10-11 (support)**: peer range `react >=19` (checked on 19.0.0: a page, the command palette, a tooltip, and `renderToString` on Node 20, 22 and 24); `engines.node >=20`. Browser support is stated in the README: Chrome and Edge 117, Firefox 125, Safari 17.0 (raised the same day from Firefox 121 and Safari 16.2: decision 06, "Minimums raised"), from the CSS and the Popover API the library needs; tested in Chromium only. `build.cssTarget` is set to the same versions, and `scripts/check-browsers.mjs` keeps them true (decision 06).

## Build shape (2026-10-11)

Found by the Milestone 1 and release reviews; `npm run check:package` (`scripts/check-treeshake.mjs`, run in CI after the build) checks every line below against the packed tarball.

| Decision | Why |
|---|---|
| One JavaScript file per source module; the stylesheet stays one minified file | A single `dist/index.js` kept every component for any import: the block assignments (`DataTable.Root = Root`) are top-level statements a bundler must keep. With one file per module, `"sideEffects": ["**/*.css"]` lets a bundler drop a whole unused module. `Skeleton` alone went from 61 KB to 0.5 KB gzip through Vite, and from 175 KB to 0.4 KB through esbuild. |
| Not minified; source maps with the source embedded (`sourcesContent`) | The app's bundler minifies. Component names stay readable in React DevTools and in error stacks, and the maps work without `src/` in the package. Kept after the Milestone 1 review: the maps are about 1.5 MB unpacked, three quarters of it the embedded source, and cost install size only, never an app's bundle. Maps without the source would point at files the package does not hold. No declaration maps, for the same reason. The checks and the packed-size limit are under "Source maps: what is checked" below. |
| Blocks get a `displayName` (`Card.Header`) in the build | A block's function is named `Header`; DevTools should say which component it belongs to. A small Vite plugin adds it after each `X.Y = Z` assignment, and to a component the bundler had to rename (`Button`, which shares its name with an import). |
| Every module starts with `"use client"` | The components use hooks, context and browser APIs, so a React Server Components framework must load them as client code. The directive is a banner on every file, since a bundler keeps it per module. Server rendering (`renderToString`) works and is tested. A Server Component can render `<Card title=… />`, but it cannot reach a block (`Card.Header`) through the client reference: compose blocks in a client file. |
| Declarations: relative imports carry `.js`, stylesheet imports are removed, and only files the two entries reach are published (`scripts/fix-types.mjs`) | Without extensions the types did not resolve under `node16` and `nodenext` (an error with `skipLibCheck: false`, silently `any` with it on). No declaration bundler was added: the fix is a 50-line script. |
| `process.env.NODE_ENV` stays in the output | The app's bundler replaces it; the development warnings (`[umbra-ui] …`) are gone from a production bundle under esbuild and Vite. |

`CheckMark` and `Hint`, the two pieces of a menu row that `Button` draws, moved from `Menu.tsx` to `src/internal/menuRow.tsx`, so a `Button` no longer imports `Menu`. A `Button` still holds React Aria's menu item, because it renders as one inside an overflow menu.

## Source maps: what is checked (2026-10-11)

| Check | Where |
|---|---|
| Every module has its map and ends with its `sourceMappingURL`; the two entries, which have none, hold only imports and exports | `npm run check:package` |
| Every source is embedded, lies under `src/`, is no story, sample or test, and equals the file in the repository | `npm run check:package` |
| The name of every top-level function and every `throw` of the built files resolves to its own line of the source (529 positions in 97 modules) | `npm run check:package`, with Node's `module.SourceMap` |
| The packed package stays under `PACKED_LIMIT_KB` = 1300 kB; the share that is maps is printed | `npm run release:check` |
| In the Vite development server a frame of a thrown error resolves, through the map the server names, to the built module as the `basic` example is, and to the `.tsx` line once the library is out of the pre-bundle | `tests/examples/source-maps.spec.ts` |

- **Found by the first check**: the block-name plugin added a line after each `X.Y = Z` and kept the module's map, so every line below the first block assignment of a module mapped too far down (in Avatar, KeyValue, Checkbox, Radio, Tabs, Menu, Modal). The name is now added on the same line; the built JavaScript did not change.
- **Sizes on 2026-10-11** (43 components): 669 kB packed, 2.5 MB unpacked; maps are 58% of the packed and 56% of the unpacked size. The limit is the size projected for 66 components (669 * 66 / 43 = 1027 kB) plus a quarter. Review it when Milestone 2 is built.
- **What a bundler shows** (`docs/getting-started.md`, "Debugging"): Vite 8.3 pre-bundles a dependency and its map stops at the built modules, so the `.tsx` lines need `optimizeDeps.exclude`; webpack 5.111 needs `source-map-loader`; Next.js 16.4 with Turbopack reads the maps by itself. The examples keep Vite's defaults.
- **Open (owner)**: the 60 maps of the CSS modules (`Card.module.js.map`) embed the whole stylesheet source and map nothing (`"mappings": ""`): 260 kB unpacked, 18% of the maps. Dropping them changes the build shape, so it was not done.
