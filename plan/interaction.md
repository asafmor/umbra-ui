# Interaction and motion (decided 2026-10-10)

The screenshots are static, so everything here is the library's own rule, approved by the owner. None of it is extracted from the source.

## States

| State | Rule |
|---|---|
| Hover | Surface lightens one step. Table and list rows highlight across their full width. |
| Pressed | Surface darkens one step. No movement. |
| Selected | Violet fill (fixed colour). |
| Focus | 2px light-pink ring, shown for keyboard focus (`:focus-visible`). Never violet, so focus and selected cannot be confused. |
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

## Loading, empty, error

- **Loading**: skeletons. Every data component has a `loading` prop that renders grey placeholder shapes in the component's final layout, so nothing moves when data arrives. No spinners by default.
- **Empty**: every data component has an empty state (title + explanation, replaceable).
- **Error**: every data component has an error state with a slot for a retry action.

## Live updates

- A changed value can flash softly once: green for up, red for down, neutral otherwise. The direction is also shown without colour (a `TrendArrow` or sign) where it matters.
- **Opt-in** per component (`highlightChanges`), off by default.
- No animated number counting.

## Keyboard

1. **Full navigation.** Every control is reachable and operable by keyboard. Composite components (DataTable, List, Menu, Tabs, SegmentedFilter, Planner) use one tab stop and arrow keys inside.
2. **Command palette.** The TopBar search opens a `CommandPalette`. The app supplies its entries (pages, entities, actions).
3. **Shortcut registry.** Apps bind keys to actions through one registry on the provider. The library renders a `ShortcutsSheet` (help overlay) from the registry, shows key hints in menus and tooltips, and detects conflicts.

## Accessibility

Target: WCAG 2.2 AA. This covers text and non-text contrast on every context tint, keyboard reach, screen-reader names and roles, and a non-colour fallback wherever colour carries data.

## Open details

- Default key bindings the library itself reserves (palette open, shortcuts sheet, history back / forward).
- Exact skeleton shapes per component.
- Size animation for a card collapsed with its caret. Today the caret rotates and the layout changes at once.
- The focus ring colour value, once the final palette is set.
