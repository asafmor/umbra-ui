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

**Changed 2026-10-10**: the Playwright tests (captures, the no-page-scroll check, the automated accessibility check and the interaction tests) now run in GitHub Actions on every push, not only locally. Each story is captured at three sizes and three densities on the default tint, and once on each other tint.

## Baseline images (added 2026-10-11)

The baselines in `tests/visual/__screenshots__/` are the largest thing in the repository (3,945 images, 177 MB, on 2026-10-11), and every changed image adds its full size to the history for good.

**What is captured per story, and why**

| Capture | Images | Guards |
|---|---|---|
| 1920x1080, 1280x720 and 1024x600, at each of the three densities, on the default tint | 9 | The layout and shrink rules: the main reason the tests exist |
| 1280x720 at the default density, on each of the three other tints | 3 | Colour and contrast on every context |
| 900x560 at each density, for a story tagged `narrow` only | 3 | Tab mode, below the minimum window |

A story costs 12 images (15 when `narrow`), about 45 kB each.

**Rules for adding stories**

- Few, large stories. One story shows all the variants of a component side by side; a new variant is added to that story, not as a new one.
- A new story is for what cannot share a window: a state of the whole component (loading, empty, error), a full-window layout, or something an interaction test opens.
- A story made only for an interaction test still costs 12 images: reuse an existing story for the test where one fits.
- Tag a story `narrow` only when it has a tab mode.
- Look at every changed image before committing it, and commit baselines once, with the change that caused them: no later "update baselines" commit that churns the same images again.
- History is never rewritten to shrink the repository.

**Installing does not need them.** The npm package holds `dist/` only (`files` in `package.json`; `npm run release:check` fails if anything else gets in). `npm install github:asafmor/umbra-ui` downloads the repository with the images; it is for trying an unreleased commit only (`docs/releasing.md`).

**Open (owner)**: whether to trim the captures once the image count is a problem, for example the three densities at one size only (7 images per story instead of 12).

## Releases (added 2026-10-11)

- Changesets, on a single package: `npm run version` (bump and changelog), review, commit, `npm run release` (checks, build, package check, publish). Steps: `docs/releasing.md`.
- `npm run release:check` rehearses the version bump on a temporary copy and checks the tarball; CI runs it, with `npm run examples:standalone` (each example, copied out and installed against the packed tarball).
- Storybook is published to GitHub Pages by `.github/workflows/docs.yml`, started by hand; the site is at <https://asafmor.github.io/umbra-ui/>.
- The docs samples compile under `exactOptionalPropertyTypes`.
- Browsers: the automated tests run in Chromium only, by the owner's decision. Firefox and Safari are supported from the minimum versions in the README without automated tests; the support rests on the CSS features used and on a manual checklist run before a release (written in Milestone 2).
