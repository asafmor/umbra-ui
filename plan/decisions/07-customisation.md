# 07 — Customisation: four layers, the same for every component

**Decided** 2026-10-10.

Every component is customised through the same four layers. A developer tries them in order and stops at the first that is enough.

| Layer | For | Example |
|---|---|---|
| 1. Tokens | Look: colour, type, spacing, density | `<UmbraProvider brand="#0a7" density="compact">` |
| 2. Props | Variants and behaviour | `<Card title="Budget" collapsible priority={2} />` |
| 3. Parts | Replace or hide one named piece | `<Card parts={{ header: <MyHeader />, footer: null }} />` |
| 4. Blocks | Compose your own version from the building blocks | `<Card.Root><Card.Header>…</Card.Header><Card.Body>…</Card.Body></Card.Root>` |

Rules:

- **Tokens** can be set on the provider or on any subtree. A component never declares a public `--umbra-*` property, in its stylesheet or in a `style` object: not another component's token, and not a global one (`--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-icon-size`). That would beat the app's value set on an ancestor. A container that needs a different default for what is inside it (a 24px clear button in a field, a smaller icon in a nav item, a ring colour that shows on the brand bar) sets a private property, and the reader uses `var(--umbra-<token>, var(--<token>, <default>))` (decided 2026-10-11; widened to global tokens and finished the same day, Milestone 2 decision 3).
  - The private properties in use: `--icon-size`, `--icon-button-size`, `--focus-offset`, `--focus-color`, `--primary-action-min-height`, `--badge-ring`, `--badge-size`, `--badge-dot-size`, `--badge-padding-x`, `--badge-font`, `--avatar-size`, `--entity-icon-size`, `--scroll-fade-color`.
  - Order of precedence, strongest first: the app's public token on any ancestor; the container's private default (which may itself come from a token of the container, such as `--umbra-table-focus-offset`); the reader's own default. So a container's token changes the default inside that container only, and gives way to the global token when the app sets both.
  - Every token of `plan/tokens.json` is read by the library (same check, added 2026-10-11): as `var(--umbra-…)`, through a template over a scale (`var(--umbra-space-${gap})`), or through a constant of `tokens.generated.ts` where CSS cannot read a variable (`minWindow` for the media query of `useNarrow`). A token that exists only for apps goes on the check's "for apps" list with its reason; the list is empty.
  - No stylesheet holds a literal duration (same check, added 2026-10-11): a timing is `--umbra-motion-duration-*`, or a component token that falls back to one. `0s` and the `1ms` of an animation that only waits for its delay are allowed.
  - Who may declare a public token: `UmbraProvider` and `UmbraScope` (`src/provider/`), the base stylesheet and the generated tokens (`src/styles/`). `scripts/check-tokens.mjs` (in `npm run lint`) fails on any other declaration; its allowlist, with a reason for each entry, holds `--umbra-slot-min-height` (reset on every layout child, so never inherited) and a component's own token set on its own root from its own prop (`bandColor`). `tests/visual/tokens.spec.ts` proves, per container, that the app's token reaches the reader inside.
- **Props** cover the common cases only. A component does not grow a prop for every piece; that is what parts are for.
- **Parts**: each component publishes a fixed list of part names. A part accepts a node (replace), `null` (hide), or a function that receives the default part's props (wrap or adjust).
- **Blocks**: the all-in-one component is itself built from its public blocks, so anything it does can be rebuilt by hand. Exceptions, each recorded in its spec (2026-10-11): a component that is a single control with fixed inner parts (`PrimaryAction`), or whose value is the wiring between existing public components (`HistoryButtons`), publishes no blocks; its pieces are reached through `parts`, and a hand-built version is composed from the public components it uses.
- Every component also accepts `className` and `style` on its root, and exposes its state as `data-` attributes for CSS.
- **`data-part`** (added 2026-10-11): every piece named in a spec's anatomy carries `data-part="<name>"`, whether or not it can be replaced, and so do the placeholders shown while loading (`skeleton`) and the empty and error states (`empty`, `error`). The value is the part's name exactly as it is written in `parts` and in the spec: camelCase (`externalIcon`, `sortIndicator`), never kebab-case. A replaced part is the app's node, so it carries the attribute only if the app adds it.
- **Blocks** take `className` and `style` like the root does, and pass them to their element.
- **Optional props accept an explicit `undefined`** (added 2026-10-11): every optional member of a props, part props, block props or option type (columns, items, series, commands, shortcuts) is declared `prop?: T | undefined`, so an app with `exactOptionalPropertyTypes` can write `prop={condition ? value : undefined}`. An `undefined` means the same as leaving the prop out. Three checks hold it: the flag is on in `tsconfig.json`, `scripts/check-optional-props.mjs` (in `npm run lint`) reads every declaration under `src/`, and the consumer type check of `npm run check:package` passes `undefined` to a set of props. Where React Aria or the table engine refuses `undefined`, the props go through `defined()` (`src/utils/defined.ts`), which drops the `undefined` keys.
- **Each component's spec lists all four layers**: its tokens, props, part names and blocks. The per-component customisation table in the docs is generated from the source, so it cannot go out of date. Its token table gives each token's default, and lists a token under the component whose name it carries (`--umbra-icon-button-badge-size` under `IconButton`, though `Button`'s stylesheet reads it); the short names that are not a component's own (`table`, `shell`, `scroll`, `section`) are a list in `scripts/build-customisation.mjs` (2026-10-11).

**Rejected**: props only (prop bloat; unusual cases stay impossible). Building blocks only (simple cases need too much code).

## Prop names (added in the integration pass, 2026-10-10)

The same idea has the same name in every component. New components follow this list.

| Idea | Name |
|---|---|
| A press | `onPress`. A row or point chosen from a collection: `onAction(id)`. Never `onClick`. |
| State flags | `disabled`, `readOnly`, `invalid`, `required`, `loading`, `selected`, `checked`, `pressed`, `open`, `collapsed`. No `is` prefix. |
| A changing value | `value` / `defaultValue` / `onChange`. Other state: `<name>` / `default<Name>` / `on<Name>Change` (`collapsed`, `open`). |
| Lists of ids | `<what>Ids`: `selectedIds`, `hiddenIds`, `expandedIds`. Items are identified by `id`; the type of one is `<Component>Id` (`ListId`). The change callback names the idea, not the prop: `onSelectionChange`, `onHiddenChange`, `onExpandedChange` (recorded 2026-10-11; `List`, `Menu`, `DataTable`, `Legend`, the charts and `VerticalNav` already agree). |
| Heading level | `headingLevel` |
| Stepping through a sequence | `previousLabel` / `nextLabel`, and the parts `previous` / `next`: `Stepper`, `EntitySwitcher`, `HorizontalScroller`, the `Planner` toolbar, the steps of a `Spotlight` (its `backLabel` became `previousLabel`, 2026-10-11). The history is another idea and keeps `backLabel` / `forwardLabel` (`HistoryButtons`, `TopBar`, `PageHeader`, the pages of the `CommandPalette`). |
| What did not fit | The menu of actions that do not fit: `moreLabel` (`Card`, `SectionTitle`, `PageHeader`, `GroupHeader`, `TopBar`, and since 2026-10-11 `MediaCard` and the `Planner` toolbar). A count of things left out: `hidden<What>Label(count)` (`hiddenColumnsLabel` of `DataTable`, `hiddenItemsLabel` of `Planner` and `WeekStrip`). |
| A built-in string | `<what>Label` with an English default: `moreLabel`, `closeLabel`, `emptyLabel`, `retryLabel` |
| Text of a number | `formatValue` |
| Size | `size` is the share of the parent's space on a layout child, and the control size elsewhere. A layout child that also has a control size names it for the part: `tabSize`, `itemSize`. Values: a control is `default` / `small` (and `large`); a mark that sits in text or in a row (`Avatar`, `EntityIcon`, `StatValue`, `SequenceDots`) is `sm` / `md` / `lg` (recorded 2026-10-11: two scales, by kind, already so in tier 1). |
| Colour by meaning | `tone`; a free colour is `color`. `variant` is the shape or look. |
| Router link | `renderLink(props)`. `props` is one exported type, `LinkRenderProps`, on every component that has it. |
| Accessible name of an element with no visible name | `aria-label` (and `aria-labelledby` where another element names it). On every component: the charts, `Menu`, `Popover` and `ScrollArea` took `label` until 2026-10-11. `label` is kept for text that is also shown (a `Button`, a `FormField`, a tab of `Columns`) and for the names of inner controls (`closeLabel`, `moreLabel`). |
| Number of placeholder rows while loading | `skeletonRows` (`List`, `DataTable`, `KeyValueList`, `Legend`, `Comparison`, `EntitySwitcher`). Where the placeholders are not rows (cards of a `WidgetBoard`, items of a `HorizontalScroller`): `skeletonItems` (recorded 2026-10-11). |
| Height of a component that fills its slot | `height`: `fill` (default; the content's height where there is none to fill), `content`, or pixels. `DataTable`, `List`, the charts (`src/internal/height.ts`). |
| Loading, empty, error | `loading`, `empty`, `error`, `onRetry`, `retryLabel` (`src/internal/dataState.tsx`) |
| Colour by value | `thresholds`: one shape on every component, and `lowerIsBetter` for a scale where low is good (decided 2026-10-11, below). |

## Root attributes (decided 2026-10-11, integration pass of Milestone 2)

Every component hands `id`, every `data-*` and every `aria-*` attribute it is given to its root element, the one that carries `data-umbra`. TypeScript accepts such attributes on any component, so dropping them was silent: a `Spotlight` step that targeted `[data-tour]` on a `Card` was skipped.

| Piece | Decision |
|---|---|
| Helper | One: `passThrough(props)` (`src/utils/passThrough.ts`). Spread first on the root, so the component's own `data-umbra`, state attributes and managed ARIA win. |
| `id` | `RootAttributes` adds it to the root props of a component that had none. A field keeps its `id` on the focusable element, as before, where the `<label>` points. |
| Named ARIA props | An `aria-label`, `aria-labelledby` or `aria-describedby` that a component takes as a prop goes where it went (the focusable element of a field, the image of a chart). The pass-through carries the rest. |
| Check | `tests/visual/root-attributes.spec.ts` renders every exported component with an attribute and looks for it on the root; a unit test fails when an exported component is missing from its list. |

## Controls among actions that overflow (decided 2026-10-11, integration pass of Milestone 2)

A row of actions that no longer fits moves into a "more" menu (`ActionsOverflow`). A menu holds rows only: a `Button`, an `IconButton`, a `Menu`, a `SplitButton`. Anything else drawn into it broke the menu and the page (a `Stepper` or a `Slider` in a card header).

| Piece | Decision |
|---|---|
| What moves | What can be a row of a menu carries a static `overflowsToMenu = true`: `Button`, `IconButton`, `Menu`, `SplitButton`. A plain element around them (`<div>`, `<span>`) gives way to what it holds. |
| What stays | Everything else, before the "more" button, as the same element: its state and the focus survive the change. A control that cannot be a row carries a static `staysInRow = true`: `Stepper`, `Slider`, `StarRating`, `ColorScaleEditor`, `EntitySwitcher`, `Select`, `TextField`, `SearchField`, `Toggle`, `Checkbox`, `SegmentedFilter`. What is no action at all stays too: a `Tag`, a plain element that holds no component, text (2026-10-11, review 3: a `Tag` in the menu took the whole app down). With nothing that can move there is no button. If what stays still does not fit, the row clips it. |
| Inside an app's component | The row cannot see into a component of the app, so what is inside says what it is (2026-10-11, review 3; before, such a component always went into the menu, where a control drew nothing or broke it). The component is drawn in the row first; a button in it reports `row`, a marked control reports `stays` (`ActionProbeContext`, `useActionKind`). It moves into the menu only when it was seen to hold buttons and no control; otherwise it stays, and its control keeps working. |
| What `actions` may hold | Anything. Recommended: buttons, menus, and at most one small control. A component of the app among them renders one button (or `Menu`, or `SplitButton`) and nothing beside it: one that renders a button together with an icon, a `Tag` or text of its own cannot be drawn as a row, and is left out of the menu (never an error: `RowBoundary` in `Menu.tsx`). A development warning names the rule whenever something is kept or left out for this reason. |
| Hosts | Every host renders its actions through `ActionsOverflow` always, with `shrunk`; a host without a row of its own to measure uses `ActionsRow` (`MediaCard`, the `Planner` toolbar). |

## Thresholds (decided 2026-10-11)

Every component that colours by value takes the same `thresholds`: `ValuePill`, `ProgressBar`, `LevelMeter`, `BarChart`, `DonutChart`, and what `ColorScaleEditor` will produce. There were four shapes.

| Piece | Decision |
|---|---|
| Type | `Threshold = { from: number; tone?: ThresholdTone; color?: string; label?: string }`, in an ascending list: "from this value up, until the next entry". `src/utils/thresholds.ts`, exported from `umbra-ui` and again from `umbra-ui/charts`. |
| `tone` | `ThresholdTone` = the six tones of `Tone` plus `ramp-1` to `ramp-5`, the steps of the value ramp. One member, not a `tone` and a `level`: there is no question of which wins. `MeterTone` and `DonutTone` are `default` plus `ThresholdTone`, so every tone is drawn by every component. |
| `color` | Any CSS colour; wins over `tone`, as everywhere. With neither, the band keeps the component's own colour and only adds its label and cue. |
| Prop type | `ThresholdList` = `readonly Threshold[]` or `readonly number[]`. |
| Shorthands | Plain numbers are boundaries spread on the value ramp (`rampThresholds`: four give the five steps, one gives `ramp-1` and `ramp-5`); a value below the first is `ramp-1`. Accepted by every component, not only `ValuePill`. `ProgressBar` also keeps `true`: thirds of its scale, danger, warning, success. Both resolve to a `Threshold[]`. |
| Resolver | `resolveThreshold(value, thresholds, { lowerIsBetter })` returns the band (`index`, `count`, `from`, `label`, `tone`, `color`, `cue`, `level`, `look`) or `undefined` (no value, no list, below the first `from`). Public: an app colours its own cell with the rule the components use. A value at a `from` belongs to that band. An unsorted list is sorted, with one warning in development. |
| Low is good | `lowerIsBetter` on every component (`ProgressBar` had `invert`, `ValuePill` had `ramp="lower-is-better"`). A boolean that names the meaning. It mirrors the looks over the bands; `from` and `label` stay. |
| Cue that is not colour | Never taken from the colour, so a free `color` has one: the resolver gives each band a `cue` (its position, mirrored with `lowerIsBetter`), and the component draws its own cue by it. `ProgressBar`: a hatch (the top band solid). `BarChart`: solid, stripes, dots in turn. `ValuePill`: the value itself, and the level marker. `LevelMeter`: taller ticks where bands start. `DonutChart`: the number in the centre. All of them: the `label`. |
| `label` | Joins the value: visible text in `ProgressBar` and `LevelMeter` ("80% · High"), tooltip and `aria-valuetext` there, tooltip and point name in the charts, hover and screen reader text in `ValuePill`. No legend is built from it. |
| Extras | A component may extend the type with optional members only, so one list fits all: `BarThreshold` adds `marker` (the fill). `LevelMeter`'s `zones` (with a `to`) became `thresholds`. |
| State for CSS | `data-band` (the band's position, from 0) on the pill, the bar, the meter, each chart bar and the donut's segment. `tests/visual/thresholds.spec.ts` holds that one list gives the same bands everywhere. |

`ColorScaleEditor` emits a `Threshold[]`, ascending, each entry with `from` and a `color` or a `tone`, and a `label` when the user named the band. Its value is JSON-safe: the first `from` is the bottom of its scale, never `-Infinity` (which only the number shorthand produces).

**Rejected**: a `level: 1..5` member beside `tone` (two ways to say a colour); a required `to` (gaps are an entry with no tone); patterns chosen per colour (a free colour would have none).


## Tokens and portals (added 2026-10-11, fix pass of review 2, SL-11)

An overlay is rendered in a portal, outside the element it was opened from. What a scope sets (`UmbraProvider`, `UmbraScope`, a `TopBar` with a `brand`) has always reached it: every overlay repeats the scope's attributes. A token set in a stylesheet or a `style` on a plain ancestor did not: `--umbra-menu-bg` on a toolbar coloured no menu, `--umbra-entity-switcher-picker-width` on a header sized no picker.

- **Decided: the overlay takes the tokens of the place it was opened from.** When a popover opens, every `--umbra-*` property whose value at its anchor differs from the value the overlay has is written on the overlay (`carryTokens`, `src/overlays/shared.ts`). One hook, `usePopoverRef` (`src/overlays/popoverRef.ts`, apart from `shared.ts` so that a `Card` or a tooltip does not load the popover with it), does it for every popover of the library: `Popover` (and with it the picker of an `EntitySwitcher` and the popover of a collapsed card), `Menu`, the list of a `Select`, the suggestions of a `SearchField`.
- **Rejected: rendering the overlay inside the nearest scope element.** It only helps for tokens set on a scope, which already arrive, and an overlay inside a card or a bar is clipped by it and positioned against it (a size container is the containing block of what is fixed inside it).
- Only what differs is written, so an overlay opened from a place with no token of its own carries nothing. `--umbra-slot-min-height` is left out: it belongs to each layout child.
- Limits: the tokens are read once, when the overlay opens; a tooltip takes the scope's tokens only. Chromium lists custom properties in `computedStyleMap()` and Firefox in `getComputedStyle()`: both are read (`scripts/check-browsers.mjs` holds the note).
- Test: `tests/visual/shell-layout-tier2.spec.ts`, "SL-11", for the four.
