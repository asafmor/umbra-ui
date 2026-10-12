# umbra-ui — agent guide

Read this first. It tells you what the project is, where things are, what state it is in, and how to take on a task.

## What this is

`umbra-ui` is an open-source React component library for full-window, data-dense applications (dashboards, consoles, back-office tools). It is opinionated: its own dark look, and a layout system where components size themselves to fill the window.

The design is **inspired by** 40 screenshots of a game UI in `screenshots/`. It is not a copy: no logos, names or assets from the source, and no domain-specific (football) components.

## Current state

**Phase: Milestone 2 (tier 2): the 23 components and `MeterList` are built and integrated, the full-page stories, guides and examples are done, and three independent reviews are in (`plan/reviews/milestone-2.md`). The fix pass of the reviews is in progress: the status column of each review says what is fixed and what is open. Nothing is published: the first release, `0.1.0`, is rehearsed (`docs/releasing.md`) and happens only when the owner decides the library is ready for production.** Update this section whenever the phase or the next step changes.

| Step | Status | Artifact |
|---|---|---|
| 1. Screenshot inventory | done | `plan/inventory/` |
| 2. Component catalog | approved | `plan/components.md` |
| 3. Tokens | done, contrast-checked | `plan/tokens.json` |
| 4. Layout model | decided; open details listed in the file | `plan/layout.md` |
| 5. Interaction and motion | decided; open details listed in the file | `plan/interaction.md` |
| 6. Tech decisions | decided | `plan/decisions/` |
| 7. Roadmap | approved | `plan/roadmap.md` |
| 8. Tier 0 specs | approved (14 files) | `plan/specs/` |
| 9. Reference screen | done | `plan/reference/` |

### Milestone 0 progress

| Step | Status |
|---|---|
| 1. Repo setup: package, tokens, Storybook, visual tests, lint, changelog, CI | done |
| 2. UmbraProvider and UmbraScope | done |
| 3. Layout: AppShell, Page, Columns, Stack, Slot, Card, CardHeader, SectionTitle, ScrollArea | done |
| 4. Shell: TopBar, PrimaryNav, SubNav | done |
| 5. Basics: Button, IconButton, Skeleton | done (built before the cards, which use them) |
| 6. Docs: README, guides, `basic` example, customisation table generator | done |

### Milestone 1 progress

The owner approved the plan and delegated the open questions (`plan/reviews/milestone-0.md`, "Owner's decisions"); each decision made on the way is under "Resolved" in the component's spec.

| Batch | Status |
|---|---|
| Review items due before 1a | done |
| 1a. Data basics (19 components, in `src/data/`) | done |
| 1b. Inputs (`src/inputs/`) | done |
| 1c. Overlays (`src/overlays/`): Popover, Tooltip, Menu, Modal, ActionBar, CommandPalette; `VerticalNav` in `src/shell/` | done |
| 1d. Table (`src/table/`) | done |
| 1e. Meters (`src/meters/`) and charts (`src/charts/`) | done |
| 1f. Shell extras: PageHeader, Accordion, ShortcutBar, HistoryButtons, PrimaryAction | done |
| Integration pass: icon map, more menus, tooltips, card collapse animation, naming rules (`plan/decisions/07-customisation.md`) | done |
| Full-page stories (`src/stories/pages/`), guides, `dashboard` and `advanced` examples | done |
| Fix pass on what the pages and docs work found | done |
| Three independent reviews (components twice, release readiness) and their fixes | done; what is still open is in `plan/reviews/milestone-1.md` |

### Milestone 2 progress

| Step | Status |
|---|---|
| Open items of Milestone 1 (token rule, thresholds, baseline trim, tables) | done |
| Six groups, 23 components: time, data, inputs, meters and charts, shell and layout, overlays | done |
| Integration pass: names, shared internals, compositions across groups, the groups' weak spots | done; what stays open is in `plan/reviews/milestone-2.md` |
| Full-page stories (planning, analysis), guides (recipes 14 to 21), the `dashboard` and `advanced` examples | done |
| Owner's feedback from Storybook (O-1 to O-10) | partly fixed; the rest is open in `plan/reviews/milestone-2.md` |
| Three independent reviews: time, data and inputs; meters, charts, shell, layout and overlays; the package, the checks, the docs and the examples | done |
| Fix pass of the reviews, one branch per group, and `MeterList` (O-7) | in progress: the status columns of `plan/reviews/milestone-2.md` |
| Storybook on GitHub Pages with the Milestone 2 state (review 3, F3) | to do (orchestrator) |

**Next step**: finish the fix pass: every row of the three reviews and of the owner's feedback in `plan/reviews/milestone-2.md` is `fixed` or `open` with its reason; then the full suite on `main`, and the Storybook site published again. What the integration pass left open is in the same file ("Integration pass", "Open"). No release is planned; never publish without the owner's explicit go-ahead. A batch is built from `plan/prompts/component-brief.md`, one agent per group in its own git worktree with its own `UMBRA_TEST_PORT`, merged into `main` after the full suite passes.

### Known issues

- Open findings of the reviews: `plan/reviews/milestone-1.md` ("Open"), and the status column of `plan/reviews/milestone-0.md`.
- Several merged fix branches of Milestone 1 do not pass every check at each intermediate commit (grouped commits, baselines regenerated at the tip). Each merge commit on `main` does.
- Automated tests run on Chromium only, by decision: Firefox and Safari are supported from the minimum versions in the README, without automated tests (`plan/decisions/06-docs-and-testing.md`).
- Commit `88f6b37` fails lint: the `lint` script arrived one commit before its config.
- Commit `37fc048` ("WIP: …") fails lint (Prettier, three files). Two more WIP commits pass. They were already pushed, so they stay.
- Two CI runs on `main` are red, `50b4c55` and `853fe67`: one screenshot each, the same one (a row inside an overlay that had not settled). Fixed by `16b7e04`; green since. They were already pushed, so they stay.
- Commit `973f274` breaks "tests pass at every commit": it adds two navigation tests whose story arrives in the next commit. It was already pushed, so it stays.

## Commands

| Command | Does |
|---|---|
| `npm install` | Installs, and generates the token CSS |
| `npm run tokens` | Regenerates `src/styles/tokens.css` and `tokens.generated.ts` from `plan/tokens.json`. Both are git-ignored; never edit them. |
| `npm run build` | Builds `dist/` (JS, types, one `styles.css`) |
| `npm run typecheck` / `npm run lint` / `npm run format` | TypeScript (with `exactOptionalPropertyTypes`), ESLint + Prettier check, Prettier write. Lint fails on any ESLint warning (`--max-warnings 0`), not only on errors. Lint also fails when an optional member under `src/` lacks `\| undefined` (`scripts/check-optional-props.mjs`; `--fix` rewrites them): a syntactic pass over every declaration, a pass by type over everything `src/index.ts` and `src/charts/index.ts` export (it sees `Partial<…>`, mapped types, tuples and classes, and proves it on a planted file each run), and a pass that fails when a callback prop is handed to an event handler that would call it with more arguments than it declares (`onClick={onPress}`). Lint also runs `scripts/check-tokens.mjs` (no component declares a public `--umbra-*` property, every token of `plan/tokens.json` is read, no stylesheet has a literal duration) and `scripts/check-browsers.mjs` (below). `docs:check` (below) is part of it. |
| `npm test` | Unit tests (Vitest), for pure logic only |
| `npm run storybook` | Storybook on port 6006 |
| `npm run test:visual` | Builds Storybook, then runs every Playwright test: every story opened at 1920x1080, 1280x720 and 1024x600 at all three densities, failing on any document overflow (stories tagged `narrow` also at 900x560); images kept for the default density at each size, compact at 1280x720 and spacious at 1024x600 (`narrow`: 900x560 at the default density), and on each other context tint for one story per stories file (the one tagged `tints`, else the first); a check that no baseline exists without a test; the automated accessibility check of every story on every tint; and the interaction tests. CI runs it on every push. `UMBRA_TEST_PORT` changes the port (default 6007), so two checkouts can run at once. |
| `npm run test:visual:update` | Same, and rewrites the baselines in `tests/visual/__screenshots__/`. Look at the changed images before committing. |
| `npm run docs:tables` | Regenerates `docs/customisation-tables.md` from the source. `npm run lint` fails when it is out of date, so run it after changing props, parts, blocks or CSS variables. |
| `npm run docs:check` | Typechecks every `tsx` sample in `README.md` and `docs/*.md` against the source (`scripts/check-docs.mjs`). `npm run lint` runs it. A sample may be a fragment: names it does not define come from the library or from `scripts/check-docs-prelude.ts`. It also fails when the README's row of `umbra-ui/charts` or its component overview does not match the exports. |
| `npm run build-storybook` | Builds the static Storybook into `storybook-static/` (the browser tests and the Pages workflow use it). |
| `npm run examples` | Installs and builds the three example apps in place, each in its own folder against the built package (run `npm run build` first; `scripts/examples.mjs`). One only: `npm run examples -- basic`. Then `npm run dev --prefix examples/basic`. Run it again after rebuilding the library: an example holds a copy of the package, not a link. |
| `npm run examples:standalone` | Copies each example out of the repository, points `umbra-ui` at the packed tarball, and runs `npm install && npm run build` there: proof that each works as a template (`scripts/check-examples-standalone.mjs`). CI runs it. |
| `npm run test:examples` | Builds the package and the three examples, serves each with `vite preview` and drives them with Playwright (`playwright.examples.config.ts`, ports from `UMBRA_EXAMPLES_PORT`, default 6017). Five ports; no retries, and it stops when a port is taken instead of testing whatever answers there. Also runs `basic` in the Vite development server to prove the source maps arrive (`source-maps.spec.ts`). |
| `npm run changeset` | Adds a changelog entry; needed for any change users will notice |
| `npm run check:package` | Checks the packed tarball (`scripts/check-treeshake.mjs`; run `npm run build` first): the size of single imports against ceilings (`Skeleton`, `Tag`, `Button`, `Card` and what a `Card` loads first, the shell, `DataTable`, a chart; tier 2: `DateChip`, `StarRating`, `MeterList`, `Sparkline`, `Spotlight`, `Planner`), that the overflow menu is loaded on demand, the types under three module-resolution modes with `exactOptionalPropertyTypes` (a file generated from the exports gives every optional prop of every component and block an explicit `undefined`), server rendering, the source maps (every module mapped, sources embedded and under `src/`, function and throw positions resolve to their source line), and the browser check on the built stylesheet. CI runs it. |
| `npm run check:browsers` | Fails when the CSS or the code uses a feature newer than Chrome 117, Firefox 125 or Safari 17.0 without a fallback and a note (`scripts/check-browsers.mjs`). For CSS it is an allowlist: an at-rule, pseudo-class, pseudo-element, function, property, unit or query feature that is not in `known` fails until a person looks it up and adds it. For JavaScript it is a table of newer features. `--dist` includes `dist/styles.css`; `--list` prints the noted features; `--known` prints the CSS names in use. |
| `npm run release:check` | Rehearses `changeset version` on a temporary copy and checks what `npm pack` would hold (`scripts/check-release.mjs`). Changes and publishes nothing. CI runs it. Run `npm run build` first. Prints the share of the package that is source maps and fails above `PACKED_LIMIT_KB` packed (the measured size plus a quarter; the number and its date are in the script). `-- --changelog` prints the changelog the rehearsal wrote. |
| `npm run version` | Owner's release step 1: turns the pending changesets into the version and `CHANGELOG.md`, and updates the lock file. |
| `npm run release` | Owner only. Lint, typecheck, unit tests, build, the final package check, then `changeset publish`. Steps: `docs/releasing.md`. |

- Run lint, typecheck, unit and visual tests before every commit; all must pass.
- Do not run `npm run release` or `npm publish`, create a tag or a GitHub release, or change repository settings: only the owner releases (`docs/releasing.md`). `npm publish --dry-run` in a scratch clone is fine.
- The examples are plain folders, not npm workspaces (`plan/decisions/05-packaging.md`): the root `npm install` does not install them.
- Component conventions: CSS Modules; a token is read as `var(--umbra-<component>-<name>, <fallback>)` and never declared on the component, so apps can set it from any ancestor; roots carry `data-umbra="<name>"`, parts `data-part="<name>"`, state as `data-` attributes; `parts` props go through `renderPart`; React Aria types stay out of public props. A container's default for what is inside it is a private property, read as `var(--umbra-<token>, var(--<token>, <default>))`; no stylesheet declares a public `--umbra-*` property, global tokens included. A right-to-left rule is `.x:is([dir='rtl'], [dir='rtl'] *)`, never `:dir(rtl)`. Every optional member is typed `prop?: T | undefined`. Values coloured by level take the shared `thresholds` (`src/utils/thresholds.ts`). Every root passes on `id`, `data-*` and `aria-*` through `passThrough` (`src/utils/passThrough.ts`), spread first. A control that cannot be a row of a menu carries a static `staysInRow = true`, so it stays in a row of actions that overflows (`plan/decisions/07-customisation.md`).
- Stories get the whole window (`layout: 'fullscreen'`). For a small component, set `parameters: { frame: 'padded' }`.

## Repo map

| Path | Content |
|---|---|
| `screenshots/` | The 40 source images. Read-only reference. **Local only: never commit or push them** (third-party copyrighted images; keep the folder in `.gitignore`). |
| `plan/inventory/` | Per-screenshot analysis: layout, components, scroll evidence. Club, competition and person names are replaced with placeholders ("Home Club", "League A", "Person B"), so quoted labels do not match the images word for word. |
| `plan/components.md` | The catalog: every component, what it absorbs, its tier, and the product decisions. |
| `plan/tokens.json` | The design tokens: colour, type, spacing, radius, density, motion. |
| `plan/inventory/source-colours.md` | Colours sampled from the screenshots (reference only), and the sampling method. |
| `plan/specs/` | One spec per component. `Card.md` is the template; the 14 tier 0 specs are approved, and tier 1 specs are written under the owner's delegation. |
| `plan/layout.md` | The layout model: primitives, sizing rules, and what happens as space shrinks. |
| `plan/interaction.md` | States, motion, loading, live updates, keyboard and accessibility rules. |
| `plan/decisions/` | One short record per tech decision: styling, behaviour base, charts, table engine, packaging, docs and testing, customisation. |
| `plan/roadmap.md` | Pre-code tasks, milestones, build order, and the per-component definition of done. |
| `plan/reference/` | `index.html`: the static reference screen, the visual ground truth for the look (open it in a browser; `?density=compact&context=teal` switches settings). `shot-*.png`: renders at three sizes. |
| `plan/reviews/` | Review reports: what independent reviews found, what was fixed, and what is open. `milestone-0.md`, `milestone-1.md` and `milestone-2.md` (the integration pass, three reviews, the owner's feedback from Storybook). |
| `plan/prompts/` | `component-brief.md`: the rules for building a batch of components (read it before adding one). Ready-made prompts for starting a fresh agent session: `milestone-0.md` (used), `verify-milestone-0.md` (independent review of Milestone 0), `milestone-1.md` (plan and build Milestone 1, used), `milestone-2.md` (plan and build Milestone 2). |
| `src/` | Library source, one folder per group. `index.ts` is the `umbra-ui` entry. Each component is a `.tsx` with its `.module.css` and `.stories.tsx`; `samples.*` and `story*.tsx` files are story helpers. |
| `src/styles/` | `index.css` (base CSS) and the generated `tokens.css` and `tokens.generated.ts`. |
| `src/provider/` | `UmbraProvider` and `UmbraScope`, the icon map (`icons.tsx`), the shortcut registry (`shortcuts.ts`), `contrast.ts`. |
| `src/layout/` | Page, Columns, Stack, Slot, Card, SectionTitle, ScrollArea, Accordion. `useSlot.tsx` and `collapse.ts` hold the layout rules. Tier 2: WidgetBoard, HorizontalScroller. |
| `src/shell/` | AppShell, TopBar, PrimaryNav, SubNav, VerticalNav, PageHeader, PrimaryAction, HistoryButtons, ShortcutBar. `nav.tsx` is shared by the navs. Tier 2: ContextBlock, EntitySwitcher. |
| `src/basics/` | Button, IconButton, Skeleton. |
| `src/time/` | DateChip, ScheduleSlot, WeekStrip, Planner. `dates.ts` (ISO dates, unit-tested), `grid.ts` (the keyboard grid of days), `cells.tsx` (the rows and cells both grids are built from). |
| `src/data/` | Tag, Badge, ValuePill, Avatar, EntityIcon, KeyValue, StatValue, SummaryTile, TrendArrow, StatusIndicator, GroupHeader, List, ListItem, Banner, Legend, EmptyState, Link. Shared: `tone.ts`, `valueLevel.ts`, `entity.ts`. Tier 2: SequenceDots, MediaCard, Comparison. |
| `src/inputs/` | TextField, SearchField, Select, Checkbox, Radio, Toggle, FormField, SegmentedFilter, Tabs. Shared: `useField.ts`, `fieldParts.tsx`, `strip.tsx`, and `formValue.tsx` (how a control that is not native takes part in a `<form>`: value, reset, required). Tier 2: StarRating, SplitButton, Slider, Stepper, ColorScaleEditor (`colorScale.ts`, unit-tested; `bandColour.ts`). |
| `src/overlays/` | Popover, Tooltip, Menu, Modal (with ConfirmDialog), CommandPalette (`commandMatch.ts`), ActionBar. `shared.ts` is common to them. Tier 2: Spotlight, ShortcutsSheet. |
| `src/table/` | DataTable, on TanStack Table: `logic.ts` (sorting, groups, selection; unit-tested) and `grid.ts` (the keyboard grid). |
| `src/meters/` | ProgressBar, LevelMeter; `scale.ts`. Tier 2: PieIndicator, DivergingMeter; `fit.ts` (the value hides first); MeterList (the four meters in aligned columns). |
| `src/charts/` | The `umbra-ui/charts` entry (`index.ts`): LineChart, BarChart, DonutChart, RadarChart, with their shared code in `internal/`; `d3-scale` and `d3-shape` only. Tier 2: Sparkline (with `sparklineColumn` for `DataTable`), Heatmap (`internal/heat.ts`), Scatter. |
| `src/internal/` | Not exported: shared contexts, the loading/empty/error helper (`dataState.tsx`), `height.ts`, series markers, truncated text, change highlighting, `useNarrow`, and `useShrinkLevel`, the hook behind every "show less as it narrows" rule. Since Milestone 2: `useFitLevel` (the same for a block and its height), `gridCells.ts` (what the keyboard grids of the table and of the days share), `ActionsOverflow.tsx` and `ActionsRow.tsx` (actions that move into a "more" menu) with `menuRow.tsx` (the row a button becomes there), `Kbd.tsx` (a key cap), `focus.ts` (focus is never lost: `holdFocus`, `leaveDisabled`, `moveFocusFrom`), `distinctIds.ts` (rows with a repeated id, unit-tested), `direction.ts` (right to left for the arrow keys). |
| `src/utils/` | Shared helpers: `parts.ts` (the parts layer), `link.ts` (`renderLink`), `dev.ts` (development warnings), `defined.ts` (drops `undefined` keys before a third-party component), `passThrough.ts` (the attributes every root passes on), `thresholds.ts` (the one shape of colour by value, unit-tested), `finite.ts` (a value that is not a finite number is "no value", unit-tested). |
| `src/stories/` | Story-only code, never published: placeholders and sample data, and `pages/`, the five full-page reference stories (overview, list and detail, table, planning, analysis). `IntegrationTier2.stories.tsx`: tier 2 components together and in tier 1 containers. `RootAttributes.stories.tsx`: every component once, for the root attributes test. |
| `scripts/` | `build-tokens.mjs` (tokens to CSS and TypeScript), `build-customisation.mjs` (the customisation tables and the built-in strings table), `check-docs.mjs` with `check-docs-prelude.ts` (typechecks the docs samples), `examples.mjs` (installs and builds the examples), `check-examples-standalone.mjs` (each example as a template), `check-release.mjs` (the release rehearsal, the packed size and the changelog link), `check-treeshake.mjs` (`npm run check:package`: sizes, on-demand loading, types, server rendering, source maps), `fix-types.mjs` (run by the build: removes declaration files nothing reaches). Checks run by lint: `check-optional-props.mjs` (optional members and callbacks, by syntax and by type), `check-tokens.mjs`, `check-browsers.mjs`, and `check-docs.mjs`. |
| `.storybook/` | Storybook config; the toolbar switches density and context. |
| `docs/` | Guides in Markdown (`getting-started.md`, `layout.md`, `theming.md`, `customisation.md`, `recipes.md`), the generated `customisation-tables.md`, and `releasing.md` (the release steps, for the owner). Every `tsx` sample must compile (`npm run docs:check`). `browser-checks.md` is the manual Firefox and Safari checklist run before a release. |
| `docs/storybook/` | The guides as Storybook pages: one `.mdx` per guide, `Guide.tsx` (rewrites links between the Markdown files to Storybook pages, and keeps wide tables inside the page), and the Welcome page (`Welcome.mdx`, `welcome.md`). |
| `examples/` | Three complete Vite apps that import the built package, each a plain folder with its own `package.json` (not a workspace) that works as a template when copied out: `basic`, `dashboard` (many cards, charts, switchers, command palette) and `advanced` (hash router, list + detail, table with bulk actions and a modal form, settings, a component built from blocks and parts). |
| `tests/visual/` | Playwright tests against the built Storybook, with the baseline images in `__screenshots__/` (policy: `plan/decisions/06-docs-and-testing.md`, "Baseline images"). The comparison is strict on purpose; a changed baseline is a change to look at. Every file: |
| | **For every story**: `stories.spec.ts` (the captures, the no-page-scroll check, no baseline without a test), `a11y.spec.ts` (axe, WCAG 2.2 AA, on every tint). |
| | **Helpers**: `helpers.ts` (`openStory`, `expectFocusKept`, `pressKeys`, `settle`, `runAxe`), `live.ts` (the shared test of `highlightChanges`), `pixels.ts` (reads colours from a capture). |
| | **Tier 0 and 1, by group**: `interactions.spec.ts` (popovers, tab mode keys, overflow menus), `structure.spec.ts` (PageHeader, ActionBar, VerticalNav, Accordion), `shell-extras.spec.ts` (PrimaryAction, HistoryButtons, ShortcutBar, CommandPalette, shortcuts), `data-values.spec.ts`, `data-indicators.spec.ts`, `data-lists.spec.ts`, `data-banner.spec.ts`, `inputs-form.spec.ts`, `inputs-select.spec.ts`, `inputs-tabs.spec.ts`, `overlays.spec.ts` (Popover, Tooltip, Menu), `modal.spec.ts`, `table.spec.ts`, `meters.spec.ts`, `charts.spec.ts`, `pages.spec.ts` (the five full-page stories). |
| | **Tier 2, by group**: `time.spec.ts`, `data-tier2.spec.ts`, `inputs-tier2.spec.ts`, `meters-charts-tier2.spec.ts`, `shell-layout-tier2.spec.ts`, `overlays-tier2.spec.ts`, `integration-tier2.spec.ts` (compositions across groups, and the fixes of the integration pass). |
| | **One rule across components**: `tokens.spec.ts` (a token set on an ancestor reaches its reader in every container), `thresholds.spec.ts` (one list, the same band everywhere), `root-attributes.spec.ts` (every root passes on `id`, `data-*`, `aria-*`), `rtl.spec.ts` (right to left: layout and arrow keys), `forms.spec.ts` (every input with `name` in one native form: value, reset, required, label), `focus-kept.spec.ts` (a control that disables or removes itself hands the focus on; a popover gives it back), `shrink.spec.ts` (what a row shows is a function of its width, down and up again), `shrink-in-overlay.spec.ts` (the same inside a modal or a popover), `layers.spec.ts` (overlays opened from overlays), `modal-overlays.spec.ts` (the library's own tooltips inside a modal), `card-menu.spec.ts` (the overflow menu and the popover loaded on demand), `regressions.spec.ts` (one test per finding of review 2 that no other file covers). |
| `tests/examples/` | Playwright tests against the built example apps: `examples.spec.ts` (every app: clean load, no page scroll across sizes and densities, tab mode, a keyboard walk), `dashboard.spec.ts` and `advanced.spec.ts` (each app's own interactions). `source-maps.spec.ts` with `vite.maps.config.ts`: a thrown error resolves to a `.tsx` line of the library. |
| `.changeset/` | The pending changelog entries (`npm run changeset`), consumed by `npm run version`. |
| `.github/` | `workflows/ci.yml` (lint, typecheck, unit tests, build, release check; the browser tests in six shards; the examples) and `workflows/docs.yml` (Storybook to GitHub Pages, started by hand). Issue forms and the pull request template. |
| `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` | For contributors: set-up and what a change needs; how to report a vulnerability; the Contributor Covenant 2.1. |

## Decisions that bind every task

The full list with dates is in `plan/components.md` under "Decisions". The ones most often relevant:

- **The page never scrolls.** The app fills the window; only regions inside cards may scroll.
- **Components fill their slot** and show less detail as space shrinks, instead of overflowing.
- **Colour layers**: the app sets brand and context tint; violet (selected) and magenta (primary action) are fixed.
- **Density**: three levels, set once on the provider.
- **Every component is customisable through the same four layers**: tokens, props, parts, blocks (`plan/decisions/07-customisation.md`). Icon props accept any node.
- **Colour that carries data needs a non-colour fallback** (icon, text or pattern).
- **Domain-neutral**: generic names and generic props only.

## How to take on a task

**Add a component**
1. Check `plan/components.md`. If it is listed, use that name and scope. If not, add a row first (group, what it absorbs, screenshots, tier).
2. Find its evidence: search `plan/inventory/` for the name, then open the listed screenshots.
3. Write its spec before code in `plan/specs/`, copying the section structure of `plan/specs/Card.md` exactly (purpose, not for, evidence, anatomy, variants, the four customisation layers, behaviour as space shrinks, accessibility, open questions).

**Change a component**
1. Read its spec and its catalog row.
2. If the change contradicts a decision above, stop and ask the owner.
3. Update the spec in the same change as the code.

**Extract more from the screenshots**
1. Read the image itself; do not rely on the inventory alone. Its hex values and proportions were estimated by eye.
2. For colours, sample pixels (see the method note in `plan/inventory/source-colours.md`).
3. Add findings to the matching inventory file, and to the catalog or tokens if they change them.

**Something the screenshots cannot show** (motion, hover, focus, loading, keyboard): propose a rule, get the owner's approval, then record it in `plan/interaction.md`.

## Working with the owner

- Reply in short bullets and short tables. No long prose.
- Ask before deciding anything that changes the experience of developers using the library.
- When a decision is made, record it in `plan/` and update "Current state" above.
