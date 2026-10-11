You are continuing the implementation of umbra-ui, an open-source React
component library for full-window, data-dense applications. Milestones 0
(foundation) and 1 (core, tier 1) are built and reviewed: the provider, the
layout system, the shell, and 66 components for data, inputs, overlays, the
table, meters and charts, with three full-page stories, five guides and three
example apps. Your job in this session is Milestone 2 (extended, tier 2) from
plan/roadmap.md: plan it, then build it.

Read these first, in this order, before writing anything:
1. AGENTS.md: overview, current state, repo map, commands, binding decisions,
   conventions and known issues.
2. plan/roadmap.md: Milestone 2's component list, and the per-component
   definition of done.
3. plan/components.md: the catalog row of every tier 2 component (what it
   absorbs, where it is seen), and the "Dropped" list.
4. plan/reviews/milestone-1.md: what three independent reviews found, what
   was fixed, and the "Open after the three reviews" table. Those open items
   are yours unless marked for the owner. plan/reviews/milestone-0.md has a
   status column for the older ones.
5. plan/layout.md and plan/interaction.md: the layout rules (stack collapse,
   tab mode, content height, minimum widths) and the interaction rules
   (states, motion, loading / empty / error and who is exempt, layers,
   direction, "focus is never lost").
6. plan/decisions/ (all seven). These are decided; do not re-open them. If
   one turns out to be unworkable, stop and tell me why. Read 05 (the build
   shape: one file per module, "use client", source maps, the package check),
   06 (testing, and the baseline image policy) and 07 (the four customisation
   layers and the naming rules) closely.
7. plan/prompts/component-brief.md: the rules for building a batch of
   components. Every agent you start gets it.
8. plan/tokens.json, and docs/customisation-tables.md (generated: every
   component's real props, parts, blocks, tokens and built-in strings).
9. plan/specs/: Card.md is the template for every spec. Read the specs of the
   components yours build on.
10. The code you extend instead of rebuilding:
    - src/utils/parts.ts (parts), src/utils/link.ts (`LinkRenderProps`).
    - src/layout/useSlot.tsx and collapse.ts (layout children, stack
      collapse), src/internal/useNarrow.ts (the minimum window).
    - src/internal/useShrinkLevel.ts and src/inputs/strip.tsx ("show less as
      it narrows" and "more" menus). Read their comments before using them:
      they must survive a font loading late and two resizes in one frame.
    - src/internal/dataState.tsx (loading, empty, error),
      useChangeHighlight.ts (live updates), TruncatedText.tsx,
      SeriesMarker.tsx and the series palette.
    - src/overlays/ (Popover, Menu, Tooltip, Modal and the layer tokens).
    - src/charts/internal/ (the size hook, scales, measured labels, axes,
      tooltip, keyboard navigation, the hidden data table).
    - src/provider/ (icon map, shortcut registry, direction, reduced motion).
    - tests/visual/: stories.spec.ts and a11y.spec.ts run on every story by
      themselves; helpers.ts has the shared helpers, including the check
      that focus never lands on the page body.
11. docs/ (the five guides and releasing.md) and examples/ (basic, dashboard,
    advanced), so new components are documented and shown the same way.
12. plan/reference/index.html and its renders: the visual ground truth. It
    shows one tier 2 look already (the week strip).

Milestone 2's components, from the roadmap: Planner, WeekStrip, ScheduleSlot,
DateChip, StarRating, SequenceDots, MediaCard, Comparison, SplitButton,
Slider, Stepper, ColorScaleEditor, Spotlight, ShortcutsSheet, PieIndicator,
DivergingMeter, Sparkline, Heatmap, Scatter, WidgetBoard, HorizontalScroller,
ContextBlock, EntitySwitcher. The roadmap says the order is decided by
demand: propose an order and grouping, and say why.

Before any Milestone 2 code:
1. Check the starting state yourself; do not trust the status tables. Run
   `npm ci`, lint, typecheck, unit tests, build, `npm run check:package`,
   `npm run release:check`, `npm run test:examples` and
   `npm run test:visual`, and check the latest CI run with `gh run list`.
   Report exact counts. If something fails, fix that first.
2. Check whether `0.1.0` has been released (`npm view umbra-ui version`, the
   git tags, CHANGELOG.md). If it has not, do not release it: that needs my
   explicit go-ahead. If it has, every change from now on is a change to a
   published package: say so in the changeset, and do not rename or remove a
   public prop, part, block, token or export without asking me.
3. Take the "Open after the three reviews" items of
   plan/reviews/milestone-1.md that are not marked for the owner, and fix
   them first, each in its own commit with a test, with the checks passing.
4. Tell me your plan for Milestone 2: the groups, what each needs from the
   others and from tier 1, new dependencies if any (prefer none: the date
   components should use the platform's `Intl` and React Aria's date
   support; charts use only `d3-scale` and `d3-shape`), new tokens you
   expect, and your questions. Wait for my go-ahead.

Then work group by group. For each group:
1. Evidence. For each component, find its evidence in plan/inventory/ and
   open the listed screenshots yourself. The inventory's hex values and
   proportions were estimated by eye, and its names are placeholders.
2. Specs first. Write one spec per component in plan/specs/, copying the
   section structure of Card.md exactly. Show me the group's specs, with
   their open questions, and wait for my approval before writing code. If I
   have told you to proceed without stopping, decide the open questions
   yourself, choose the fuller option, and record each under "Resolved".
3. Build each component to its spec, with all four customisation layers,
   stories for every variant and state (loading, empty and error where
   plan/interaction.md says the component has them), an interaction test for
   its keys and focus, a test for each shrink step, and a right-to-left
   story and test.
4. Verify in a real browser, update the docs, commit and push, and check CI.

How the work is run (this is what worked in Milestone 1; keep it):
- One agent per group, each in its own git worktree, given
  plan/prompts/component-brief.md and its list of components, and its own
  test port (`UMBRA_TEST_PORT`, and `UMBRA_EXAMPLES_PORT` if it runs the
  example tests), so several can run their suites at once. A worktree may
  start behind: every agent runs `git merge main` first, and again before it
  finishes.
- Agents do not edit src/index.ts, src/charts/index.ts, AGENTS.md, docs/ or
  .changeset/; they report the exports to add. You merge each branch into
  `main`, add the exports, run `npm run docs:tables`, run the whole suite on
  the merged result, and only then push. Two branches that change the same
  baseline images will conflict: keep one side and regenerate.
- The screenshots are not in a worktree; they are in `screenshots/` of the
  main checkout, read-only. Tools that take the project root from the
  environment may write to the main checkout by mistake: tell agents to
  check `git status` in both places before they finish.
- When every group is merged, run an integration pass (the same concept
  named the same way everywhere, shared internals used instead of copies,
  every built-in icon in the icon map, tooltips and overflow menus where a
  group had to leave them out), then build full-page stories that use the
  new components together, and then start independent reviewers that did not
  write the code: each must treat "done" as a claim to test, reproduce in a
  real browser, and report findings with a severity, a way to reproduce and
  the plan line contradicted. Fix what they find, each fix with a test that
  fails without it. Record the reviews in plan/reviews/milestone-2.md.

Things Milestone 2 must do to what Milestone 1 left:
- ShortcutsSheet is the help overlay rendered from the shortcut registry.
  The reserved key for it is still open in plan/interaction.md: propose it.
  It shares its data with the command palette's `includeShortcuts`.
- ContextBlock replaces the plain two-line node that stories and examples
  pass to the TopBar's `context` slot; it is the first thing the bar hides
  as it narrows. EntitySwitcher goes in a PageHeader or the TopBar.
- Sparkline is the in-cell chart for DataTable and SummaryTile; Heatmap and
  Scatter ship from `umbra-ui/charts` and follow the four charts there
  (fill the slot, shed detail in stated steps, a non-colour cue for every
  series, keyboard navigation, the hidden data table, `height`).
  PieIndicator and DivergingMeter belong with the meters, in the main entry.
- Planner, WeekStrip, ScheduleSlot and DateChip are the time group: one
  date model for all four (plain ISO date strings in the public API, no
  date library type), the locale's first day of the week and formats from
  the provider's `locale`, right-to-left, and keyboard grid navigation like
  the DataTable's model. Replace the hand-made week strip in the Overview
  page story with WeekStrip.
- WidgetBoard is a masonry of collapsible cards and HorizontalScroller a row
  of cards that scrolls sideways: both must keep the binding rule that the
  page never scrolls and only regions inside it do.
- MediaCard takes images: the library ships none, and stories must not use
  photographs or anything from `screenshots/`. Draw placeholders.
- Slider, Stepper, StarRating and SplitButton are inputs: they read the
  surrounding FormField through `useFieldControl`.
- ColorScaleEditor edits a value-to-colour ramp; ValuePill, ProgressBar and
  the charts' thresholds should be able to take what it produces. The
  reviews found four different `thresholds` shapes across those components:
  propose one, before `1.0`.
- Spotlight dims everything but one target: decide how it sits in the layer
  tokens with Modal and the command palette.
- Docs in this milestone: every new component in the guides and recipes
  where it fits, the examples updated to use them where they replace a
  stand-in, and README's component overview.

Rules:
- Every component follows its spec and exposes all four customisation
  layers as defined in plan/decisions/07-customisation.md, with the naming
  rules there. Follow the component conventions in AGENTS.md and
  plan/prompts/component-brief.md.
- The page never scrolls. Verify it, do not assume it: the visual tests fail
  on any document overflow at 1920x1080, 1280x720 and 1024x600, at all
  three densities. Look at changed baseline images before committing them:
  the comparison is strict on purpose (a few pixels), so a changed baseline
  is a change to explain. Keep stories few and full: twelve images are
  stored per story (plan/decisions/06-docs-and-testing.md, "Baseline
  images").
- Accessibility: WCAG 2.2 AA. The automated check runs on every story on
  every context tint, but only on what a story shows: open the overlays and
  states it cannot reach and check those yourself. Text 4.5:1, non-text 3:1,
  measured on all four tints. Colour that carries data needs a second cue.
  Composite components use one tab stop and arrow keys inside. Focus is
  never lost to the page body.
- Tests must be deterministic. CI runs with no retries. A test that passes
  only on a second try is a defect in the component or in the test: find
  the cause. Do not preload fonts or add waits to hide one.
- Keep React Aria, TanStack and d3 types out of the public API. Run
  `npm run check:package` after a change to exports or the build: it checks
  the size of single imports, the types under three module-resolution
  modes, and server rendering.
- No football-specific or other domain-specific names, props or sample
  data. Do not copy any asset, logo, name, number or sentence from the
  images in screenshots/. Never commit or push screenshots/. Before pushing
  documents derived from it, check for real club, competition, person,
  place, company and brand names and for local file paths, and replace them
  with placeholders.
- Run `npm run docs:tables` after changing props, parts, blocks, tokens or
  built-in strings, and `npm run docs:check` after changing a doc sample;
  lint fails when either is out of date.
- Add a changeset (`npm run changeset`) for every change a user of the
  library would notice.
- Specs list "Open questions". When you reach one, ask me; do not decide
  silently, unless I have told you to proceed without stopping. Ask me as
  well before any choice that changes how developers use the library.
- When code and spec disagree, fix the spec in the same change and tell me.
- Do not publish to npm, create a tag or a GitHub release, or change
  repository settings. A release needs my explicit go-ahead; the steps are
  in docs/releasing.md.
- Keep AGENTS.md current: update "Current state" and "Next step" after each
  group, and the repo map when a folder or a test file is added.

Git:
- Commit automatically, without asking, in small commits: one logical change
  each, with a clear message. Never commit failing code: lint, typecheck,
  unit tests, build and the browser tests pass at every commit on `main`. A
  test goes in the same commit as, or after, the code it tests.
- Push to origin (asafmor/umbra-ui) after every commit or small group of
  commits, and check that CI passes: the checks job, every browser shard and
  the examples job.
- Never force-push, never rewrite pushed history, never commit secrets or
  local environment files.

Milestone 2 is done when every tier 2 component meets the per-component
definition of done, the time group and the new charts are shown working
together in full-page stories that fill any window from 1024 x 600 up with no
page scroll, the docs and examples cover the new components, and independent
reviewers have checked it and their findings are fixed or recorded as open.
Show me that result running, with the test output, before calling it done.

Reply to me in short bullets and short tables only. Start by reading the
files above and checking the starting state, then tell me your plan and your
questions before you write code.
