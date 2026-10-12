# VerticalNav

**Tier** 1 · **Group** Shell · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Side navigation inside a modal, a settings screen or one column of a page: a vertical list of destinations with one marked as current.

## Not for

- The top-level sections of the app: use `PrimaryNav`.
- The pages of one section, in a row: use `SubNav`.
- Switching views inside a card: use `Tabs`.
- A list of records to pick from: use `List`.
- A menu of actions: use `Menu`.

## Evidence

A column of nine items at the left of a settings modal, a quarter of its width, the selected one filled violet with a bold label (21, 26).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `header` | fixed above the list | shown when `header` is set |
| `list` | the items; scrolls inside when taller than its space | shown |
| `item` | icon, label, badge; a link or a button | one per entry |
| `group` | an item that opens and closes a list of items under it | an entry with `items` |
| `section` | a heading over a run of items | an entry with `type: 'section'` |
| `footer` | fixed below the list | shown when `footer` is set |
| `toggle` | the button that switches to the icon rail and back | shown when `collapsible` |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| full | — | Icon, label, badge |
| rail | `collapsed`, the toggle, or a narrow slot | Icons only. A badge moves to the corner of the icon; a section heading becomes a rule; group carets hide |

States per item: current, hover, pressed, focus, disabled. Per group: open, closed, closed while holding the current item.

## Customisation

### 1. Tokens

`--umbra-vertical-nav-width` (240px as a column of the page; elsewhere the nav fills its container unless this is set), `--umbra-vertical-nav-rail-width`, `--umbra-vertical-nav-rail-below` (160px, in px: narrower than this the nav becomes a rail), `--umbra-vertical-nav-bg`, `--umbra-vertical-nav-fg`, `--umbra-vertical-nav-current-bg`, `--umbra-vertical-nav-current-fg`, `--umbra-vertical-nav-stripe-width`, `--umbra-vertical-nav-row-height`, `--umbra-vertical-nav-radius`, `--umbra-vertical-nav-padding`, `--umbra-vertical-nav-gap`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | `({ id, label, icon?, href?, badge?, disabled?, items? } \| { type: 'section', label, items })[]` | — | One level of nesting |
| `value` / `onChange` | string / function of the id | — | The current item |
| `renderLink` | function | plain `<a>` | The app's router link, for items with `href` |
| `expandedIds` / `defaultExpandedIds` / `onExpandedChange` | string[] / string[] / function | groups holding the current item | Controlled or uncontrolled open groups |
| `header` / `footer` | node | — | |
| `collapsed` / `defaultCollapsed` / `onCollapsedChange` | boolean / boolean / function | `false` | The icon rail |
| `collapsible` | boolean | `false` | Shows the toggle |
| `collapseLabel` / `expandLabel` | string | "Collapse navigation" / "Expand navigation" | Names of the toggle |
| `aria-label` | string | "Section navigation" | Names the landmark |
| `size`, `priority`, `minHeight`, `label` | slot props | `size="content"` | The nav is a layout child. With a number it takes the width of its slot |

### 3. Parts

`header`, `item` (applies to every item, also inside groups and sections), `footer`, `toggle`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`VerticalNav.Root`, `VerticalNav.Header`, `VerticalNav.List`, `VerticalNav.Section`, `VerticalNav.Group`, `VerticalNav.Item`, `VerticalNav.Footer`, `VerticalNav.Toggle`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 0 | Any width | Labels truncate with an ellipsis; the nav is never wider than its slot |
| 1 | Narrower than `--umbra-vertical-nav-rail-below`, and every item has an icon | It becomes the rail by itself (`data-collapsed="auto"`), at the width of its slot; the toggle hides. It returns when the slot is wide enough |
| 2 | List taller than its space | The list scrolls inside; header, footer and toggle stay |

Without an icon on every item there is no rail to switch to, and step 0 is all that happens. Collapsed by the user or the prop (`data-collapsed="user"`), the nav takes the rail width.

## Interaction and accessibility

- The root is a `nav` landmark named by `aria-label`.
- The current item has `aria-current="page"`, the violet fill, and two cues that are not colour: an edge stripe and bold weight. A closed group that holds the current item carries the stripe.
- The list is one tab stop: the focused item, else the current one, else the first. `Up` and `Down` move (no wrap), `Home` and `End` jump. On a group, `Right` opens it and then moves into it, `Left` closes it; on an item of a group, `Left` goes back to the group. `Enter` and `Space` choose.
- A group is a button with `aria-expanded`. It does not navigate.
- A disabled item has `aria-disabled`, keeps its place in the arrow-key order and does nothing.
- In the rail each label stays in the page, hidden from sight only, as the name of its item. The label is also the row's `Tooltip`, opening at the end side on hover and on keyboard focus.
- The toggle is an icon button with `aria-expanded`; header, footer and toggle are tab stops of their own.
- The focus ring is drawn inside the row, because the list scrolls and clips.

## Open questions

None.

Resolved 2026-10-10:

- The radio glyph of the source (21) is not copied: the current item is the library's selected look (violet, stripe, weight).
- One level of nesting. A group only opens and closes; give the overview page its own item inside it.
- In the rail the items of an open group stay, as icons under it; there is no fly-out menu.
- The hover hint in the rail is the public `Tooltip` (integration pass), not the native `title`: it also shows on keyboard focus and takes any label node. A row drawn by the app's own link (`renderLink`) gets it when that link passes its props and ref on to its element.
- The automatic rail keeps the width of its slot instead of shrinking to the rail width, so it can tell when the slot is wide again.
- The rail threshold is a token read by the component, in px.
- Opening a group is not size-animated; the technique of `Accordion` can be applied later.
- The list has no fade at its scroll edges, because the nav has no background of its own to fade into.
- No loading, empty or error state: the nav is structure.

Changed 2026-10-11 (owner's feedback O-3):

- **The nav fills the width of what holds it.** In a card, a modal's side or any other box, its items span the box: the selected fill and the hover area reach both sides, and a badge sits at the end. Before, the nav was 240px wide wherever it was, and in a wider card the items hugged the start. Its own width (`--umbra-vertical-nav-width`, 240px) is for the place where nothing else gives it one: beside other content in a row, which is a `Columns` (known from the stylesheet alone) or a flex row of the app's own (read from the parent's computed style, `data-in-row`). With a `size` weight the slot decides, as before.
