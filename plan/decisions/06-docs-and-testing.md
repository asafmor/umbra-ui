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

The baselines in `tests/visual/__screenshots__/` are the largest thing in the repository (1,979 images, 92 MB, after the trim of 2026-10-11 below), and every changed image adds its full size to the history for good.

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
- Browsers: the automated tests run in Chromium only, by the owner's decision. Firefox and Safari are supported from the minimum versions in the README without automated tests; the support rests on the CSS features used and on a manual checklist run before a release (written in Milestone 2).
