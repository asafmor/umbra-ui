# Tabs

**Tier** 1 · **Group** Inputs · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Switches between views of the same content area. The tab list takes its own height and the selected panel fills the rest of the slot. The same tab strip is what `Columns` shows below the minimum window.

## Not for

- Filtering one list without changing the view: use `SegmentedFilter`.
- Navigating between pages: use `SubNav` or `PrimaryNav`.
- Sections that are all visible at once: use `SectionTitle` or cards.
- Steps that must be done in order: a later `Stepper`.

## Evidence

Underline, large text, above a card or in a modal header (3, 9, 10, 20, 21, 26, 29). Separate filled buttons with counts, "Actions (5)" selected (11) and with icons (15). Joined buttons, one filled (8, 22, 23, 28, 35). No source tab is vertical, closable or scrolls; those are the library's own additions.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `list` | the tab strip and the `end` slot | shown |
| `tab` | one tab: icon, label, count, close button | one per entry of `items` |
| `icon` | icon before the label | shown when the tab has an `icon` |
| `label` | the text | shown; hides when the tab shrinks to its icon |
| `count` | a number in parentheses | shown when the tab has a `count` |
| `close` | button that closes the tab | shown when `onClose` is set and the tab is closable |
| `indicator` | the mark of the selected tab, which slides between tabs | shown |
| `more` | button of the menu that holds the tabs that do not fit | shown at the last shrink step only |
| `end` | controls after the tabs, outside the tab list | hidden |
| `panel` | the content of one tab | the selected one |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `underline` (default), `pill`, `button-group` | Text with a bar; separate rounded buttons; joined buttons |
| `orientation` | `horizontal` (default), `vertical` | `vertical` puts the list beside the panel |
| `tabSize` | `default`, `small` | The height follows the density level; `small` is the height of a small button |
| `fullWidth` | boolean | The tabs share the width of the list |
| `activation` | `automatic` (default), `manual` | Whether arrow keys select |
| `keepMounted` | boolean | Panels that are not selected stay mounted and hidden |

States: selected, hover, pressed, focus, disabled tab, closable tab, nothing selected.

Selected is never colour alone. `underline`: a bar under the tab (beside it when vertical) and a heavier label. `pill`: the violet fill, a light ring inside it and a heavier label. `button-group`: the violet fill, a bar under the label and a heavier label.

There is no loading, empty or error state: a panel shows those through the data component inside it.

## Customisation

### 1. Tokens

`--umbra-tabs-height`, `--umbra-tabs-padding-x`, `--umbra-tabs-gap` (between list and panel), `--umbra-tabs-fg`, `--umbra-tabs-bg`, `--umbra-tabs-border`, `--umbra-tabs-radius`, `--umbra-tabs-pill-radius`, `--umbra-tabs-selected-bg`, `--umbra-tabs-selected-fg`, `--umbra-tabs-underline-selected-fg`, `--umbra-tabs-indicator-color`, `--umbra-tabs-vertical-max-width`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | `{ id, label, icon?, count?, disabled?, closable?, content? }[]` | — | The tabs and their panels. Leave out to compose the blocks. |
| `value` / `defaultValue` | string \| `null` | first tab that is not disabled (with `items`) | The selected tab |
| `onChange` | `(id) => void` | — | Called when the user selects another tab |
| `variant` | see above | `underline` | |
| `orientation` | see above | `horizontal` | |
| `tabSize` | `default` \| `small` | `default` | |
| `fullWidth` | boolean | `false` | |
| `activation` | see above | `automatic` | |
| `keepMounted` | boolean | `false` | |
| `onClose` | `(id) => void` | — | Makes tabs closable. The app removes the tab. |
| `closeLabel` | string | "Close" | First word of a close button's name |
| `moreLabel` | string | "More tabs" | Name of the button that opens the menu of tabs that do not fit |
| `end` | node | — | Controls after the tabs, for example an "add" button |
| `aria-label` | string | — | Names the tab list |
| `size` | number \| `"content"` | `1` | Share of the parent's space, as on every layout child |
| `priority`, `minHeight`, `minWidth`, `label` | — | — | The other slot props (see `Columns-Stack.md`) |

### 3. Parts

`list`, `tab`, `panel`, `indicator`, `icon`, `count`, `close`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props. `Tabs.Tab` takes `icon`, `count` and `close` itself, and `Tabs.List` takes `indicator`.

### 4. Blocks

`Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`. `Tabs.Root` holds the state and is the layout child; the list and the panels may sit anywhere inside it, also apart. Tabs inside a card: `Tabs.Root` around the `Card`, `Tabs.List` in `Card.Toolbar`, the panels in the body.

## Behaviour as space shrinks

For a horizontal list:

| Step | Trigger | Result |
|---|---|---|
| 1 | The tabs are wider than the list | The counts hide. They are still read with the label. |
| 2 | Still wider | A tab with an icon shows the icon only. Its label stays as its accessible name. A tab without an icon keeps its label. |
| 3 | Still wider | The tabs that do not fit move into a "more" menu, opened by a button after the list (`moreLabel`). The selected tab always stays in the list: it takes the last place that fits, and the menu still lists it, with a check. Choosing a row selects that tab. A tab in the menu cannot be closed from there; select it first. |

A vertical list has no steps: its labels truncate with an ellipsis at the list's maximum width (40% of the tabs), and a list taller than its slot scrolls with faded edges. The panel clips; scrolling belongs to the card or `ScrollArea` inside it.

## Interaction and accessibility

- The ARIA tabs pattern: `tablist`, `tab`, `tabpanel`. A tab points at its panel with `aria-controls` while that panel is in the document; a panel is named by its tab.
- One tab stop (the selected tab), then the panel. Left and Right (Up and Down when vertical) move between tabs and wrap; Home and End jump. A disabled tab is skipped.
- `automatic`: moving focus selects. `manual`: Enter or Space selects.
- A closable tab closes with its button or with Delete (announced through `aria-keyshortcuts`). After Delete, focus moves to the next tab, or the previous one.
- A close button may not be inside a `tablist`. With `onClose` set, the `tablist` is an empty element that owns the tabs through `aria-owns`, and the close buttons stay beside their tabs.
- The indicator slides to the newly selected tab in 180ms; with reduced motion it moves at once. It never slides when the list is resized.
- A tab with a count and a text label is named "Orders, 12".
- The focus ring is drawn inwards, because the list clips.
- `Tabs.Root` starts a new layout context: a `Card`, `Stack` or `Columns` in a panel belongs to the tabs.

## Open questions

None.

Resolved 2026-10-10:

- `size` is the share of the parent's space, as on every layout child; the size of the tabs themselves is `tabSize`.
- Built on plain elements with the library's own roving focus, not on React Aria's `Tabs`: that component cannot take ids from outside (which `Columns` needs for its panels), keep a close button out of the tab, or place the list and the panels in different parts of a card.
- The tab strip of `Columns` is this component's list and tab, in the `underline` variant.
- With `items`, the first tab that is not disabled is selected when nothing else is, also after the selected tab was closed. With blocks, `defaultValue` or `value` says which.
- The close button is not a tab stop; the keyboard uses Delete. A screen reader reaches the button by browsing.
- The underline bar is the text colour, not violet: violet has less than 3:1 against the page.
- `pill` is fully rounded, to tell it from `button-group`; `--umbra-tabs-pill-radius` changes it.
- A panel is always a tab stop (`tabindex="0"`), so a panel without controls can be read and scrolled by keyboard.
- An item without `content` gets no panel; the app shows the content itself.
- No loading, empty or error state.
- Step 3 is a "more" menu (the public `Menu`), not scrolling. Its button sits outside the `tablist` (which may only hold tabs) and is the tab stop after it. Fade-scrolling stays only for a vertical list. The tab strip of `Columns` gets the same menu.

Resolved 2026-10-11 (review 2):

- **Right to left** (F9): the arrow keys follow what is drawn, the shrink steps run (the test for the last tab knows which edge is the end), "more" is at the end of the strip, and the indicator sits on the selected tab. Tested in `tests/visual/rtl.spec.ts`.
- **A panel clips**, so the ring of a control at its edge is drawn inwards (F16).
- **Font loads and resizes** (F2, F17): the "more" menu opens on the first press with no font preloaded, and two width changes in one frame end where one does (`src/internal/useShrinkLevel.ts`).
- **Manual activation** (F30): the tab stop is the selected tab whenever focus is outside the list, not the tab that last had focus.
- **Kept without React Aria** (reviewed 2026-10-11): React Aria's tabs do not allow a close button beside a tab or the "more" step. The cost was hand-made focus, direction and indicator code; all three are now correct in both directions and covered by tests, so the decision stands.
