# ShortcutsSheet

**Tier** 2 · **Group** Overlays · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

The help overlay for the keyboard: every shortcut of the provider's registry, with its keys written for the platform, in groups, with a search. Opened by `?`, by a button, or by the app.

## Not for

- Running a shortcut: use the `CommandPalette` (`includeShortcuts`), which lists the same shortcuts as commands.
- The key of one control: the `shortcut` prop of a button, menu row or tooltip shows it in place.
- General help or documentation: use a `Modal`.

## Evidence

Not in the screenshots. The library's own design (`plan/interaction.md`, "Keyboard", rule 3).

## Anatomy

| Part | Content | Default |
|---|---|---|
| root | a `Modal` (dialog or drawer) | — |
| `header` | title, optional description, close button | shown |
| `search` | a text field with the search icon and a clear button | shown |
| `columns` | the sections, in as many columns as fit | shown |
| `section` / `sectionTitle` | a group and its heading | per group |
| `item` | `label` and `keys` | one per shortcut |
| `keys` | one or more combinations, each key a `key` cap, with "or" between alternatives | shown |
| `empty` | "No shortcuts match" | when the search matches nothing |

Order of the sections: the app's groups in the order they were registered, the app's shortcuts without a `group` ("Shortcuts"), the library's own ("General"), then the `extra` sections.

## Variants and states

| Variant | How |
|---|---|
| dialog | default: a panel in the middle, `size="lg"` |
| drawer | `variant="drawer"`, `side`: a sheet on an edge, as tall as the window |
| filtered | text in the search: lines whose label, keys or section match every word |
| nothing found | the `empty` part, announced |

## Customisation

### 1. Tokens

`--umbra-shortcuts-sheet-column-width` (260px), `--umbra-shortcuts-sheet-column-gap`, `--umbra-shortcuts-sheet-row-height` (the table row height of the density), `--umbra-shortcuts-sheet-border` (line under a row), `--umbra-shortcuts-sheet-section-font`, `--umbra-shortcuts-sheet-section-color`, `--umbra-shortcuts-sheet-key-bg`. The panel takes the `Modal` tokens.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `open`, `defaultOpen`, `onOpenChange` | | closed | |
| `trigger` | node | — | A button that opens it |
| `shortcut` | shortcut id \| `null` | `umbra.shortcutsSheet` | The shortcut that opens and closes it |
| `extra` | list of `{ title, items: { id?, label, keys }[] }` | — | Sections for keys that are not in the registry; `keys` is one combination or a list of alternatives |
| `defaultQuery` | string | `''` | The search text it opens with |
| `variant` | `dialog` \| `drawer` | `dialog` | |
| `side` | `start` \| `end` \| `bottom` | `end` | Edge of a drawer |
| `size` | as `Modal` | `lg` | |
| `height` | `auto` \| `fill` | `auto` | `fill` keeps the height while filtering |
| `title`, `description` | node | "Keyboard shortcuts", — | |
| `headingLevel` | 1 to 5 | 2 | Sections are one level below |
| `searchLabel`, `searchPlaceholder`, `clearLabel`, `closeLabel`, `emptyLabel`, `ungroupedLabel`, `reservedLabel`, `orLabel` | string | English | |

### 3. Parts

`header`, `search`, `section`, `item`, `empty`.

### 4. Blocks

`ShortcutsSheet.Columns`, `ShortcutsSheet.Section` (`title`, `headingLevel`), `ShortcutsSheet.Item` (`label`, `keys`, `orLabel`), `ShortcutsSheet.Keys` (`keys`, `orLabel`; also usable in a sentence). The all-in-one is these inside the blocks of `Modal` (`Modal.Root`, `Modal.Header`, `Modal.Toolbar`, `Modal.Body`); a hand-built sheet puts them in a `Modal` of its own.

## Behaviour as space shrinks

1. The sections flow into as many 260px columns as the panel holds: two in the default size, one below about 580px of panel width. A section is never split over two columns.
2. In a line the label truncates with an ellipsis; the keys are always whole.
3. The list scrolls inside the sheet. The header and the search stay in view.
4. Below the minimum window the panel follows `Modal`: it fills the window, so the columns are as many as the window holds (three at 900px, one at 560px).

## Interaction and accessibility

- **Opening.** `?` (the reserved shortcut `umbra.shortcutsSheet`) toggles it while a sheet is mounted; with none mounted the key is left to the browser. A bare key never fires while the user types in a field, so `?` typed in a field, the sheet's own search included, is text. An app rebinds it by registering a shortcut with the same id; `shortcut={null}` binds none. `trigger` is a button that opens it, and `open` lets anything else do so (a menu row, a command).
- **Content.** One source with the command palette (`useShortcutList`, `src/provider/`): every shortcut that has a label, owns its keys and has something to run now. Of two shortcuts on the same keys only the winner is listed; a library default that lost its keys to the app, or whose component is not mounted, is not. Keys are written per platform (`Ctrl` `K`, or `⌘` `K`), one cap per key.
- **A `Modal`**: focus is trapped, starts in the search, Escape closes, focus returns to where it was. The search is a plain text field: no arrow-key list, since the lines are not actions.
- **Search**: every word must be in the label, the keys as written (`ctrl+k`) or the section title. The result is in a `status` region: "No shortcuts match" is spoken.
- **Structure**: each section is a `region` named by its heading, with a list of lines; keys are `kbd` elements.
- **Layers**: a modal, so above popovers; a popover it was opened from closes or is out of reach under it. The command palette opens over it (they stack) and returns the focus to it.
- Right to left: the modal's rules; keys keep their order.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **Built on `Modal`**, with `variant="drawer"` as the side sheet: one focus trap, one layer, one set of tokens. No second overlay kind.
- **Key** `?`, as reserved (decision 5 of `plan/reviews/milestone-2.md`).
- **Groups**: a new optional `group` on `Shortcut` (a public addition to a provider type). The library's own shortcuts are a group of their own, by id, so one the app rebinds stays there unless the app gives it a `group`.
- **Only what would run** is listed, as in the palette: a key that does nothing is not help. The provider now tells the lists when a component binds or unbinds a shortcut, so both are current.
- **Key caps**: one look, `src/internal/Kbd.tsx`, taken from the footer of the command palette, which now uses it. Menu, tooltip and palette row hints stay plain text: they are hints inside a control, not a reference.
- **`extra`** takes sections of `{ label, keys }` for component keys (arrow keys of a table). Alternatives are a list.
- **Palette and sheet stack**: the palette opens over the sheet; nothing is closed. It is how the palette behaves over every modal.
- **`defaultQuery`**: added so that a help button can open the sheet on one topic.
- No new icon: the search uses `search`.

Weaker than it could be:

- The search is a plain "contains every word": no ranking and no fuzzy match, unlike the palette.
- `extra` items are not checked against the registry: an app can list a key twice.
- **The root carries `data-umbra="shortcuts-sheet"`** (review 2, OP-9, 2026-10-11), not `modal`: a component built on `Modal` is found by its own name, as an `IconButton` is not a `button`. `ConfirmDialog` carries `confirm-dialog` for the same reason. Both keep every state attribute of the modal's panel (`data-variant`, `data-size`, `data-side`).
- **A key is found by its name as well as by its sign** (review 2, OP-11): "arrowup" finds "↑", "shift" finds "⇧". The name matches from its start, so "row" does not find `ArrowUp`.
