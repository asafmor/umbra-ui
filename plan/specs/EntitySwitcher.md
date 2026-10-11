# EntitySwitcher

**Tier** 2 · **Group** Shell · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

Shows which entity a header is about (a workspace, a region, a project) and lets the user change it: step to the previous or next sibling, or pick one from a searchable list.

## Not for

- Choosing a value in a form: use `Select`.
- The pages of a section: use `SubNav` or `Tabs`.
- Going back and forward in the history: use `HistoryButtons`.

## Evidence

31 and 33 (start of the sub bar: mark, name, stacked up and down chevrons), 40 (the same, another section), 5 and 30 (beside the mark of a page header, chevrons before the title). The source shows no open list; the picker is this library's addition.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `trigger` | the button that opens the picker: `icon`, `name`, `caret` | shown |
| `icon` | the entity's mark | shown when the current item has one |
| `name` | the entity's name | shown |
| `caret` | a small chevron | shown |
| `steppers` | `previous` and `next`, stacked | shown when there is more than one entity |
| `picker` | the popover: `search`, then the `list` of rows in groups | on press |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `stepperPosition` | `end`, `start` | `start` puts the chevrons before the name, for a page title beside its mark (5) |

States: open, `loading`, an empty list, no match for the search, `disabled`. The current entity's row carries a check and the selected fill.

## Customisation

### 1. Tokens

`--umbra-entity-switcher-gap`, `--umbra-entity-switcher-padding-x`, `--umbra-entity-switcher-radius`, `--umbra-entity-switcher-hover-bg`, `--umbra-entity-switcher-icon-size`, `--umbra-entity-switcher-name-min-width` (how far the name is cut before a step is taken), `--umbra-entity-switcher-stepper-size`, `--umbra-entity-switcher-stepper-direction` (`column`, or `row` for a bar too low for two targets), `--umbra-entity-switcher-picker-width`.

The switcher inherits font and colour, so it reads as a title in a `PageHeader` and takes the text colour of a brand bar. A `SubNav` is 32px high, too low for two stacked 24px targets: it sets the private `--entity-switcher-stepper-direction: row`, which the app's token overrides.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | `EntitySwitcherItem[]` | — | `{ id, label, textValue?, icon?, description?, group?, href?, disabled? }` |
| `value` / `defaultValue` / `onChange` | id / id / function | — | The current entity |
| `onAction` | `(id) => void` | — | Called for every choice, by a row or a stepper, also when it is the current one |
| `wrap` | boolean | `false` | Stepping past the last goes to the first. Otherwise the stepper at an end is disabled |
| `stepperPosition` | see above | `end` | |
| `searchable` | boolean | `true` | Shows the search field in the picker |
| `onSearchChange` | `(text) => void` | — | For an app that loads the matches itself |
| `loading` | boolean | `false` | Skeleton rows in the picker |
| `skeletonRows` | number | 5 | |
| `renderLink` | function | plain `<a>` | For items with `href`: their rows in the picker are links |
| `disabled` | boolean | `false` | |
| `open` / `defaultOpen` / `onOpenChange` | boolean / boolean / function | — | The picker |
| `aria-label` | string | "Switch" | Names the picker and the group of steppers |
| `placeholder` | node | "Choose" | Shown in place of the name while no entity is current |
| `previousLabel` / `nextLabel` / `searchLabel` / `emptyLabel` / `noResultsLabel` | string | English text | Built-in strings |

### 3. Parts

`icon`, `name`, `caret`, `steppers`, `search`, `row`. `row` receives `{ item, current, children }`.

### 4. Blocks

`EntitySwitcher.Root`, `EntitySwitcher.Trigger`, `EntitySwitcher.Steppers`, `EntitySwitcher.Picker`. `Root` holds the state and takes the props above; the three others read it. The trigger and the picker are a public `Popover`, the search a `SearchField`.

## Behaviour as space shrinks

Measured with the shared hook, so it is a function of the width alone.

| Step | Trigger | Result |
|---|---|---|
| 0 | Narrower than its content | The name ends in an ellipsis, down to `name-min-width`; the full name shows in a tooltip |
| 1 | Still too wide | `steppers` hide |
| 2 | Still too wide, or the container says so | The icon only (the caret too when there is no icon). The name is the trigger's accessible name and its tooltip |

The step is `data-shrink` on the root. A `SubNav` takes the switcher to step 2 as its last step, where it hides a plain `label`; a `TopBar` does at its step 4.

## Interaction and accessibility

- The trigger is a button with `aria-haspopup="dialog"` and `aria-expanded`. `Enter`, `Space` or a press opens the picker.
- The picker is a dialog named by `aria-label`. Focus goes to the search field, or to the current row when there is none. `Escape` closes it and focus returns to the trigger.
- In the picker: `ArrowDown` from the search field goes to the first row; `ArrowDown`, `ArrowUp`, `Home` and `End` move through the rows, `ArrowUp` on the first returns to the field. The rows are one tab stop. `Enter` chooses.
- The rows are links (`href`) or buttons, in lists; a group is a list named by its heading. The current row has `aria-current="true"` and a check, so it is not marked by colour alone.
- The steppers are a group of two controls named `previousLabel` and `nextLabel`, each with the target's name ("Previous: Region 1"). They are always buttons, also for items with `href`: the app moves on in `onChange`. At an end without `wrap` a stepper is `aria-disabled` and stays focusable, so the focus is not lost when the last step is taken with the keyboard.
- Each stepper is 24px, the minimum target size.
- Choosing closes the picker.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **The picker is built from public pieces**: `Popover`, `SearchField` and rows of the switcher's own, so a row can be a router link (`renderLink`), which a `List` row or a `Select` option cannot.
- **Filtering is built in** (the text of `textValue` or a string `label`, and a string `description`, without regard to case). `onSearchChange` is for an app that loads matches; it then passes `loading` and new `items`.
- **Groups are a `group` name on each item**, shown in the order they first appear; stepping follows that same order and skips disabled items.
- **Both `onChange` and `onAction`**: `onChange` when the value changes, `onAction` for every choice (decision 07).
- **Disabled ends by default, `wrap` opt-in.**
- **The steppers are buttons, never links.** A stepper that is a link while it has a target and a disabled button at an end would be replaced under the focus when the last step is taken. An app with router links navigates in `onChange`, which fires for a stepper as for a row.
- **`placeholder`** (default "Choose") is shown while no entity is current; "next" then goes to the first.
- **Placement**: `SubNav` gets a `start` slot (`SubNav.Start`); `PageHeader` takes the switcher as its `title`, with the mark in `media`; in a `TopBar` it goes in `TopBar.Start` or replaces the `logo` part.
- **No shortcut hint**: the registry has no reserved keys for stepping, and an app that wants them binds its own to `onChange`.
- **Stacked chevrons need 48px**: they are stacked where there is room and side by side in the 32px `SubNav`, instead of two 16px targets.
