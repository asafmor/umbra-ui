# Interaction and motion (decided 2026-10-10)

The screenshots are static, so everything here is the library's own rule, approved by the owner. None of it is extracted from the source.

## States

| State | Rule |
|---|---|
| Hover | Surface lightens one step. A filled surface (primary, accent and danger buttons, a selected fill) darkens one step instead, so the text keeps 4.5:1; a derived fill is chosen so that this holds for light and for dark text on it. Table and list rows highlight across their full width. |
| Pressed | Surface darkens one step. No movement. |
| Selected | A fill in the interaction colour (violet by default; derived from the brand or set by the app, `decisions/08-theming.md`), always with a second cue that is not colour. Which cue, by kind of row (changed 2026-10-11, owner's O-4): **a row of data** (`ListItem`, a `DataTable` row) has the edge stripe; **a chosen option** (`Select`, a checked `Menu` row, `EntitySwitcher`) has a check and no stripe; **the current page** (`VerticalNav`, a `current` menu row) is bold with `aria-current` and no stripe; tabs, tiles and segments have a bar, an outline or a ring. |
| Highlighted | The row under the pointer or the arrow keys in a menu, a select list or the command palette: one surface step lighter. Not a selection, so never the interaction fill and no second cue; on a selected row the highlight shifts that row's own fill one step. |
| Focus | 2px light-pink ring, shown for keyboard focus (`:focus-visible`). Never the selected colour, so focus and selected cannot be confused: when the interaction colour is itself close to the pink, the ring takes the primary text colour (2026-10-11). On a brand bar where pink has less than 3:1, the ring takes the bar's text colour. Inside a container that clips, the ring is drawn inwards; inside a selected fill it takes the fill's text colour. |
| Disabled | 40% opacity; no hover or press response. |

## Motion

Character: **crisp and minimal**. Short fades and small slides only; no sweeps, glows or staggered entrances.

| Use | Duration |
|---|---|
| Hover, press | 100ms |
| Popover, menu, tooltip, card collapse | 180ms |
| Modal | 240ms |

- **Easing**: ease-out on enter, ease-in on exit.
- **Reduced motion**: when the system setting `prefers-reduced-motion` is on, all movement is removed and only fades stay.
- **Layout changes** from the rules in `layout.md` (column drop, collapse to header) are instant while the window is being resized, and animated (180ms) when caused by a user click.
- **Card collapse with the caret**: the card's height animates over 180ms, ease-in to collapse and ease-out to expand, and the cards beside it follow frame by frame. The body stays in the page until the collapse has ended. A collapse by the layout, a change of the `collapsed` prop without a press, and everything under reduced motion are instant. Technique and pitfalls: `plan/specs/Card.md`, "The size animation"; for content-sized panels, `plan/specs/Accordion.md`.

## Loading, empty, error

- **Busy controls**: a loading button keeps focus, blocks presses and is announced through a named progress element (`loadingLabel`).
- **Loading**: skeletons, in the component's final layout, so nothing moves when data arrives. No spinners by default.
- **Which states a component has** (decided 2026-10-11) depends on what it holds:

| Kind | Components | States |
|---|---|---|
| Holds or fetches a data set | `List`, `DataTable`, `KeyValueList`, `BarChart`, `LineChart`, `DonutChart`, `RadarChart`, `Legend`, `Card`; tier 2: `Heatmap`, `Scatter`, `Comparison`, `Planner`, `WeekStrip`, `WidgetBoard`, `HorizontalScroller` | `loading`, `empty`, `error`, `onRetry`, `retryLabel`: the props of `src/internal/dataState.tsx`, with the same types and defaults everywhere. `empty` and `error` take text, a node or `{ title, description, icon, action }`; `error` also takes `true` for the default text. `retryLabel` defaults to "Try again". |
| Shows one value handed to it | `StatValue`, `SummaryTile`, `KeyValue`, `ValuePill`, `ProgressBar`, `LevelMeter`, `Tag`; tier 2: `PieIndicator`, `DivergingMeter` (both speak, so both have `noValueLabel`), `Sparkline`, `SequenceDots` and a read-only `StarRating` (each is one picture with a spoken summary: `emptyLabel` and `noValueLabel`), `ScheduleSlot` and `MediaCard` (`loading` only: an empty slot is a variant, a card without a picture draws a placeholder) | `loading`, and a "no value" presentation when the value is `null` or `undefined`: an em dash (`emptyLabel`, default "—") in place of the value, with nothing drawn that would read as zero. The two meters speak their value, so they also take `noValueLabel` (default "No value") for `aria-valuetext` and the tooltip. No error state: the failure belongs to the container that fetched the value (a `Card` or a `KeyValueList`). |
| Decorative or structural | `Badge`, `Avatar`, `EntityIcon`, `TrendArrow`, `StatusIndicator`, `GroupHeader`, `Banner`, `Link`, `EmptyState`, `ListItem`; tier 2: `DateChip`, `ContextBlock`, `Spotlight`, `ShortcutsSheet` | None. `Avatar` and `EntityIcon` fall back to initials when their image fails; a `ListItem` is loaded, emptied and failed by its `List`. |
| An input | `TextField`, `SearchField`, `Select`, `Checkbox`, `Radio`, `Toggle`, `SegmentedFilter`, `Tabs`; tier 2: `Slider`, `Stepper`, `ColorScaleEditor`, `SplitButton`, an editable `StarRating`, `EntitySwitcher` | `disabled`, `readOnly`, `invalid` and `required` where they apply; no data states. `loading` only where the control itself waits: a button that is busy (`SplitButton`, as `Button`), and a control whose list of options is fetched (`Select`, `SearchField`, `EntitySwitcher`). A `Slider`, a `Stepper` and a `ColorScaleEditor` have nothing of their own to wait for: a form that waits disables them (recorded 2026-10-11). |

- **Empty**: title and explanation, replaceable. **Error**: announced (`role="alert"`), with a retry button when `onRetry` is given.
- **Focus is never lost in a swap.** When an empty or error state that holds the focus goes away (after Retry, or when data arrives), the focus moves to the first tab stop of the component, or to the component itself when it has none.

## Forms (decided 2026-10-11, review 1 of Milestone 2)

Every input that takes `name` behaves in a native `<form>` as a native control does, whether React Aria draws it or the library does. One test holds them all to it (`tests/visual/forms.spec.ts`, stories `Integration/Forms`); a new input is added there.

- **Value**: sent under `name`, as it is shown. Without `name`, without a value, or disabled, nothing is sent.
- **Reset**: a native reset brings the starting value back.
- **Label**: a press on the `FormField` label gives the control the focus: the control itself, or the tab stop of a group.
- **Required**: left empty, it holds the form back; the first such control takes the focus, and each shows the browser's message as its field's error (`useReport` in `src/inputs/useField.ts`), until it has a value. An `invalid` set by the app is never overruled by this.
- A control that is not native and not React Aria's (`Stepper`, `ColorScaleEditor`) gets all of it from one hook (`src/inputs/formValue.tsx`).

## Live updates

- A changed value can flash softly once: green for up, red for down, neutral otherwise. The direction is also shown without colour (a `TrendArrow` or sign) where it matters.
- **Opt-in** per component (`highlightChanges`), off by default. On `DataTable` (per column), `StatValue`, `KeyValue`, `ValuePill`, `SummaryTile`, the `meta` of `ListItem`, and the value text of `ProgressBar` and `LevelMeter`: one shared hook (`src/internal/useChangeHighlight.ts`), so it behaves the same everywhere. The flash plays once over the value's own element and is off under reduced motion; the sign (▲ or ▼, with a text for screen readers) stays for four seconds. Only numbers have a direction: a formatted text flashes neutral unless the number is given as `changeValue`.
- No animated number counting.

## Keyboard

1. **Full navigation.** Every control is reachable and operable by keyboard. Composite components (DataTable, List, Menu, Tabs, SegmentedFilter, Planner) use one tab stop and arrow keys inside.
2. **Command palette.** The TopBar search and `Mod+K` open a `CommandPalette`. The app supplies its entries (pages, entities, actions). Focus stays in its input while the arrow keys move through the results (`plan/specs/CommandPalette.md`).
3. **Shortcut registry.** Apps bind keys to actions through one registry on the provider. The library renders a `ShortcutsSheet` (help overlay) from the registry, shows key hints in menus and tooltips, and resolves conflicts: an app shortcut takes the keys of a library default, and of two app shortcuts on the same keys the last registered wins, each with a development warning (`plan/specs/UmbraProvider.md`, "Shortcut conflicts").
4. **Reserved keys** (decided 2026-10-10). `Mod+K` opens the command palette, `?` the shortcuts sheet, `Alt+ArrowLeft` and `Alt+ArrowRight` go back and forward in the history. A reserved key does nothing, and is left to the browser, while no component that handles it is mounted. The history keys never fire while the user types in a field. An app rebinds a reserved shortcut by registering one with the same id.

## Layers and direction (decided 2026-10-11)

- **Layers.** Overlay kinds have a fixed order, as tokens (`plan/tokens.json`, "layer"): popover, menu and select list (`--umbra-layer-popover`), tooltip, modal, spotlight (`--umbra-layer-spotlight`, added 2026-10-11), command palette. A spotlight can therefore point at something inside a modal, and the palette still opens on top; it is rendered into the modal its target is in, and while it is open the popovers and tooltips of its target are lifted above its dim (`[data-umbra-spotlight]`, `src/styles/index.css`). The shortcuts sheet is a modal; the palette opens over it and they stack. Within a layer the overlay opened later is on top. An overlay opened from inside a modal is rendered into that modal, so it is above it. React Aria's portals and the library's own use the same tokens. Every popover and tooltip takes its layer and its container from one hook (`useOverlayLayer`, `src/overlays/shared.ts`), the tooltips the library opens by itself included (`Tip`, `src/internal/TruncatedText.tsx`).
- **Direction.** One source on the provider (`plan/specs/UmbraProvider.md`, "Direction"). The root and every portal carry `dir`; arrow keys in a horizontal composite follow what is drawn; CSS is logical, and icons that point along the line are mirrored.
- **Focus is never lost.** A component that removes or re-renders the element the user is on moves focus first: to its replacement, the control that opened it, or the nearest control that stays (`src/internal/focus.ts`). No interaction leaves focus on `<body>`; the interaction tests assert it after each step.

## Accessibility

Target: WCAG 2.2 AA. Every story is checked automatically (axe) on every context tint, in CI. Skeletons are decorative and exempt from non-text contrast; the scroll thumb is not. This covers text and non-text contrast on every context tint, keyboard reach, screen-reader names and roles, and a non-colour fallback wherever colour carries data.

## Open details

- Exact skeleton shapes per component.
- None on the focus ring colour: `--umbra-color-focus-ring`, light pink, with the two fallbacks under "Focus".
