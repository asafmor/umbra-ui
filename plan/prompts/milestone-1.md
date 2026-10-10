You are continuing the implementation of umbra-ui, an open-source React
component library for full-window, data-dense applications. Milestone 0
(foundation) is built: the provider, the layout system, the shell and the basic
controls. Your job in this session is Milestone 1 (core, tier 1) from
plan/roadmap.md: plan it, then build it.

Read these first, in this order, before writing anything:
1. AGENTS.md: overview, repo map, binding decisions, commands, conventions,
   known issues, and the questions still waiting on the owner.
2. plan/roadmap.md: Milestone 1 batches and order, its "done when" test, and
   the per-component definition of done.
3. plan/components.md: the catalog row of every tier 1 component (what it
   absorbs, where it is seen).
4. plan/layout.md and plan/interaction.md.
5. plan/decisions/ (all seven). These are decided; do not re-open them. If
   one turns out to be unworkable, stop and tell me why.
6. plan/tokens.json.
7. plan/specs/: the 14 tier 0 specs. Card.md is the template for every spec
   you write.
8. The Milestone 0 code, so you extend it instead of rebuilding it:
   - src/utils/parts.ts: the parts layer (`Part`, `renderPart`).
   - src/layout/useSlot.tsx and collapse.ts: how a component becomes a layout
     child and how a Stack collapses cards.
   - src/internal/useShrinkLevel.ts: the hook behind every "show less as it
     narrows" rule. Read its comment before using it.
   - src/internal/overlays.tsx: the temporary internal popover, tooltip and
     overflow menu.
   - src/layout/Card.tsx and src/basics/Button.tsx as the model for props,
     parts, blocks, data attributes and CSS variables.
   - scripts/build-customisation.mjs and docs/customisation-tables.md.
   - tests/visual/: how stories are captured and how interactions are tested.
9. plan/reference/index.html and its renders: the visual ground truth. It
   already shows several tier 1 looks (segmented filter, tag, list items,
   table, stat value, progress bar, key-value rows).

Before any Milestone 1 code:
1. If I give you findings from the Milestone 0 verification, fix those first,
   each in its own commit, with the checks passing.
2. Ask me the questions listed in AGENTS.md under "Waiting on the owner" that
   are still open, and apply my answers (code, spec and docs in one change).
3. Tell me your plan for Milestone 1: the batches, what each needs from the
   others, the new dependencies if any, and your questions. Wait for my
   go-ahead.

Then work batch by batch, in the roadmap's order (1a data basics, 1b inputs,
1c overlays, 1d table, 1e meters and charts, 1f shell extras). If a later
batch needs something from an earlier one that is missing, say so; do not
reorder silently. For each batch:
1. Evidence. For each component, find its evidence in plan/inventory/ and
   open the listed screenshots yourself. The inventory's hex values and
   proportions were estimated by eye, and its club, competition and person
   names are placeholders.
2. Specs first. Write one spec per component in plan/specs/, copying the
   section structure of Card.md exactly. Show me the batch's specs, with
   their open questions, and wait for my approval before writing code.
3. Build each component to its spec, with all four customisation layers and
   stories for every variant and state, including loading, empty and error.
4. Verify in a real browser, update docs, commit and push.

Things Milestone 1 must do to what Milestone 0 left:
- 1c replaces the internal overlays with the public Popover, Menu and
  Tooltip. Move every Milestone 0 use to them (card collapse popover, header
  and bar overflow menus, nav dropdowns and "More", button tooltips) and
  delete src/internal/overlays.tsx. Nav dropdowns and overflow menus become
  real ARIA menus.
- 1c adds CommandPalette; the TopBar search trigger and the reserved `Mod+K`
  shortcut open it.
- 1f adds ShortcutBar, HistoryButtons and PrimaryAction. Replace the
  stand-ins in TopBar and SubNav (built-in back and forward buttons, a plain
  primary Button, the clipped SubNav end slot) and update their specs.
- Every data component gets `loading` (built from Skeleton), an empty state
  and an error state, per plan/interaction.md.
- DataTable (1d): TanStack Table for logic, its own column format, columns
  hidden by `priority` as width shrinks, and keyboard grid navigation, which
  is ours to design (plan/decisions/04-table-engine.md). Propose the
  keyboard model to me before building it.
- Charts (1e) ship from `umbra-ui/charts`, drawn as SVG with only `d3-scale`
  and `d3-shape`.
- Card collapse with the caret is not size-animated yet (open detail in
  plan/interaction.md). Propose how, or tell me why not.
- Docs in this milestone: the theming, customisation and recipes guides, and
  the `dashboard` and `advanced` example apps, built in CI like `basic`.

Rules:
- Every component follows its spec and exposes all four customisation layers
  as defined in plan/decisions/07-customisation.md. Follow the component
  conventions in AGENTS.md.
- The page never scrolls. Verify it, do not assume it: the visual tests fail
  on any document overflow at 1920x1080, 1280x720 and 1024x600, at all three
  densities. Every new story goes through them. Look at changed baseline
  images before committing them.
- Add interaction tests for behaviour that a static capture cannot show
  (keyboard, popovers, menus, sorting, shrink steps).
- Colour that carries data needs a non-colour fallback (icon, text or
  pattern). Check it on every context tint, not only the default.
- Keyboard and screen-reader support per plan/interaction.md: composite
  components use one tab stop and arrow keys inside. Target WCAG 2.2 AA.
- Keep React Aria and TanStack types out of the public API.
- No football-specific or other domain-specific names, props or sample data.
  Do not copy any asset, logo or name from the images in screenshots/.
- Never commit or push screenshots/. Before pushing documents derived from
  it, check for real club, competition, person and brand names and for local
  file paths, and replace them with placeholders.
- Run `npm run docs:tables` after changing props, parts, blocks or CSS
  variables; lint fails when the tables are out of date.
- Add a changeset (`npm run changeset`) for every change a user of the
  library would notice.
- Specs list "Open questions". When you reach one, ask me; do not decide
  silently. Ask me as well before any choice that changes how developers use
  the library.
- When code and spec disagree, fix the spec in the same change and tell me.
- Do not publish to npm. Milestone 1 ends with the first public release, but
  the release itself needs my explicit go-ahead.
- Keep AGENTS.md current: update "Current state" and "Next step" after each
  batch.

Git:
- Commit automatically, without asking, in small commits: one logical change
  each, with a clear message. Never commit failing code: lint, typecheck,
  unit tests, build and visual tests pass at every commit. A test goes in the
  same commit as, or after, the code it tests.
- Push to origin (asafmor/umbra-ui) after every commit or small group of
  commits, and check that CI passes.
- Never force-push, never rewrite pushed history, never commit secrets or
  local environment files.

Milestone 1 is done when three reference screens are rebuilt as full-page
stories in umbra-ui's own identity (an overview with many cards, a list +
detail screen, a table-heavy screen), each fills any window from 1024 x 600 up
with no page scroll, and every tier 1 component meets the per-component
definition of done. Show me that result running, with the test output, before
calling it done.

Reply to me in short bullets and short tables only. Start by reading the files
above, then tell me your plan and your questions before you write code.
