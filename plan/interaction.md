# Interaction and motion (decided 2026-10-10)

The screenshots are static, so everything here is the library's own rule, approved by the owner. None of it is extracted from the source.

## States

| State | Rule |
|---|---|
| Hover | Surface lightens one step. A surface that carries light or coloured text (primary, accent and danger buttons) darkens one step instead, so the text keeps 4.5:1. Table and list rows highlight across their full width. |
| Pressed | Surface darkens one step. No movement. |
| Selected | Violet fill (fixed colour), always with a second cue that is not colour: a bar, an edge stripe, an outline, a weight change or a check. |
| Focus | 2px light-pink ring, shown for keyboard focus (`:focus-visible`). Never violet, so focus and selected cannot be confused. On a brand bar where pink has less than 3:1, the ring takes the bar's text colour. Inside a container that clips, the ring is drawn inwards. |
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
| Holds or fetches a data set | `List`, `DataTable`, `KeyValueList`, `BarChart`, `LineChart`, `DonutChart`, `RadarChart`, `Legend`, `Card` | `loading`, `empty`, `error`, `onRetry`, `retryLabel`: the props of `src/internal/dataState.tsx`, with the same types and defaults everywhere. `empty` and `error` take text, a node or `{ title, description, icon, action }`; `error` also takes `true` for the default text. `retryLabel` defaults to "Try again". |
| Shows one value handed to it | `StatValue`, `SummaryTile`, `KeyValue`, `ValuePill`, `ProgressBar`, `LevelMeter`, `Tag` | `loading`, and a "no value" presentation when the value is `null` or `undefined`: an em dash (`emptyLabel`, default "—") in place of the value, with nothing drawn that would read as zero. The two meters speak their value, so they also take `noValueLabel` (default "No value") for `aria-valuetext` and the tooltip. No error state: the failure belongs to the container that fetched the value (a `Card` or a `KeyValueList`). |
| Decorative or structural | `Badge`, `Avatar`, `EntityIcon`, `TrendArrow`, `StatusIndicator`, `GroupHeader`, `Banner`, `Link`, `EmptyState`, `ListItem` | None. `Avatar` and `EntityIcon` fall back to initials when their image fails; a `ListItem` is loaded, emptied and failed by its `List`. |

- **Empty**: title and explanation, replaceable. **Error**: announced (`role="alert"`), with a retry button when `onRetry` is given.
- **Focus is never lost in a swap.** When an empty or error state that holds the focus goes away (after Retry, or when data arrives), the focus moves to the first tab stop of the component, or to the component itself when it has none.

## Live updates

- A changed value can flash softly once: green for up, red for down, neutral otherwise. The direction is also shown without colour (a `TrendArrow` or sign) where it matters.
- **Opt-in** per component (`highlightChanges`), off by default. On `DataTable` (per column), `StatValue`, `KeyValue`, `ValuePill`, `SummaryTile`, the `meta` of `ListItem`, and the value text of `ProgressBar` and `LevelMeter`: one shared hook (`src/internal/useChangeHighlight.ts`), so it behaves the same everywhere. The flash plays once over the value's own element and is off under reduced motion; the sign (▲ or ▼, with a text for screen readers) stays for four seconds. Only numbers have a direction: a formatted text flashes neutral unless the number is given as `changeValue`.
- No animated number counting.

## Keyboard

1. **Full navigation.** Every control is reachable and operable by keyboard. Composite components (DataTable, List, Menu, Tabs, SegmentedFilter, Planner) use one tab stop and arrow keys inside.
2. **Command palette.** The TopBar search and `Mod+K` open a `CommandPalette`. The app supplies its entries (pages, entities, actions). Focus stays in its input while the arrow keys move through the results (`plan/specs/CommandPalette.md`).
3. **Shortcut registry.** Apps bind keys to actions through one registry on the provider. The library renders a `ShortcutsSheet` (help overlay) from the registry, shows key hints in menus and tooltips, and resolves conflicts: an app shortcut takes the keys of a library default, and of two app shortcuts on the same keys the last registered wins, each with a development warning (`plan/specs/UmbraProvider.md`, "Shortcut conflicts").
4. **Reserved keys** (decided 2026-10-10). `Mod+K` opens the command palette, `?` the shortcuts sheet, `Alt+ArrowLeft` and `Alt+ArrowRight` go back and forward in the history. A reserved key does nothing, and is left to the browser, while no component that handles it is mounted. The history keys never fire while the user types in a field. An app rebinds a reserved shortcut by registering one with the same id.

## Accessibility

Target: WCAG 2.2 AA. Every story is checked automatically (axe) on every context tint, in CI. Skeletons are decorative and exempt from non-text contrast; the scroll thumb is not. This covers text and non-text contrast on every context tint, keyboard reach, screen-reader names and roles, and a non-colour fallback wherever colour carries data.

## Open details

- Exact skeleton shapes per component.
- The focus ring colour value, once the final palette is set.
