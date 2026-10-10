# umbra-ui — agent guide

Read this first. It tells you what the project is, where things are, what state it is in, and how to take on a task.

## What this is

`umbra-ui` is an open-source React component library for full-window, data-dense applications (dashboards, consoles, back-office tools). It is opinionated: its own dark look, and a layout system where components size themselves to fill the window.

The design is **inspired by** 40 screenshots of a game UI in `screenshots/`. It is not a copy: no logos, names or assets from the source, and no domain-specific (football) components.

## Current state

**Phase: Milestone 0 (foundation) built, waiting for the owner's review.** Update this section whenever the phase or the next step changes.

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

**Next step**: an independent review of Milestone 0 (`plan/prompts/verify-milestone-0.md`). Then Milestone 1 (`plan/prompts/milestone-1.md`), starting with batch 1a (data basics) in `plan/roadmap.md`; each component's spec is written first, from `plan/specs/Card.md`.

### Known issues

- Commit `973f274` breaks "tests pass at every commit": it adds two navigation tests whose story arrives in the next commit. It was already pushed, so it stays.
- A card collapsed with its caret is not size-animated; only the caret rotates (open detail in `plan/interaction.md`).
- Dropdowns and overflow menus are popovers holding links and buttons, not ARIA menus, until the public `Menu` in Milestone 1.
- The visual tests capture stories on the default context tint only.

## Commands

| Command | Does |
|---|---|
| `npm install` | Installs, and generates the token CSS |
| `npm run tokens` | Regenerates `src/styles/tokens.css` and `tokens.generated.ts` from `plan/tokens.json`. Both are git-ignored; never edit them. |
| `npm run build` | Builds `dist/` (JS, types, one `styles.css`) |
| `npm run typecheck` / `npm run lint` / `npm run format` | TypeScript, ESLint + Prettier check, Prettier write |
| `npm test` | Unit tests (Vitest), for pure logic only |
| `npm run storybook` | Storybook on port 6006 |
| `npm run test:visual` | Builds Storybook, then captures every story at 1920x1080, 1280x720 and 1024x600 at all three densities, and fails on any document overflow. Stories tagged `narrow` are also captured at 900x560. |
| `npm run test:visual:update` | Same, and rewrites the baselines in `tests/visual/__screenshots__/`. Look at the changed images before committing. |
| `npm run docs:tables` | Regenerates `docs/customisation-tables.md` from the source. `npm run lint` fails when it is out of date, so run it after changing props, parts, blocks or CSS variables. |
| `npm run build -w examples/basic` | Builds the example app against the built package (run `npm run build` first) |
| `npm run changeset` | Adds a changelog entry; needed for any change users will notice |

- Run lint, typecheck, unit and visual tests before every commit; all must pass.
- Do not run `npm run release` or publish to npm without the owner's go-ahead.
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
| `plan/specs/` | One spec per component. `Card.md` is the template; all 14 tier 0 specs are approved. |
| `plan/layout.md` | The layout model: primitives, sizing rules, and what happens as space shrinks. |
| `plan/interaction.md` | States, motion, loading, live updates, keyboard and accessibility rules. |
| `plan/decisions/` | One short record per tech decision: styling, behaviour base, charts, table engine, packaging, docs and testing, customisation. |
| `plan/roadmap.md` | Pre-code tasks, milestones, build order, and the per-component definition of done. |
| `plan/reference/` | `index.html`: the static reference screen, the visual ground truth for the look (open it in a browser; `?density=compact&context=teal` switches settings). `shot-*.png`: renders at three sizes. |
| `plan/prompts/` | Ready-made prompts for starting a fresh agent session: `milestone-0.md` (used), `verify-milestone-0.md` (independent review of Milestone 0), `milestone-1.md` (plan and build Milestone 1). |
| `src/` | Library source. `src/styles/`: base CSS and the generated tokens. `src/provider/`: provider, scope, icon map, shortcut registry. `src/layout/`: Page, Columns, Stack, Slot, Card, SectionTitle, ScrollArea (`useSlot.tsx` and `collapse.ts` hold the layout rules). `src/shell/`: AppShell, TopBar, PrimaryNav, SubNav (`nav.tsx` is shared). `src/basics/`: Button, IconButton, Skeleton. `src/internal/`: not exported; overlays on React Aria and `useShrinkLevel`, the hook behind every "show less as it narrows" rule. `src/utils/`: shared helpers (`parts.ts` implements the parts layer). `src/charts/`: the `umbra-ui/charts` entry. |
| `scripts/` | Build scripts (`build-tokens.mjs`). |
| `.storybook/` | Storybook config; the toolbar switches density and context. |
| `docs/` | Guides in Markdown (`getting-started.md`, `layout.md`) and the generated `customisation-tables.md`. `docs/storybook/*.mdx` show them in Storybook. |
| `examples/basic/` | A small app that imports the built package; an npm workspace. |
| `tests/visual/` | Playwright tests against the built Storybook: `stories.spec.ts` (captures and the no-page-scroll check) and `interactions.spec.ts` (popovers, tab mode, overflow menus, keys), with the baseline images. |

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
