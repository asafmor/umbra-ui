# umbra-ui — agent guide

Read this first. It tells you what the project is, where things are, what state it is in, and how to take on a task.

## What this is

`umbra-ui` is an open-source React component library for full-window, data-dense applications (dashboards, consoles, back-office tools). It is opinionated: its own dark look, and a layout system where components size themselves to fill the window.

The design is **inspired by** 40 screenshots of a game UI in `screenshots/`. It is not a copy: no logos, names or assets from the source, and no domain-specific (football) components.

## Current state

**Phase: Milestone 0 (foundation) built and reviewed (`plan/reviews/milestone-0.md`); Milestone 1 (core) is being built.** Update this section whenever the phase or the next step changes.

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
| Fix pass on what the pages and docs work found, then the final review | in progress |

**Next step**: finish 1b, then 1c, 1d and 1f in the order of `plan/roadmap.md`. A batch is built from `plan/prompts/component-brief.md`.

### Known issues

- Open findings of the Milestone 0 review, with the batch that takes each: `plan/reviews/milestone-0.md`.
- Commit `88f6b37` fails lint: the `lint` script arrived one commit before its config.
- Commit `37fc048` ("WIP: …") fails lint (Prettier, three files). Two more WIP commits pass. They were already pushed, so they stay.
- Commit `973f274` breaks "tests pass at every commit": it adds two navigation tests whose story arrives in the next commit. It was already pushed, so it stays.

## Commands

| Command | Does |
|---|---|
| `npm install` | Installs, and generates the token CSS |
| `npm run tokens` | Regenerates `src/styles/tokens.css` and `tokens.generated.ts` from `plan/tokens.json`. Both are git-ignored; never edit them. |
| `npm run build` | Builds `dist/` (JS, types, one `styles.css`) |
| `npm run typecheck` / `npm run lint` / `npm run format` | TypeScript, ESLint + Prettier check, Prettier write |
| `npm test` | Unit tests (Vitest), for pure logic only |
| `npm run storybook` | Storybook on port 6006 |
| `npm run test:visual` | Builds Storybook, then runs every Playwright test: captures of every story at 1920x1080, 1280x720 and 1024x600 at all three densities and once on each other context tint (failing on any document overflow; stories tagged `narrow` are also captured at 900x560), the automated accessibility check of every story on every tint, and the interaction tests. CI runs it on every push. `UMBRA_TEST_PORT` changes the port (default 6007), so two checkouts can run at once. |
| `npm run test:visual:update` | Same, and rewrites the baselines in `tests/visual/__screenshots__/`. Look at the changed images before committing. |
| `npm run docs:tables` | Regenerates `docs/customisation-tables.md` from the source. `npm run lint` fails when it is out of date, so run it after changing props, parts, blocks or CSS variables. |
| `npm run docs:check` | Typechecks every `tsx` sample in `README.md` and `docs/*.md` against the source (`scripts/check-docs.mjs`). `npm run lint` runs it. A sample may be a fragment: names it does not define come from the library or from `scripts/check-docs-prelude.ts`. |
| `npm run build-storybook` | Builds the static Storybook into `storybook-static/` (the browser tests and the Pages workflow use it). |
| `npm run examples` | Installs and builds the three example apps in place, each in its own folder against the built package (run `npm run build` first; `scripts/examples.mjs`). One only: `npm run examples -- basic`. Then `npm run dev --prefix examples/basic`. Run it again after rebuilding the library: an example holds a copy of the package, not a link. |
| `npm run examples:standalone` | Copies each example out of the repository, points `umbra-ui` at the packed tarball, and runs `npm install && npm run build` there: proof that each works as a template (`scripts/check-examples-standalone.mjs`). CI runs it. |
| `npm run test:examples` | Builds the package and the three examples, serves each with `vite preview` and drives them with Playwright (`playwright.examples.config.ts`, ports from `UMBRA_EXAMPLES_PORT`, default 6017). |
| `npm run changeset` | Adds a changelog entry; needed for any change users will notice |
| `npm run release:check` | Rehearses `changeset version` on a temporary copy and checks what `npm pack` would hold (`scripts/check-release.mjs`). Changes and publishes nothing. CI runs it. Run `npm run build` first. |
| `npm run version` | Owner's release step 1: turns the pending changesets into the version and `CHANGELOG.md`, and updates the lock file. |
| `npm run release` | Owner only. Lint, typecheck, unit tests, build, the final package check, then `changeset publish`. Steps: `docs/releasing.md`. |

- Run lint, typecheck, unit and visual tests before every commit; all must pass.
- Do not run `npm run release` or `npm publish`, create a tag or a GitHub release, or change repository settings: only the owner releases (`docs/releasing.md`). `npm publish --dry-run` in a scratch clone is fine.
- The examples are plain folders, not npm workspaces (`plan/decisions/05-packaging.md`): the root `npm install` does not install them.
- Component conventions: CSS Modules; a token is read as `var(--umbra-<component>-<name>, <fallback>)` and never declared on the component, so apps can set it from any ancestor; roots carry `data-umbra="<name>"`, parts `data-part="<name>"`, state as `data-` attributes; `parts` props go through `renderPart`; React Aria types stay out of public props.
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
| `plan/reviews/` | Review reports. `milestone-0.md`: what the independent review found, what was fixed, and what is open. |
| `plan/prompts/` | `component-brief.md`: the rules for building a batch of components (read it before adding one). Ready-made prompts for starting a fresh agent session: `milestone-0.md` (used), `verify-milestone-0.md` (independent review of Milestone 0), `milestone-1.md` (plan and build Milestone 1). |
| `src/` | Library source, one folder per group. `index.ts` is the `umbra-ui` entry. Each component is a `.tsx` with its `.module.css` and `.stories.tsx`; `samples.*` and `story*.tsx` files are story helpers. |
| `src/styles/` | `index.css` (base CSS) and the generated `tokens.css` and `tokens.generated.ts`. |
| `src/provider/` | `UmbraProvider` and `UmbraScope`, the icon map (`icons.tsx`), the shortcut registry (`shortcuts.ts`), `contrast.ts`. |
| `src/layout/` | Page, Columns, Stack, Slot, Card, SectionTitle, ScrollArea, Accordion. `useSlot.tsx` and `collapse.ts` hold the layout rules. |
| `src/shell/` | AppShell, TopBar, PrimaryNav, SubNav, VerticalNav, PageHeader, PrimaryAction, HistoryButtons, ShortcutBar. `nav.tsx` is shared by the navs. |
| `src/basics/` | Button, IconButton, Skeleton. |
| `src/data/` | Tag, Badge, ValuePill, Avatar, EntityIcon, KeyValue, StatValue, SummaryTile, TrendArrow, StatusIndicator, GroupHeader, List, ListItem, Banner, Legend, EmptyState, Link. Shared: `tone.ts`, `valueLevel.ts`, `entity.ts`. |
| `src/inputs/` | TextField, SearchField, Select, Checkbox, Radio, Toggle, FormField, SegmentedFilter, Tabs. Shared: `useField.ts`, `fieldParts.tsx`, `strip.tsx`. |
| `src/overlays/` | Popover, Tooltip, Menu, Modal (with ConfirmDialog), CommandPalette (`commandMatch.ts`), ActionBar. `shared.ts` is common to them. |
| `src/table/` | DataTable, on TanStack Table: `logic.ts` (sorting, groups, selection; unit-tested) and `grid.ts` (the keyboard grid). |
| `src/meters/` | ProgressBar, LevelMeter; `scale.ts`. |
| `src/charts/` | The `umbra-ui/charts` entry (`index.ts`): LineChart, BarChart, DonutChart, RadarChart, with their shared code in `internal/`; `d3-scale` and `d3-shape` only. |
| `src/internal/` | Not exported: shared contexts, the loading/empty/error helper (`dataState.tsx`), `height.ts`, series markers, truncated text, change highlighting, `useNarrow`, and `useShrinkLevel`, the hook behind every "show less as it narrows" rule. |
| `src/utils/` | Shared helpers: `parts.ts` (the parts layer), `link.ts` (`renderLink`), `dev.ts` (development warnings). |
| `src/stories/` | Story-only code, never published: placeholders and sample data, and `pages/`, the three full-page reference stories (overview, list and detail, table). |
| `scripts/` | `build-tokens.mjs` (tokens to CSS and TypeScript), `build-customisation.mjs` (the customisation tables and the built-in strings table), `check-docs.mjs` with `check-docs-prelude.ts` (typechecks the docs samples), `examples.mjs` (installs and builds the examples), `check-examples-standalone.mjs` (each example as a template), `check-release.mjs` (the release rehearsal and the package check). |
| `.storybook/` | Storybook config; the toolbar switches density and context. |
| `docs/` | Guides in Markdown (`getting-started.md`, `layout.md`, `theming.md`, `customisation.md`, `recipes.md`), the generated `customisation-tables.md`, and `releasing.md` (the release steps, for the owner). Every `tsx` sample must compile (`npm run docs:check`). |
| `docs/storybook/` | The guides as Storybook pages: one `.mdx` per guide, `Guide.tsx` (rewrites links between the Markdown files to Storybook pages, and keeps wide tables inside the page), and the Welcome page (`Welcome.mdx`, `welcome.md`). |
| `examples/` | Three complete Vite apps that import the built package, each a plain folder with its own `package.json` (not a workspace) that works as a template when copied out: `basic`, `dashboard` (many cards, charts, switchers, command palette) and `advanced` (hash router, list + detail, table with bulk actions and a modal form, settings, a component built from blocks and parts). |
| `tests/visual/` | Playwright tests against the built Storybook, with the baseline images in `__screenshots__/` (policy: `plan/decisions/06-docs-and-testing.md`, "Baseline images"). The comparison is strict on purpose; a changed baseline is a change to look at. For every story: `stories.spec.ts` (captures and the no-page-scroll check) and `a11y.spec.ts` (axe, WCAG 2.2 AA, on every tint). Behaviour a still image cannot show, one file per group: `interactions.spec.ts` (Milestone 0: popovers, tab mode, overflow menus), `structure.spec.ts` (PageHeader, ActionBar, VerticalNav, Accordion), `shell-extras.spec.ts` (PrimaryAction, HistoryButtons, ShortcutBar, CommandPalette, shortcuts), `data-values.spec.ts`, `data-indicators.spec.ts`, `data-lists.spec.ts`, `data-banner.spec.ts`, `inputs-form.spec.ts`, `inputs-select.spec.ts`, `inputs-tabs.spec.ts`, `overlays.spec.ts` (Popover, Tooltip, Menu), `modal.spec.ts`, `table.spec.ts`, `meters.spec.ts`, `charts.spec.ts`, `pages.spec.ts` (the full-page stories). `live.ts` is a shared helper. |
| `tests/examples/` | Playwright tests against the built example apps: `examples.spec.ts` (every app: clean load, no page scroll across sizes and densities, tab mode, a keyboard walk), `dashboard.spec.ts` and `advanced.spec.ts` (each app's own interactions). |
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
