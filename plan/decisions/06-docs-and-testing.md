# 06 — Docs and testing: Storybook with visual tests

**Decided** 2026-10-10.

- Storybook is both the development workshop and the public documentation.
- Every component has stories for each variant and state, including loading, empty and error.
- **Visual regression tests** capture stories at several fixed window sizes and all three density levels. This is the main guard for the layout and shrink rules.
- Interaction and accessibility tests run against the same stories.
- Full-page example stories rebuild reference screens from `screenshots/` (in umbra-ui's own identity) to test components together.

## Getting-started material (added 2026-10-10)

Storybook alone does not teach installing, the layout system or customisation, so the plan adds:

- **README**: install, and a first full-window page in about 20 lines.
- **Five short guides**, written as Markdown in `docs/` and also shown in Storybook: getting started, layout, theming, customisation, recipes (basic to advanced).
- **Generated customisation tables**: per component, its props, part names, blocks and style variables, built from the source (see `07-customisation.md`).
- **Three example apps** in `examples/`: basic, dashboard, advanced. They double as starting templates.
- **Typed, commented props** on every component.

**Not included (owner's choice)**: shipping the Markdown docs inside the npm package with an `llms.txt` index. Coding agents read the guides and examples from the repository.

**Rejected**: a separate designed docs site (more to maintain; can be added later). Docs site only (loses the per-state workshop and its test integration).

**Confirmed 2026-10-10**: ESLint and Prettier; Changesets for the changelog and releases; GitHub Actions runs lint, typecheck, unit tests and build. Visual tests (Playwright against the built Storybook) run locally for now.

**Changed 2026-10-10**: the Playwright tests (captures, the no-page-scroll check, the automated accessibility check and the interaction tests) now run in GitHub Actions on every push, not only locally. Each story is captured at three sizes and three densities on the default tint, and once on each other tint (trimmed 2026-10-11: "Baseline images" below).

## Baseline images (added 2026-10-11)

The baselines in `tests/visual/__screenshots__/` are the largest thing in the repository (1,979 images and 92 MB right after the trim of 2026-10-11 below, with the 354 stories of Milestone 1; 3,040 images and 150 MB on 2026-10-12, with Milestone 2), and every changed image adds its full size to the history for good.

**What is captured per story, and why**

Every story is opened at 1920x1080, 1280x720 and 1024x600 at each of the three densities on the default tint (and at 900x560 at each density when tagged `narrow`), and each time the no-page-scroll check runs. An image is kept for part of these only:

| Capture | Images | Guards |
|---|---|---|
| Default density at 1920x1080, 1280x720 and 1024x600, on the default tint | 3 | The layout and shrink rules: the main reason the tests exist |
| Compact at 1280x720 | 1 | The look at the compact density |
| Spacious at 1024x600 | 1 | The tightest combination: the most content in the least room |
| Compact at 1920x1080 and 1024x600; spacious at 1920x1080 and 1280x720 | 0 | No image; the no-page-scroll check only |
| 1280x720 at the default density, on each of the three other tints: for one story per stories file only | 3 | Colour on every context. The automated accessibility check still runs on every story on every tint. |
| 900x560 at the default density, for a story tagged `narrow` only | 1 | Tab mode, below the minimum window. No image at the other two densities; the no-page-scroll check still runs there. |

A story costs 5 images (6 when `narrow`), about 45 kB each; the story that stands for its file on the tints costs 3 more.

**Which story is captured on the tints**: the stories tagged `tints`; in a file with none, its first story, which is the first entry with that `importPath` in Storybook's `index.json` (the order of the exports in the file). Tag a story `tints` when another one shows the component's colours better (all its tones or variants), or when a file holds several components (`Basics`). A file with a tagged story does not also get its first. Every full-page story (`src/stories/pages/`) is tagged.

**No stray image**: `stories.spec.ts` fails when the folder holds a file that no test produces, so a capture that is dropped takes its baseline with it.

**Rules for adding stories**

- Few, large stories. One story shows all the variants of a component side by side; a new variant is added to that story, not as a new one.
- A new story is for what cannot share a window: a state of the whole component (loading, empty, error), a full-window layout, or something an interaction test opens.
- A story made only for an interaction test still costs 5 images: reuse an existing story for the test where one fits.
- Tag a story `narrow` only when it has a tab mode.
- Look at every changed image before committing it, and commit baselines once, with the change that caused them: no later "update baselines" commit that churns the same images again.
- History is never rewritten to shrink the repository.

**Installing does not need them.** The npm package holds `dist/` only (`files` in `package.json`; `npm run release:check` fails if anything else gets in). `npm install github:asafmor/umbra-ui` downloads the repository with the images; it is for trying an unreleased commit only (`docs/releasing.md`).

**Decided 2026-10-11 (the trim)**: under the owner's delegation (`plan/reviews/milestone-2.md`, decision 1), fewer images are kept per story. No kept image changed.

| | Before | After |
|---|---|---|
| Images | 4,281 | 1,979 |
| Size | 197 MB | 92 MB |
| Per story | 12 (15 when `narrow`) | 5 (6 when `narrow`), and 3 on the tints for one story per file (66 stories of 354) |
| Tests in `npm run test:visual` | 6,334 | 5,471 |

What is no longer covered:

- **1,416 images**: compact at 1920x1080 and 1024x600, and spacious at 1920x1080 and 1280x720, for all 354 stories. A change of look that shows in one of these four combinations only, without making the page scroll, is not caught.
- **864 images**: the three other tints for 288 stories. A change of colour that shows on a tint only, in a story that is not the one captured for its file, is not caught by an image; the accessibility check still reads its contrast. The no-page-scroll check, which ran with each of these captures, no longer runs on the other tints for these stories (a tint changes colours, not sizes).
- **22 images**: 900x560 at compact and spacious for the 11 `narrow` stories. The no-page-scroll check still runs there.

The history keeps the removed images: the repository does not shrink, it stops growing as fast.

## Releases (added 2026-10-11)

- Changesets, on a single package: `npm run version` (bump and changelog), review, commit, `npm run release` (checks, build, package check, publish). Steps: `docs/releasing.md`.
- `npm run release:check` rehearses the version bump on a temporary copy and checks the tarball; CI runs it, with `npm run examples:standalone` (each example, copied out and installed against the packed tarball).
- Storybook is published to GitHub Pages by `.github/workflows/docs.yml`, started by hand; the site is at <https://asafmor.github.io/umbra-ui/>.
- The docs samples compile under `exactOptionalPropertyTypes`.
- Browsers: the automated tests run in Chromium only, by the owner's decision. Firefox and Safari are supported from the minimum versions in the README without automated tests; the support rests on the CSS features used and on a manual checklist run before a release ("Browsers: what keeps the minimums true" below).

## Browsers: what keeps the minimums true (added 2026-10-11)

Minimums: Chrome and Edge 117, Firefox 125, Safari 17.0. No automated test runs in Firefox or Safari.

**Minimums raised (2026-10-11, owner's delegation)**: Firefox 121 becomes 125 and Safari 16.2 becomes 17.0; Chrome and Edge stay at 117. The check found three things that were not true below them: the `lh` unit (Safari 16.4) put six alignments a few pixels off; a `fill` chart in a parent without a height had no height in Safari before 17 (`contain-intrinsic-block-size`); and the chart tooltip was not in the top layer (the Popover API) in Firefox before 125 and Safari before 17. Honest minimums beat degraded ones nobody tested. The three notes left the script, and so did the `@supports not (contain-intrinsic-block-size: 1px)` fallback of the chart, which no supported browser reads. The rest of this section is as first written, except where it says otherwise.

| What | Where |
|---|---|
| A table of CSS and JavaScript features, the first version of each browser that ships each (MDN browser-compat-data 8.1.5), and a pattern that finds it. A feature newer than a minimum fails unless its row has a note saying what happens without it; a note that is no longer needed fails too. For CSS the table is not the only guard (review 3 of Milestone 2, F8): every at-rule, pseudo-class, pseudo-element, function, property, unit and query feature the stylesheets use must be on the list `known` in the script, each name looked up; a name that is not on it fails until a person adds it. JavaScript has the table only. | `scripts/check-browsers.mjs`, run by `npm run lint` on `src/` and by `npm run check:package` on `dist/styles.css` too |
| The same versions in the README, the getting-started guide and `build.cssTarget` | The same script |
| The built stylesheet holds no selector the minifier rewrote (`:lang()`), and a `-webkit-` twin beside `mask`, `backdrop-filter` and `user-select` | The same script, with `--dist` |
| A person looks at the pages, overlays, the table, scrollbars, focus rings, right to left, reduced motion, fonts and charts in Firefox and Safari before a release | `docs/browser-checks.md` |

**`build.cssTarget` is the minimums** (it was Vite's default, "baseline widely available", which moves with Vite). Lightning CSS, which minifies the stylesheet, adds prefixes and merges rules for those versions.

**Found when the check was written, and fixed**

| Finding | Fix |
|---|---|
| `:dir(rtl)` (Chrome 120, Safari 16.4) in 11 rules of 7 stylesheets. The minifier rewrote each to `:lang(ar, he, …)`, in the package and in the Storybook the tests run on: a page with `dir="rtl"` and no right-to-left `lang` lost those rules in every browser. The tests passed because the stories set a Hebrew locale. | The rules are written `:is([dir='rtl'], [dir='rtl'] *)`. |
| The direction of a locale was `ltr` for every locale in Firefox before 153, which has no `Intl.Locale` text info. | The script of the locale decides there (unit-tested). |
| `justify-content: safe center` (Safari 17.6) left an `EmptyState` at the top of its slot. | A `center` fallback inside `@supports not`. A plain fallback line above it does not survive the minifier. |
| `contain-intrinsic-block-size` (Safari 17) left a chart with `height="content"` without a height. | A `min-height` inside `@supports not`. Removed when the minimum Safari became 17.0. |

**Newer than a minimum, kept, each with its note in the script** (after the raise): `safe` alignment (Safari 17.6), `transition-behavior` (Firefox 129, Safari 17.4), `scrollbar-width` and `scrollbar-color` (Chrome 121; Safari 18.2 and 26.2), the unprefixed `mask` (Chrome 120), `backdrop-filter` (Safari 18), `user-select` and `line-clamp`, `Intl.Locale` text info (Chrome 130, Firefox 153). The `lh` unit, `contain-intrinsic-block-size` and the Popover API are now within the minimums.

**Found when the minimums were re-verified against browser-compat-data 8.1.5 (2026-10-11)**, by looking up every property, at-rule, selector, function and unit of `dist/styles.css` and every member name of `dist/*.js`, not only the rows of the table:

| Finding | Done |
|---|---|
| `rx` as a CSS property (Safari 17.4) had no row: the bars of a `BarChart` had square corners in Safari 17.0 to 17.3. | The bar carries `rx={2}` as an attribute, which the stylesheet overrides where it can; a row and a note. |
| The Navigation API in `HistoryButtons` (Firefox 147, Safari 26.2) was listed as not used: the pattern missed `window.navigation`. It already had a fallback (both buttons stay enabled). | The pattern finds it; a note. |
| Firefox 153 and 154 answer `@supports selector(::-webkit-scrollbar)` with true and draw none of the rules (reverted in 155): the thin scrollbars of `ScrollArea` and `Menu` are the browser's own there. | Noted only. Open (owner) below. |

**Open (owner)**

- Closed by the raise: Safari 16.2 and 16.3 lack the `lh` unit (six alignments a few pixels off). `:dir()` still needs Chrome 120.
- Closed by the raise: a `fill` chart in a parent without a height has no height in Safari before 17, and the chart tooltip is not in the top layer in Firefox before 125 and Safari before 17.
- Firefox 153 and 154 show their own scrollbars (above). A condition that only Firefox passes, in place of `not selector(::-webkit-scrollbar)`, would end it; it changes two stylesheets and wants a look in Firefox.
- No real screen reader, zoom or touch testing yet.
