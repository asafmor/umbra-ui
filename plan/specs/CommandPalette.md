# CommandPalette

**Tier** 1 · **Group** Overlays · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A search over everything the app can open or do, in a dialog near the top of the window. Opened by the `TopBar` search trigger and by `Mod+K`. The app supplies the entries.

## Not for

- Choosing the value of a field: use `Select` or a combobox field.
- A short, fixed list of actions on one control: use `Menu`.
- A search that filters the page behind it: use a `TextField` in the page.

## Evidence

Not in the screenshots. The source has a search trigger in the top bar (1, 11, 22); what it opens is the library's own rule (`plan/interaction.md`, "Keyboard").

## Anatomy

| Part | Content | Default |
|---|---|---|
| `search` | `searchIcon`, the breadcrumb of open pages, the input | shown |
| `list` | the results; scrolls | shown when there are any |
| `section` / `sectionHeader` | a group of results and its heading | per `section` |
| `item` | icon, label, description, key hint, page chevron | one per result |
| `loading` | three placeholder rows under the results | while looking up |
| `empty` | "No results" | when nothing matches |
| error state | text and a retry button | when a lookup failed, or with `error` |
| `footer` | the key hints | shown |

A command is `{ id, label, description?, icon?, section?, keywords?, shortcut?, href?, onRun?, disabled?, keepOpen?, children? }`.

## Variants and states

| Source of results | How |
|---|---|
| fixed list | `commands`: filtered and ranked as the user types |
| lookup | `onQuery(text, page)`: called after `debounce`; its results are listed after the fixed matches, as given |
| recent | `recent` (ids): listed first, under "Recent", while the input is empty on the first page |
| registry | `includeShortcuts`: every registered shortcut that has a label, owns its keys and has something to run now, with its keys |
| pages | a command with `children` opens them as a sub-list |

Ranking of the fixed list, best first: the text starts the label; starts a word of the label; is inside the label; is in the keywords or the description; its letters appear in the label in order (three letters or more). Case and accents do not matter. Every word typed must match, and the weakest word gives the rank. Within a rank the given order is kept. Sections appear in the order of their best result.

Row states: active (the row the arrow keys are on: violet fill with an edge stripe), disabled (40%; passed over by the keys). Data attributes: `data-active`, `data-disabled`.

## Customisation

### 1. Tokens

`--umbra-command-palette-width` (640px), `--umbra-command-palette-max-height` (480px), `--umbra-command-palette-offset` (distance from the top), `--umbra-command-palette-bg`, `--umbra-command-palette-border`, `--umbra-command-palette-radius`, `--umbra-command-palette-scrim`, `--umbra-command-palette-item-height`, `--umbra-command-palette-active-bg`, `--umbra-command-palette-active-fg`, `--umbra-command-palette-z-index`. Row height follows the density level.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `commands` | list of commands | — | The fixed list |
| `onQuery` | function (text, page) → commands or a promise | — | Looked-up results |
| `debounce` | milliseconds | 150 | Wait after the last key before `onQuery`. The lookup on opening starts at once |
| `loading` | boolean | `false` | Shows the loading rows (a pending `onQuery` shows them too) |
| `error` | node \| `true` | — | Shows the error state (a failed `onQuery` shows it too, with a retry button) |
| `recent` | list of ids | — | |
| `includeShortcuts` | boolean | `false` | |
| `open` / `defaultOpen` / `onOpenChange` | boolean / boolean / function | — | Controlled or uncontrolled |
| `onRun` | function (command) | — | Called for every command run, after its own `onRun` |
| `navigate` | function (href) | full page navigation | Called for a command with `href`; plug the router in here |
| `shortcut` | shortcut id \| `null` | `umbra.commandPalette` | The key that opens and closes it; `null` binds none |
| `label` / `placeholder` / `resultsLabel` | string | "Command palette" / "Type a command or search" / "Results" | |
| `emptyLabel` / `errorLabel` / `retryLabel` / `loadingLabel` | string | English text | |
| `recentLabel` / `shortcutsLabel` / `backLabel` | string | "Recent" / "Keyboard shortcuts" / "Back" | |
| `moveHint` / `runHint` / `backHint` / `closeHint` | string | "Move" / "Run" / "Back" / "Close" | Footer texts |

### 3. Parts

`searchIcon`, `item` (the content of a row; receives the command and `active`), `sectionHeader`, `empty` (receives the text typed), `footer`.

### 4. Blocks

None. The rows are data, and the pieces around them are parts.

## Behaviour as space shrinks

The panel is 640px wide at most and never wider than the window less its margin; never taller than the window less its offset. The list scrolls inside it; the loading rows, the error and empty text and the footer stay in view. Labels and descriptions truncate with an ellipsis. The footer hints wrap.

## Interaction and accessibility

- A modal `dialog` named by `label`: the page behind is dimmed and inert. A press outside closes it.
- Combobox pattern: focus stays in the input (`role="combobox"`, `aria-controls` the `listbox`, `aria-activedescendant` the active `option`). `ArrowDown` and `ArrowUp` move and wrap; `Home` and `End` go to the first and last; `PageUp` and `PageDown` move by what fits in the list; `Enter` runs the active option. Hover moves the active option; a click runs.
- Running closes the palette unless the command says `keepOpen`. A command with `children` opens its page: the input empties and shows the page's name, and a breadcrumb chip appears. `Backspace` in an empty input, `Escape`, or a press on the chip goes back; from the first page `Escape` closes.
- `Mod+K` (the `shortcut`) opens and closes it. When a `TopBar` holds it, the bar's search trigger owns the key.
- On closing, focus returns to what had it before, as soon as the close starts (2026-10-11). It used to stay in the input for the 240ms of the exit, so a bare-key shortcut pressed right after running a command was taken for typing and ignored. `useReturnFocusOnClose` (`src/overlays/shared.ts`) is shared with `Modal`, which had the same delay.
- It stays on React Aria's modal primitives, not on the public `Modal` (looked at 2026-10-11, now that `Modal` exists). `Modal.Content` brings its own panel: width by `size`, the full-window form below the minimum window, its tokens and `data-umbra="modal"`. The palette is anchored near the top with its own width, height and tokens, so it would have to undo each of them. What the two share is internal instead: the scope attributes on the portal, `useOpenState`, and the focus return.
- Every opening starts from an empty input on the first page.
- Lookups: an answer that arrives after the text changed, or after closing, is dropped.
- Sections are `group`s named by their heading. The loading rows are a `status` named by `loadingLabel`; the empty text is a `status`; the error is an `alert`.
- It renders in a portal and keeps the density, context tint and tokens of where it was placed.
- Motion: the dimmed backdrop fades and the panel slides 8px over 240ms; reduced motion removes the slide.

## Open questions

None.

Resolved 2026-10-10:

- Built on React Aria's `ModalOverlay`, `Modal` and `Dialog` directly: the library's `Modal` did not exist when this was written. It can move onto it later without a change to its props.
- The list is the palette's own markup, not `List`: `List` moves real focus between rows, and here focus must stay in the input.
- Looked-up results are not ranked or filtered again: the app's order is taken as it is.
- `includeShortcuts` leaves out shortcuts with nothing to run (a reserved key whose component is not mounted) and the palette's own.
- `Home` and `End` move through the options and not the caret, as the task asked; the caret still moves with the arrow keys.
- `recent` is a prop only: the app decides what counts as recent and where it is stored (`onRun` tells it what ran).
