# HistoryButtons

**Tier** 1 · **Group** Shell · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Back and forward, at the start of the `TopBar`. On their own they drive the browser history; given callbacks they drive the app's router.

## Not for

- Paging through a list or a calendar: use `IconButton`s with their own labels.
- Undo and redo: those belong to an `ActionBar`.

## Evidence

11, 22 (two square buttons with chevrons at the far left of the bar, filled a little lighter than the bar; back enabled, forward dimmer), nearly every other screenshot.

## Anatomy

| Part | Content | Default |
|---|---|---|
| back button | `backIcon` | shown |
| forward button | `forwardIcon` | shown |
| entries caret | `entriesIcon`; opens the recent places | shown with `entries` |

## Variants and states

| Mode | How | Enabled when |
|---|---|---|
| browser | no callbacks | the browser's Navigation API says there is somewhere to go; always, where the browser has no such API |
| router | `onBack` / `onForward` | `canGoBack` / `canGoForward` (default `true`) |

Button states are those of `IconButton`. A button with nowhere to go is disabled (40%).

## Customisation

### 1. Tokens

`--umbra-history-buttons-size` (the control height), `--umbra-history-buttons-gap`, `--umbra-history-buttons-bg` (the faint resting fill, 8% of the text colour around them).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `canGoBack` / `canGoForward` | boolean | from the browser, or `true` | |
| `onBack` / `onForward` | function | `history.back()` / `history.forward()` | |
| `entries` | list of `{ id, label, description?, icon? }` | — | Recent places, newest first |
| `onNavigate` | function (id) | — | Called with the chosen entry |
| `backShortcut` / `forwardShortcut` | shortcut id \| `null` | `umbra.history.back` / `umbra.history.forward` | The keys the buttons bind; `null` binds none |
| `backLabel` / `forwardLabel` / `entriesLabel` / `aria-label` | string | "Back" / "Forward" / "Recent" / "History" | |

### 3. Parts

`backIcon`, `forwardIcon`, `entriesIcon`.

### 4. Blocks

None. `TopBar` takes any node in `history`, so an app that needs another arrangement composes `IconButton`s itself.

## Behaviour as space shrinks

Fixed size; it never shrinks. In a `TopBar` it is part of `start`, which the bar keeps.

## Interaction and accessibility

- A `group` named by `aria-label`, holding two buttons (three with `entries`).
- Keys: `Alt+ArrowLeft` and `Alt+ArrowRight`, reserved in the shortcut registry and bound only while the buttons are mounted and enabled. They never fire while the user types in a field, where the same keys move the caret. An app rebinds them by registering a shortcut with the same id and other keys.
- Each tooltip shows the label and the key hint.
- The recent entries are a `Menu`. It opens from the caret, from a right click on either button, and from a long press (500ms) on either button; the press that ends a long press does not navigate.

## Open questions

None.

Resolved 2026-10-10:

- The reserved defaults are `Alt+ArrowLeft` and `Alt+ArrowRight` (recorded in `plan/interaction.md`).
- Browser mode reads `navigation.canGoBack` and `canGoForward` and follows `currententrychange`. Browsers without the Navigation API keep both buttons enabled, since there is no way to know.
- The long press and right click are extras for pointer users; the caret is the way in for keyboard and screen-reader users, so it is always shown with `entries`.

Resolved 2026-10-11 (review 2):

- **Blocks: none, as an exception to decision 07** (recorded there): it is two `IconButton`s and a `Menu` wired to one history, and the wiring is the component. An app that wants another arrangement uses those two components with its own history; `TopBar` takes any node in `history`.

Resolved 2026-10-12 (fix pass of Milestone 2):

- **A button that disables itself under the focus hands it to the other.** "Back" at the first place and "Forward" at the last are disabled, and a disabled button cannot hold the focus: it goes to the other button, or to the caret of the entries when both are disabled (`leaveDisabled`, `src/internal/focus.ts`; `tests/visual/focus-kept.spec.ts`). Not when the shortcut did it with the focus elsewhere.
- **`onBack` and `onForward` are called with no argument**, as every `onPress` is (`scripts/check-optional-props.mjs`, third pass).
