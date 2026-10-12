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

`CheckMark` and `Hint`, the two pieces of a menu row, are in `src/internal/menuRow.tsx`.

## Loaded on demand (2026-10-11)

The Milestone 1 review measured `Card` at about 70 KB gzip: its header imported the overflow menu, and a card that a stack collapses imported `Popover`. Decided: both are loaded with `import()`, the first time they are needed.

| Import | Before (esbuild / Vite, KB gzip) | After | What changed |
|---|---|---|---|
| `Card`, what loads first | 69.2 / 74.6 | 35.3 (Vite) | The menu and the popover are chunks of their own |
| `Card`, everything in one file | 69.2 / 74.6 | 73.6 (esbuild without code splitting) | Nothing is split, and the loader adds a little |
| `Button` | 34.8 / 37.5 | 26.3 / 26.9 | The overflow menu draws the row; the button no longer holds React Aria's menu item |
| `Skeleton` | 0.4 / 0.5 | 0.4 / 0.5 | |

What the 69 KB was (minified, before gzip, 211 KB in all): React Aria's selection, collections, menu and focus scope with React Stately's selection and collections, 69 KB, for the menu (the focus scope for the popover too); React Aria's overlays and `Popover`, 21 KB, of which the tooltip keeps 10; its interactions and utilities, 47 KB, of which `Button` and `Tooltip` keep 32; the library's `Menu` and `Popover`, 12 KB; `Card` itself, 8 KB. What loads first now is 88 KB minified: interactions 19, utilities 13, the tooltip's positioning 10, `Card` 8, and small pieces.

| Mechanism | Detail |
|---|---|
| The overflow menu | `src/internal/ActionsOverflow.tsx` draws the "more" button at once and holds the open state; it is the same element before and after the menu's code arrives, so it keeps the focus and its place in the row that `useShrinkLevel` measures. The code (`OverflowMenu` in `src/overlays/Menu.tsx`) is asked for when the button appears, not when it is pressed. A press that comes first is kept as the open state (`aria-expanded` is already true, so the row does not restart under it), and the menu opens when the code arrives, on the first row for a keyboard press and on the menu for a pointer. `Card`, `SectionTitle`, `PageHeader`, `TopBar` and `GroupHeader` all use it. |
| The popover of a collapsed card | `Card` asks for `Popover` when a stack first collapses it. The open state was already the card's own, so a press that comes first is kept the same way. |
| A button as a menu row | The menu supplies the row through `OverflowMenuContext` (a function that draws it from the button's props). `Button` no longer imports React Aria's menu item. |
| The row restart (`useShrinkLevel`) | A font that arrives while the menu is open restarts the row once the menu has closed, which draws the "more" button again. Two gaps were found by the new tests and closed: a restart first asked for while the focus was on nothing (the menu gone, the focus not yet given back) left the focus on `<body>`, so the restart now waits whenever the focus has just left a menu; and it now runs the moment the focus is back, not a frame later, so a key pressed in that frame is not lost. |
| A failed request | The next header that overflows, or the next press, asks again. |
| Server rendering | Nothing is requested on the server (the requests are in effects), and the markup is the same with and without the code, so hydration matches. |
| The build | One file per module still holds: `dist/internal/ActionsOverflow.js` has `import("../overlays/Menu.js")`, and every file starts with `"use client"`. |

**By bundler.** Rollup, and so Vite, makes a chunk of what is loaded on demand: this is what `check:package` measures and asserts (the menu and the popover are not in what loads first, and are in a chunk that is). **esbuild does not**, and this is a limit of esbuild, not of the package: its code splitting decides what two entries share file by file, before tree shaking, so a module that a barrel file (`dist/index.js`, and `react-aria-components` itself) also re-exports lands in a chunk that loads first. Measured:

| esbuild | Before | After |
|---|---|---|
| Without code splitting (its default, and what `check:package` runs) | `Card` 69.2, `Skeleton` 0.4 | `Card` 73.6, `Skeleton` 0.4: one file, tree-shaken as before |
| With `splitting: true` | `Card` 69.3, `Skeleton` 0.4 | Any import, `Skeleton` alone included, loads about 65 KB first: the menu and the popover sit in a chunk every entry imports |

An app that uses a card, a menu or a popover loads that code anyway, so the second line costs a real app little; an esbuild app that splits and wants only small components would need entries of its own (`umbra-ui/card`, …), which is a change to the public surface and was not made. Webpack was not measured.

Not done: `Tooltip` is what keeps `Button` at 26 KB (React Aria's overlay positioning, 10 KB minified, and part of its utilities). Loading it on demand would cut `Button` further, but a tooltip that appears a moment late on first hover is a change to the experience, so it is left for a decision.

## Source maps: what is checked (2026-10-11)

| Check | Where |
|---|---|
| Every module has its map and ends with its `sourceMappingURL`; the two entries, which have none, hold only imports and exports | `npm run check:package` |
| Every source is embedded, lies under `src/`, is no story, sample or test, and equals the file in the repository | `npm run check:package` |
| The name of every top-level function and every `throw` of the built files resolves to its own line of the source (529 positions in 97 modules) | `npm run check:package`, with Node's `module.SourceMap` |
| The packed package stays under `PACKED_LIMIT_KB` (the measured size plus a quarter: 1320 kB on 2026-10-12); the share that is maps is printed | `npm run release:check` |
| In the Vite development server a frame of a thrown error resolves, through the map the server names, to the built module as the `basic` example is, and to the `.tsx` line once the library is out of the pre-bundle | `tests/examples/source-maps.spec.ts` |

- **Found by the first check**: the block-name plugin added a line after each `X.Y = Z` and kept the module's map, so every line below the first block assignment of a module mapped too far down (in Avatar, KeyValue, Checkbox, Radio, Tabs, Menu, Modal). The name is now added on the same line; the built JavaScript did not change.
- **Sizes on 2026-10-11** (43 components): 669 kB packed, 2.5 MB unpacked; maps are 58% of the packed and 56% of the unpacked size. The limit is the size projected for 66 components (669 * 66 / 43 = 1027 kB) plus a quarter. Review it when Milestone 2 is built.
- **Sizes on 2026-10-12** (Milestone 2 built, with the column controls of the table: 90 components, 592 files): 1054 kB packed, 4.0 MB unpacked; maps are 59% and 57%. The limit is that plus a quarter, 1320 kB (review 3, F18; it was 1300, projected from Milestone 1).
- **Tier 2 single imports have ceilings too** (2026-10-12, KB gzip under Vite, each a quarter above): `DateChip` 6.2, `StarRating` 23.3, `MeterList` 29.3, `Sparkline` 26.2, `Spotlight` 41.3, `Planner` 109.2. `Planner` is not split: its toolbar draws a month `Select` at first paint (React Aria's list box and popover), so loading it on demand would make the control pop in after the first paint; the "+N" popover alone is a few KB on top of what the `Select` already brings. Left as it is.
- **What a bundler shows** (`docs/getting-started.md`, "Debugging"): Vite 8.3 pre-bundles a dependency and its map stops at the built modules, so the `.tsx` lines need `optimizeDeps.exclude`; webpack 5.111 needs `source-map-loader`; Next.js 16.4 with Turbopack reads the maps by itself. The examples keep Vite's defaults.
- **Open (owner)**: the 60 maps of the CSS modules (`Card.module.js.map`) embed the whole stylesheet source and map nothing (`"mappings": ""`): 260 kB unpacked, 18% of the maps. Dropping them changes the build shape, so it was not done.
