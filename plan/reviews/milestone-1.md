# Milestone 1 review (2026-10-11)

Three independent reviews ran before the first release. This file records what each found and what was done. The component reviews are added by the orchestrator.

## Release readiness

Review 3 asked whether `0.1.0` can be released. Verdict: **ready with gaps**; one finding blocked the release. Numbers are the review's finding ids.

### Fixed

| # | Finding | Fix |
|---|---|---|
| 1 | `changeset version` failed: the root package was also the workspace root. Blocked the release. | No workspaces: the examples are plain folders (`plan/decisions/05-packaging.md`). `npm run version` then `npm run release`, in `docs/releasing.md`. `npm run release:check` rehearses the bump on a temporary copy and checks the tarball; CI runs it. The changesets are one grouped `0.1.0` summary, all `minor`. |
| 7 | A copied example did not build | Each example has a complete `package.json`, a self-contained `tsconfig.json` and a "Use it as a template" section. `npm run examples:standalone` copies each out, installs it against the packed tarball and builds it; CI runs it. |
| 8 | Links between guides were dead in Storybook; Storybook was not deployed | `docs/storybook/Guide.tsx` rewrites the links to Storybook pages; anchors work; a Welcome page. `.github/workflows/docs.yml` deploys to GitHub Pages when started by hand. |
| 9 | No browser support statement | README and getting-started: Chrome and Edge 117, Firefox 121, Safari 16.2, which features are required and which degrade; Chromium-only testing; React 19.0; Node 20; server rendering. |
| 10 | The docs said "not on npm yet" and installed from GitHub | `npm install umbra-ui` first; the GitHub install is a marked block that the release steps delete. `homepage`, `bugs`, `keywords` and `engines` in `package.json`. A "Status and roadmap" section and a CI badge. |
| 11 | 177 MB of baseline images | A policy in `plan/decisions/06-docs-and-testing.md` ("Baseline images"). The npm package holds `dist/` only (checked by `release:check`). History is untouched. |
| 12 | Stale repo map and commands in `AGENTS.md` | Every folder under `src/`, every spec file, every script and command. "Current state" is the orchestrator's. |
| 13 | Commit `37fc048` fails lint | Recorded under "Known issues" in `AGENTS.md`. |
| 14 | The built-in strings table was incomplete | Generated from the source into `docs/customisation-tables.md` ("Built-in strings"); the guide links to it. `Select` and `SearchField` are in the component lists. |
| 15 | Recipe 11 broke at `/` and did not say to install the router | Fixed. |
| 16 | `TokenName` claim; the `recent` icon; `import(".")` in the tables; the tables page overflowed sideways | The docs name `TokenOverrides`; the icon is listed; the generator prints type names only; wide tables scroll inside the page. |
| 18 | Two samples failed under `exactOptionalPropertyTypes` | `npm run docs:check` now compiles every sample with that flag. The two samples were reworded; the prop types are listed under "Open". |
| 20 | Place names in `plan/inventory/` | Replaced with placeholders ("Country A", "Region A", "Division A"). |
| 21 | No community files | `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), issue forms, a pull request template. No e-mail address anywhere. |
| 22 | Open-ended peer range, unchecked on React 19.0 | Checked on 19.0.0 with the packed tarball: a page, the command palette, a tooltip, no console output; `renderToString` on Node 20, 22 and 24. `>=19` stays. |

### Open

| # | Finding | For |
|---|---|---|
| 2, 3, 4, 5, 17 | Types under `node16` resolution, the CSS import in `index.d.ts`, mangled component names, bundle size per import, story helpers in the tarball | The build work |
| 6 | Three flaky browser tests | The component work |
| 18 | Optional props are not typed `\| undefined`, so `prop={condition ? value : undefined}` fails for an app with `exactOptionalPropertyTypes`. Seen on `PageProps.context` and `Command.href`; the pattern is library-wide. | `src/` |
| 19 | Tokens declared and never read: `space-0`, `size-min-window-width`, `size-min-window-height` (the minimum window is a TypeScript constant). Literal durations: Skeleton 1.6s, ProgressBar 1.4s, the spinner 0.9s. | Owner: remove, or read them |
| 11 | Whether to trim the captures per story (12 images now) | Done 2026-10-11: 5 images per story, tints for one story per file; 4,281 images and 197 MB became 1,979 and 92 MB (decision 06, "Baseline images") |
| 21 | Repository settings: protect `main`, enable private vulnerability reporting and "Reported content", enable Pages | Owner |
| 22 | Whether a registry install prints npm's allow-scripts warning for `prepare` (cannot be known before publishing; `docs/releasing.md` says what to do) | Owner, after the release |

### Not verified

- Firefox and Safari: the minimum versions come from the dates each CSS feature shipped, not from a test.
- `npm publish` itself. The rehearsal stops at `npm publish --dry-run` in a scratch clone.
- The Pages workflow has never run: Pages is not enabled.

## Components: data, meters, charts, table

Review 1 checked every component of `src/data/`, `src/meters/`, `src/charts/` and `src/table/` against its spec, its catalog row and the definition of done, and measured in a browser. Verdict: **complete with gaps**: one finding blocked the milestone, about twenty more were to fix before release.

### Fixed

| Finding | Fix, with the measured before and after |
|---|---|
| A group header's caret inside a `List` could not be reached by keyboard (blocked the milestone) | Header carets and actions are stops of the list: arrows and Tab reach them. Tested with keys only. |
| `DataTable` with 10,000 rows re-sorted on every scroll and dropped frames | Sorts during a 180-frame scroll: 179 → 0. Script per render while sorted: 24 ms → 4.5 ms. 300 ArrowDown presses: 2.4 s → 0.85 s. A guard test fails on a gross regression. |
| A Button-only app bundled with esbuild held `DataTable` and TanStack (566 KB) | One file per module. Button-only: 100 KB (34 KB gzip); `Skeleton` alone: 61 KB gzip → 0.5 KB. `npm run check:package` asserts ceilings per import. |
| Non-text contrast under 3:1: selected rows, the accent badge dot, the progress track, unlit meter ticks, the danger hatch | Stripe 2.2 → 5.0; dot 2.6 → 4.6; track outline 1.2 → 4.1; ticks 1.9 → 4.1; hatch 2.9 → 4.1, on all four tints. |
| Loading, empty and error were not uniform | The rule and its exemptions are in `plan/interaction.md`. `KeyValueList`, `Legend` and the charts use the shared helper; single-value components have `emptyLabel` and no error state. Focus is kept when a state is swapped. |
| Right-to-left: chart labels over the marks, stripes and progress direction not mirrored | Charts keep the plot and place labels the same in both directions (documented); the rest uses logical properties. Storybook has a direction switch, and each family has an RTL story and test. |
| Chart labels cut by 2 to 7px; an empty listbox when every series is hidden; legend dashes unlike the chart's; the tooltip cut in a short plot | Labels are measured; an "all series are hidden" state; the legend draws the chart's dash; the tooltip is in the top layer. |
| `DataTable`: Shift+Arrow anchor, disabled rows, missing stories; no sign that columns are hidden; Ctrl+A; a checkbox in single selection | Fixed; a "+N" mark with the full `aria-colcount`; Ctrl/Cmd+A; radios in `single`. |
| Sample data that mirrored the source (a league-style table, a two-side chart, texts from one screenshot) | Rewritten, and every story swept for the same. |
| Published types broke under `node16` / `nodenext`; a CSS import in `index.d.ts`; mangled component names and no source maps; story helpers in the tarball; no `"use client"` | Declarations carry extensions and are checked by a consumer typecheck in three resolution modes; names are kept, with source maps; only reachable declarations ship; every module starts with `"use client"`, and a server-render smoke test runs in CI. |

## Components: inputs, overlays, shell, layout, provider

Review 2 did the same for `src/inputs/`, `src/overlays/`, `src/shell/`, `src/layout/`, `src/provider/` and `src/basics/`, and re-checked every open item of the Milestone 0 review. Verdict: **not complete**: two findings blocked the milestone, about thirty more were to fix before release.

### Fixed

| Finding | Fix, with the measured before and after |
|---|---|
| The highest-priority card of a `Stack` flipped open and closed on every pixel of height near the threshold (blocked the milestone) | The floor uses the collapsed header in both states. A 1px sweep in both directions has one change point, and fresh loads agree. A layout-collapsed card now keeps its body mounted, so typed text and scroll survive. |
| The first press of a "more" menu showed nothing and dropped focus, because a font face loading reset the shrink level (blocked the milestone; the tests preloaded the fonts) | A restart waits while a menu, list or dialog opened from the row is showing. Cold loads: 6 of 6 failing → 0 of 6. Tests no longer preload fonts. |
| Shrink states stuck after two width changes in one frame; a path-dependent layout in the sub nav | 1–3 of 6 stuck → 0 of 6; rows restart together, in one order whichever way the width moves. |
| Nav menus opened with focus on the container; no top-level item marked when a sub-page is current | Opening by any key lands on the first row; the parent item is `aria-current="true"`, the row `aria-current="page"`. |
| Focus dropped to the page body in several paths | One rule, "focus is never lost" (`plan/interaction.md`), and a test helper that asserts it after each step. |
| Overlay layering: a tooltip inside a modal was inert; the command palette opened under a modal | Layer tokens (`--umbra-layer-*`); overlays opened in a modal render inside it; the palette is on top with focus in its input. |
| Right-to-left: portals without a direction; arrow keys and the tabs "more" not mirrored | One direction source on the provider; every portal carries it; our own key handling follows what is drawn. |
| `CheckboxGroup required` did nothing; `Select` did not expose invalid; `SearchField` failed axe with its list open | Fixed; the specs say which element carries what. |
| A danger row under highlight in a menu was 4.40:1; a tooltip could not be hovered (WCAG 1.4.13) | At least 4.5:1 on all four tints; the tooltip stays under the pointer and hides on Escape. |
| `ScrollArea` `axis="both"` tracked one axis; `onReachEnd` could not fire when content fits | Both axes; it fires once when content fits. |
| `minWidth` was a public prop without effect | `Columns` goes to tabs when its children cannot all have their `minWidth` (`plan/layout.md`). |
| Three flaky tests, hidden by CI retries | Each fixed at its cause (a collapse that ended a frame late, a timing measured outside the page, axe reading colours mid-fade). CI retries are now 0. |

Of the 20 open items of the Milestone 0 review, 17 were found fixed; the rest are in the status column of `plan/reviews/milestone-0.md`.

## Open after the three reviews

| Item | Detail | For |
|---|---|---|
| Optional props are not typed `\| undefined` | **Done 2026-10-11.** Every optional member under `src/` is declared `\| undefined` (1973 of them), the library compiles with `exactOptionalPropertyTypes`, and two checks keep it: `scripts/check-optional-props.mjs` in `npm run lint`, and the consumer type check of `npm run check:package`. Rule: `plan/decisions/07-customisation.md`. | Done |
| Some containers still set another component's token | `Badge`, `Avatar`, `EntityIcon` and the `DataTable` surface: their readers need private defaults first. | Milestone 2 |
| Two tooltips still render outside a modal | **Done 2026-10-11.** Cause: the two rendered React Aria's tooltip themselves and skipped `useOverlayLayer`, so they had no layer, no modal container and no top-layer mark. Both now render through one internal `Tip` (`src/internal/TruncatedText.tsx`), which takes them. Found on the way and fixed there: inside a modal every cut text showed its tip on any focus (the dialog was taken for the text's control); the tips were not hoverable; Escape on a tip also closed the modal; two tips could be open at once. Tests: `tests/visual/modal-overlays.spec.ts`. | Done |
| `Card` costs about 70 KB gzip | **Done 2026-10-11.** The header's menu and the collapsed card's popover are loaded on demand, and the overflow menu draws a button's row itself: what loads first for `Card` is 35.3 KB gzip under Vite (from 74.6), `Button` is 26.3 / 26.9 (from 34.8 / 37.5). esbuild cannot split what a barrel file also exports: without code splitting `Card` is one file of 73.6 KB, and with `splitting: true` every import loads about 65 KB first. Mechanism, numbers and that limit: decision 05, "Loaded on demand". Tests: `tests/visual/card-menu.spec.ts`, and `check:package` asserts the split. | Done; the esbuild limit is for the owner to weigh |
| Tokens declared and never read | `space-0`, `size-min-window-width`, `size-min-window-height`. | Milestone 2 |
| 12 baseline images per story, 177 MB in total | Policy in decision 06. | Done 2026-10-11: trimmed to 5 images per story and tints for one story per file; 1,979 images, 92 MB (decision 06, "Baseline images") |
| Browsers | Decided: Firefox and Safari are supported without automated tests (decision 06). Milestone 2 keeps the stated minimum versions true and writes a manual checklist. No real screen reader, zoom or touch testing yet. | Milestone 2 |
| Source maps | Decided: one map per module with the source embedded stays (decision 05). Milestone 2 adds the checks and a packed-size limit. | Milestone 2 |
| Repository settings | Protect `main`, enable private vulnerability reporting, Pages for the Storybook workflow is enabled and the site is published. | Owner (the first two) |
| The `0.1.0` release itself | Prepared and rehearsed (`docs/releasing.md`). Not now: the owner releases when the library is ready for production. | Owner |
