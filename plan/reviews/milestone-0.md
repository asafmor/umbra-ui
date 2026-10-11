# Milestone 0 review (2026-10-10)

An independent check of Milestone 0 against the plan: the checks, the "done when" test measured in a browser, each spec against the code, accessibility on every context tint, the repository rules, the look against the reference, and the docs followed as a new user.

**Verdict: complete with gaps.** The "done when" test holds. The defects that broke a rule were fixed the same day (see "Fixed"). What is left is listed under "Open", with the batch that will take it.

## Fixed

| Finding | Fix |
|---|---|
| The reference screen reused place names, person names and figures from a source screenshot | Replaced with placeholders; renders redone. Pushed history is unchanged (owner's decision). |
| After one large resize a `Stack` collapsed too few cards and overflowed its slot | The collapsed header height is predicted with its collapsed padding |
| A layout-collapsed card took the spare space; headers spilled out when even they did not fit | A collapsed card is exactly its header, and shrinks when it must |
| A card popover reopened by itself, or stayed open without its anchor in tab mode | It closes when the card opens again or the window enters or leaves tab mode |
| Layout children inside a card registered with the `Stack` or `Columns` around the card | A card starts a new layout context |
| A collapsed band header lost its colour on hover | Fixed |
| A disabled nav item with `href` still navigated; one without `href` broke the arrow-key order | A disabled item is an `aria-disabled` button that does nothing and stays in the key order |
| A `TopBar` without a nav never shrank | It shrinks; story and test added |
| Focus rings clipped: column tabs, scroll viewport, `SubNav` end slot, primary action, title links, section title controls, first nav item | Drawn inside the clipping container, or given room |
| Icon, spinner and logo parts had no `data-part`; the caret rotated under reduced motion | Fixed |
| README: wrong collapse claim, missing fonts and tab label, extra packages in the install line | Corrected |
| `npm run lint` failed on a local tool's folder; no changeset existed | Folder ignored; first changeset added |

## Open

The last column was filled in on 2026-10-11 from the code and the specs: three items are still open (16, 18 and part of 20).

| # | Finding | Severity | Planned in | Status on 2026-10-11 |
|---|---|---|---|---|
| 1 | Hover lightens filled buttons below 4.5:1 (`primary` 4.07, `danger` 3.90) | should fix | owner decision, then 1a | fixed before 1a: primary, accent and danger darken on hover |
| 2 | The fixed focus ring is 1.29:1 on a light brand bar | should fix | owner decision | fixed before 1a: the ring colour is computed from the brand (`focusColourOn`) |
| 3 | Inactive `PrimaryNav` items are dimmed to 80%, which is 4.12:1 on a mid-tone brand | should fix | owner decision | fixed before 1a: the resting colour is computed from the brand |
| 4 | Selected is shown by colour only: column tabs, the current row of a nav dropdown, a toggled `IconButton` | should fix | 1b (`Tabs`, `Menu`), owner decision for the toggle | fixed: tabs and the current dropdown row in 1b; a toggled button is outlined |
| 5 | A loading button is exposed like a disabled one; it needs a named progress element (`loadingLabel`) | should fix | owner decision, then 1a | fixed before 1a: `loadingLabel` |
| 6 | The popover of a layout-collapsed card renders the children a second time (state not shared, ids repeated) | should fix | 1c (`Popover`) | fixed in 1c: the body renders once, through a portal into the popover |
| 7 | Nav caret: same name as its link, no name for a non-text label, 12 to 18px target | should fix | 1c (`Menu`) | fixed in 1c: `submenuLabel(label)` names it; the target is at least 24px |
| 8 | `TopBar` is not built only from public blocks (context, logo and primary-action wrappers are private) | should fix | 1f; fixed: `TopBar.Logo`, `TopBar.Context`, `TopBar.PrimaryAction`, `TopBar.Search` | fixed in 1f |
| 9 | `SubNav` end slot clips its controls, which stay focusable | should fix | 1f (`ShortcutBar`); fixed: the slot clips nothing | fixed in 1f |
| 10 | The primary action is flat; the reference draws a gradient to `primaryEnd` | should fix | 1f (`PrimaryAction`); fixed | fixed in 1f |
| 11 | "ResizeObserver loop completed with undelivered notifications" fires on some resizes that change the collapsed set. No visible effect. | should fix | before 1a | closed: the error comes from Storybook (see the note under the decisions) |
| 12 | Stories and tests missing for: `Page` loading, footer and `padding="none"`; `narrow="keep"`, `overflow="keep"`, `gap`, nested `Columns`; `AppShell` `subNav` prop and blocks; `ScrollArea` `onReachEnd`; `SectionTitle` `onOpen` and `level`; card `bandColor`, controlled collapse and parts; provider `icons`, `shortcuts`, `reducedMotion`, `locale`; any use of `parts` or blocks in shell and basics; nav `ArrowDown`, `Escape`, `Home`, `End`; `TopBar` shrink step 1; `SubNav` label hiding; button keys, loading and `shortcut` | should fix | before 1a | done before 1a (spot-checked 2026-10-11: stories exist for `padding="none"`, `narrow="keep"`, `onReachEnd`, `bandColor` and the provider props; not re-checked item by item) |
| 13 | No automated accessibility check runs against the stories, and the visual tests use the default tint only | should fix | before 1a | fixed before 1a: `a11y.spec.ts` on every tint; captures on each other tint |
| 14 | Scroll thumb is 1.7 to 1.9:1 against its background; skeleton 1.1 to 1.2:1 | minor | owner decision | thumb fixed before 1a; the skeleton stays decorative (owner) |
| 15 | Other components' tokens are declared on `TopBar` and `SubNav` parts, so an ancestor cannot override them there | minor | 1f; fixed: the bars have their own tokens | fixed in 1f |
| 16 | Generated tables list some tokens under the wrong component and have no defaults column | minor | with the customisation guide | **open**: the tables still have no defaults column |
| 17 | Shortcut conflicts: the first match wins silently, and a reserved key with nothing mounted swallows the app's binding | minor | 1c (`CommandPalette`); fixed: rules in `specs/UmbraProvider.md` | fixed in 1c |
| 18 | `ScrollArea`: `axis="both"` only tracks the vertical axis; `onReachEnd` never fires when content does not overflow | minor | 1a (`List`) | **open**: `axis="both"` still tracks the vertical axis only, and `onReachEnd` needs overflow |
| 19 | Commit `88f6b37` fails lint (the script arrived one commit before its config) | minor | recorded in AGENTS.md | recorded in AGENTS.md |
| 20 | Hard-coded values without a token: logo size, badge sizes, popover minimum widths, hover and press mix steps, two durations | minor | with the theming guide | mostly fixed: logo, badge and popover sizes are component tokens. **Open**: three literal durations (Skeleton 1.6s, ProgressBar 1.4s, the spinner 0.9s) |

## Not verified

- Firefox, Safari, browser zoom, device scale above 1, a real screen reader, right-to-left.
- A real window drag; resizing was done through the test browser only.
- Visual tests at commits other than the latest.

## Where the plan is unclear

- `roadmap.md` asks for loading, empty and error stories for every component; `interaction.md` gives those states to data components only.
- `roadmap.md` does not say what "keyboard and screen-reader checks" are or how they run.
- `layout.md` says the default priority follows source order; the specs say default 0, ties from the end.
- `interaction.md` says hover moves "one step"; the tokens have no step, and no rule for coloured surfaces.
- `Card.md` does not say whether the popover moves or repeats the content.
- `TopBar.md` promises 4.5:1 on any brand but does not cover dimmed items or the focus ring.

## Owner's decisions (2026-10-10)

The owner approved the Milestone 1 plan and these answers, and asked for the work to run to completion without a stop per batch, with CI running every test.

| Question | Decision |
|---|---|
| Popover needed by 1b | Popover and Tooltip move to the start of 1b |
| Review leftovers | Done before 1a |
| Tints in visual tests | Each story once on each other tint, at the default density |
| Button hover contrast | Primary, accent and danger darken on hover |
| Brand bar | Dimmed nav items and the focus ring are computed from the brand |
| Selected by colour only | A second cue is always added |
| Loading button | `loadingLabel`, default "Loading" |
| Scroll thumb and skeleton | Thumb raised to 3:1 or more; skeleton stays decorative |
| Release | `0.1.0`; publishing still needs the owner's explicit go-ahead |

Item 11 (the ResizeObserver loop error) turned out to come from Storybook, which observes the document body; a sweep of 111 window sizes on the `basic` example app raised none.
