# Popover

**Tier** 1 · **Group** Overlays · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

An anchored panel without a backdrop. It opens from a control or against an element, and the page behind it stays usable. It keeps the density, context tint and tokens of the place it was opened from.

## Not for

- A list of actions or links: use `Menu`.
- A short description of a control: use `Tooltip`.
- A task that must be finished or cancelled before going on: use `Modal`.
- Choosing a value: use `Select`.

## Evidence

11 (a large panel anchored to a summary card: title, person and role, an action top-right, tabs, a scrolling body), 28 (a panel under a top-bar icon: title row with controls, a filter row, a scrolling list; no scrim, no arrow), 12 (a panel with a fixed footer of buttons). The source draws a light or coloured 1px border and no backdrop.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `header` | `title`, `subtitle`, `actions`, close button | shown when `title`, `actions` or `closeButton` is set |
| `toolbar` | filters or tabs that stay fixed above the body | hidden |
| `body` | the content; a `ScrollArea` | shown |
| `footer` | status or actions fixed below the body | hidden |
| arrow | a small pointer towards the anchor | hidden (`arrow`) |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `size` | `default`, `large` | `default`: 240 to 420px wide, at most 480px tall, card-title heading. `large`: 480 to 720px wide, as tall as the window allows, sentence-case title; for a panel with a toolbar and a footer (source: 11, 12) |
| `placement` | `top`, `bottom`, `start`, `end`, each alone (centred) or with `start`, `center`, `end` | default `bottom start` |
| `padding` | `default`, `none` | `none` for edge-to-edge lists and tables |

States: open, closed, entering, exiting. Data attributes on the root: `data-size`, `data-placement` (the side it ended up on), `data-match-width`, `data-entering`, `data-exiting`.

## Customisation

### 1. Tokens

`--umbra-popover-bg`, `--umbra-popover-border`, `--umbra-popover-radius`, `--umbra-popover-shadow`, `--umbra-popover-padding`, `--umbra-popover-min-width`, `--umbra-popover-max-width`, `--umbra-popover-title-font`. Padding follows the density level.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `trigger` | node | — | The control that opens it: an umbra-ui button, or a plain `<button>` |
| `anchorRef` | ref | — | The element to open against when there is no `trigger`; used with `open` |
| `open` / `defaultOpen` / `onOpenChange` | boolean / boolean / function | — | Controlled or uncontrolled state |
| `placement` | see above | `bottom start` | Flips to the other side to stay in the window |
| `offset` | number | `4` | Gap to the anchor, in pixels |
| `matchAnchorWidth` | boolean | `false` | Gives the panel the width of its anchor |
| `maxHeight` | number | 480 (`default`), the window (`large`) | The body scrolls beyond it |
| `size` | see above | `default` | |
| `arrow` | boolean | `false` | |
| `title` / `subtitle` / `actions` | node | — | The header |
| `closeButton` / `closeLabel` | boolean / string | `false` / "Close" | A close button in the header |
| `toolbar` / `footer` | node | — | Fixed above and below the body |
| `padding` | see above | `default` | |
| `aria-label` | string | — | Accessible name when there is no title |
| `dismissOnBlur` | boolean | `true` | Closes when keyboard focus leaves the panel |
| `children` | node, or a function that receives `close` | — | The body |

### 3. Parts

`header`, `toolbar`, `body`, `footer`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`Popover.Root` (state), `Popover.Trigger`, `Popover.Content` (the panel; takes the placement props, and `anchorRef` with `open` when used without a root), `Popover.Header`, `Popover.Toolbar`, `Popover.Body`, `Popover.Footer`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | No room on the asked side | The panel flips to the other side, and slides along the anchor to stay in the window |
| 2 | Content taller than `maxHeight` or than the room in the window | The body scrolls; header, toolbar and footer stay in place |
| 3 | Window narrower than the panel's width | The panel is as wide as the window minus a margin; title and subtitle truncate with an ellipsis |

## Interaction and accessibility

- The panel is a `dialog` named by its title, else by `aria-label`, else by its trigger. It is not modal: the page is not hidden from assistive technology and has no backdrop.
- The trigger carries `aria-expanded` and `aria-controls`. `Enter` and `Space` on it open the panel; pressing it again closes it.
- Opening moves focus to the panel; closing returns it to where it was (the trigger), unless the user has already moved focus elsewhere.
- `Escape` closes it, from inside the panel or from the page.
- A press outside closes it, and the page takes that press: one press on another control both closes the popover and uses the control. A press that starts inside the panel is not a press outside.
- Focus leaving the panel by keyboard closes it, unless `dismissOnBlur` is off.
- A `Menu`, `Select` or `Tooltip` opened from inside the panel is part of it: using it does not close the panel.
- Motion: 180ms fade with a 4px slide from the anchor's side, ease-out in and ease-in out. Reduced motion keeps the fade only.
- The focus ring of the panel is drawn inside it.

## Open questions

Resolved 2026-10-11:

- 2026-10-11: the accessible name is `aria-label` (it was `label`), as on the other components: `plan/decisions/07-customisation.md`, "Prop names".
- **Flipping when the content arrives late.** React Aria picks the side from the panel's height when it opens and then caps the height at the room on that side, so content that arrived afterwards (the body of a layout-collapsed card near the bottom of the window) stayed cut on the short side. `useFlipWhenCut` (`src/overlays/shared.ts`) lifts a cap the panel has grown into, once, so the real height is measured and the panel flips. `Menu`, `Select` and the `SearchField` suggestions use the same hook; `Tooltip` needs none (its content is there when it opens). Tested at the four corners of the window in three window sizes (`Overlays/Window edges`).


None.

Resolved 2026-10-10:

- Built on React Aria's non-modal popover, with the dialog role, the focus move and the outside press handled by the library (React Aria only offers them for modal popovers).
- The panel keeps the look of the Milestone 0 internal popover: raised surface, strong border and the overlay shadow. The source's coloured border is left to `--umbra-popover-border`.
- A press outside closes on the click, after the page's own handler, so a separate button that toggles a controlled popover does not reopen it.
- Without `trigger`, the app owns the state: `anchorRef` with `open` and `onOpenChange` (or `defaultOpen`).
- A close button is opt-in (`closeButton`); the source shows none.
- `Tab` from the last control of the panel leaves the page's tab order at the end of the document (the panel is rendered at the end of the body). It is not moved back to the trigger.
- A `Popover` trigger placed among actions that move into an overflow menu is not supported; give such actions a `Menu`.
