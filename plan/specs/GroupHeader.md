# GroupHeader

**Tier** 1 · **Group** Data display · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A header row for one group of rows inside a list or table: a date above its messages, a category with a count and a total.

## Not for

- The heading of a section of a card or page: use `SectionTitle`.
- The header of a card: use `Card` (`CardHeader`).
- A section that collapses with its own body and animation: use `Accordion`.

## Evidence

Date strips above messages (1, 2, 13–16, 25, 27, 28, 30): full-width, slightly lighter band, small text. A group with a name, a role and a right-aligned count (7). Icon, title with count, and a total (31). Small bold group labels above three rows (29). The reference screen (`plan/reference/index.html`, `.group`) shows the strip.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `toggle` | caret button that collapses the group | shown when `collapsible` |
| `icon` | leading icon | hidden |
| `title` | the group's name, a heading | shown |
| `count` | number of rows, in brackets | hidden |
| `meta` | trailing text, for example a total | hidden |
| `actions` | trailing controls | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `strip`, `plain` | `strip` is the full-width band (source: date headers); `plain` has no fill and a bold title (source: 29) |

States: `collapsed`, `sticky`.

## Customisation

### 1. Tokens

`--umbra-group-header-bg`, `--umbra-group-header-color`, `--umbra-group-header-font`, `--umbra-group-header-height`, `--umbra-group-header-padding-x`, `--umbra-group-header-focus-offset` (the ring offset of the controls in the header, inwards by default because the row clips). The height follows the density level.

`--umbra-group-header-focus-offset` is the default offset of the rings inside (inwards, because it clips), passed on as the private `--focus-offset`: `--umbra-focus-offset` set by the app on any ancestor wins over it (2026-10-11).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `title` | node | — | The group's name |
| `icon` | node | — | Leading icon |
| `count` | number | — | Shown after the title |
| `meta` | node | — | Trailing text |
| `actions` | node | — | Trailing controls. They move into an overflow menu when they do not fit. |
| `moreLabel` | string | "More actions" | Name of the overflow menu button |
| `variant` | see above | `strip` | |
| `headingLevel` | 2–6 | 3 | Heading level of the title |
| `sticky` | boolean | `false` | Sticks to the top of the scroll area while its group scrolls |
| `collapsible` | boolean | `false` | Adds the caret button |
| `collapsed` / `defaultCollapsed` / `onCollapsedChange` | boolean / boolean / function | — | Controlled or uncontrolled collapse |
| `collapseLabel` / `expandLabel` | string | "Collapse" / "Expand" | Accessible name of the caret; a text title is added ("Collapse Today") |

### 3. Parts

`toggle`, `icon`, `title`, `count`, `meta`, `actions`.

### 4. Blocks

`GroupHeader.Root`, `GroupHeader.Toggle`, `GroupHeader.Title`, `GroupHeader.Count`, `GroupHeader.Meta`, `GroupHeader.Actions`.

`GroupHeader.Root` has two props the all-in-one component does not: `ref` (the element, for measuring) and `truncate` (default `true`: the title may truncate; the all-in-one component turns it off until `meta` has hidden and the actions are in the menu).

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | Header narrower than its content | `meta` hides |
| 2 | Still too narrow | `actions` move into an overflow menu behind a "more" button (`moreLabel`), as in a card header |
| 3 | Still too narrow | `title` truncates with an ellipsis; `count`, the "more" button and the caret stay |

## Interaction and accessibility

- The title is a heading (`headingLevel`).
- The caret is a button with `aria-expanded`; `Enter` and `Space` toggle it. Its name includes a text title, so several carets in one list are told apart. Collapsed, it points at the title: right in a left-to-right page, left in a right-to-left one.
- The header only reports the collapse; the owner of the rows hides them. `List.Group` does this by itself.
- `sticky` needs the header and its rows to share a parent element, so the header leaves with its group.
- The caret rotates in 180ms; the rows appear and disappear at once.
- Inside a `List`, the header is the row header of its group, and the group is named by its title. Its caret and actions are stops of the list's keyboard model: reached with the arrow keys and with Tab (`List.md`).

## Open questions

None.

Resolved 2026-10-11 (review fixes):

- The caret button carries `data-part="toggle"` (it had none), and `GroupHeader.Toggle` takes `className` and `style`. The attribute is set on the element after it mounts, because the internal button passes none; a wrapper element was tried and moved the button by a pixel in a `DataTable` cell.
- `GroupHeader.Root`'s `elementRef` is now `ref`, as on `Legend.Root`; `ref` and `truncate` are public and documented above (review B23).
- A `plain` header in a `List` with sticky headers is opaque (review B4): the list sticks the row around the header, so the header's own `sticky` rule never applied.

Resolved 2026-10-10:

- Added `icon` and the `plain` variant, both from the evidence (31, 29).
- The count is shown in brackets, as in the source.
- Actions move into an overflow menu before the title truncates, the same way `Card` header and `SectionTitle` actions do (integration pass; this replaces the earlier decision to keep them in the row). Each `Button` and `IconButton` becomes a menu item.
- The collapse is not size-animated, like `Card`.
