# Modal

**Tier** 1 · **Group** Overlays · **Status** spec written 2026-10-10 (approved under the owner's delegation)

This file also covers `ConfirmDialog`, a helper built on `Modal`.

## Purpose

A panel over a dimmed page, for one focused task: a form, a settings screen, a detail view, a decision. Focus stays inside it and the page behind is inert until it closes. Its body scrolls inside; the page never does.

`ConfirmDialog` is the confirm step before an action that cannot be undone.

## Not for

- Content anchored to a control, without a backdrop: use `Popover` or `Menu`.
- A message that does not block the page: use `Banner`.
- A hint on hover or focus: use `Tooltip`.
- A step-by-step flow: put a `Stepper` (tier 2) in the body.

## Evidence

3 (large, tabs as the title, no footer), 12, 20–22 and 26 (settings: tabs in the header row, a side navigation, a scrolling list of settings, a footer with link buttons at the start and actions at the end), 29, 34 (medium: title, description, body, divider, Cancel and Confirm at the end), 35 (large, three columns, no footer). In all of them: a dark surface one step lighter than the page, a 1px border, about 8px radius, a bordered square close button at the top end, and a dimmed page behind.

Not in the screenshots, and the library's own: the `drawer` variant, the `alertdialog` variant, `ConfirmDialog`, motion, and everything below the minimum window.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `backdrop` | the dimmed layer over the page (token `scrim`); places the panel | shown |
| `header` | `icon`, `title`, `description`, `close` button | shown |
| `toolbar` | tabs or filters that stay fixed under the header | hidden |
| `nav` | side navigation at the start; the panel becomes two columns | hidden |
| `body` | the content; a `ScrollArea` | shown |
| `footer` | status and actions fixed below the body, above a divider | hidden |

`footer` and `nav` are nodes: an `ActionBar` and a `VerticalNav` fit them.

`ConfirmDialog`: `header` (icon, title, description), an optional body (`children`), and a footer with `cancel` then `confirm`.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `dialog`, `alertdialog`, `drawer` | `alertdialog`: `role="alertdialog"`, no outside press, no close button, focus starts on the first footer action. `drawer`: attached to an edge, for detail panels |
| `side` | `start`, `end`, `bottom` | drawer only; default `end` |
| `size` | `sm`, `md`, `lg`, `xl`, `full` | 400 / 560 / 800 / 1120px, never wider than the window minus the margin; `full` fills the window minus the margin. A bottom drawer is always as wide as the window |
| `height` | `auto`, `fill` | `auto`: as tall as the content, up to the window minus the margin |
| `padding` | `default`, `none` | of the body; `none` for edge-to-edge tables and media |
| `tone` (ConfirmDialog) | `default`, `danger` | the confirm button is `primary` or `danger` |

States: open, closed, entering, exiting, narrow (below the minimum window). `ConfirmDialog`: loading (while `onConfirm` runs).

## Customisation

### 1. Tokens

`--umbra-modal-bg`, `--umbra-modal-border`, `--umbra-modal-radius`, `--umbra-modal-padding`, `--umbra-modal-shadow`, `--umbra-modal-width` (overrides the size), `--umbra-modal-nav-width`, `--umbra-modal-margin`, `--umbra-modal-scrim`, `--umbra-modal-backdrop-filter`, `--umbra-modal-duration`, `--umbra-modal-z-index`. Padding and margin follow the density level.

Global tokens added: `size.modalSm`, `size.modalMd`, `size.modalLg`, `size.modalXl`, `size.modalNav`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `open` / `defaultOpen` / `onOpenChange` | boolean / boolean / function | closed | Controlled or uncontrolled open state |
| `trigger` | node | — | A button that opens the modal; focus returns to it |
| `onRequestClose` | `() => boolean \| void` | — | Called before any close; `false` keeps the modal open |
| `variant`, `side`, `size`, `height`, `padding` | see above | `dialog`, `end`, `md`, `auto`, `default` | |
| `title` | node | — | Names the dialog |
| `description` | node | — | A line under the title; also the dialog's accessible description |
| `icon` | node | — | Leading header icon |
| `toolbar` / `nav` / `footer` | node | — | See the anatomy |
| `navLabel` | string | `Sections` | Text of the toggle that shows `nav` below the minimum window |
| `dismissOnEscape` | boolean | `true` | |
| `dismissOnOutsidePress` | boolean | `true`; always `false` for `alertdialog` | |
| `hideClose` | boolean | `false`; `true` for `alertdialog` | |
| `closeLabel` | string | `Close` | Accessible name of the close button |
| `initialFocusRef` | ref | — | Focused on open, or the first control inside it |
| `headingLevel` | 1–6 | 2 | Heading level of the title |
| `aria-label` | string | — | Names a modal that has no title |

`ConfirmDialog`: `open` / `defaultOpen` / `onOpenChange`, `trigger`, `icon`, `size` (default `sm`), `title` (required), `description`, `children`, `confirmLabel` (`Confirm`), `cancelLabel` (`Cancel`), `tone`, `onConfirm` (may return a promise), `onCancel`, `loadingLabel`.

### 3. Parts

`Modal`: `header`, `title`, `description`, `close`, `toolbar`, `nav`, `body`, `footer`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

`ConfirmDialog`: `cancel`, `confirm` (each receives the default button's props).

### 4. Blocks

`Modal.Root` (state and options, no element), `Modal.Trigger`, `Modal.Overlay` (the backdrop, in a portal), `Modal.Content` (the panel and the dialog element), `Modal.Header`, `Modal.Title`, `Modal.Description`, `Modal.Toolbar`, `Modal.Nav`, `Modal.Body`, `Modal.Footer`, `Modal.Close` (the close icon button, or with a label a text button that closes after its own `onPress`).

`ConfirmDialog` has no blocks of its own: it is a `Modal` with two buttons, and is rebuilt from the `Modal` blocks.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | Window narrower than the size plus the margins | The panel is as wide as the window minus the margins |
| 2 | Content taller than the window minus the margins | The body scrolls inside the panel; the header, toolbar and footer stay. The navigation scrolls by itself |
| 3 | Header narrower than its text | The title truncates with an ellipsis; the description wraps to at most three lines |
| 4 | Footer narrower than its actions | The actions wrap to a second line (an `ActionBar` applies its own steps instead) |
| 5 | Below the minimum window (`NarrowContext`, set by `AppShell`) | Every modal and drawer fills the whole window: no margin, border or radius |
| 6 | Below the minimum window, with `nav` | The navigation moves behind a full-width toggle (`navLabel`) above the body. Open, the list takes the body's place; choosing an item closes it and shows the body |

## Interaction and accessibility

- `role="dialog"` or `alertdialog`, named by its title (`aria-labelledby`) or by `aria-label`; a development warning when it has neither. Described by its description (`aria-describedby`).
- The rest of the page is `inert` while a modal is open: it cannot be clicked, focused or read by assistive technology.
- Focus moves in on open: to `initialFocusRef`, else an element marked `data-autofocus` or `autoFocus`, else (alert dialog) the first footer action, else the first control outside the header, else the close button. It is trapped inside, and returns to what had it before on close.
- The close button is the last focus stop of the header.
- Closing: Escape, a press on the backdrop, the close button, a `Modal.Close`, or `open={false}`. Every one except the prop asks `onRequestClose` first.
- Stacking: a modal opened from a modal is on top; Escape and an outside press close only the top one. A popover, menu, select list, suggestion list or tooltip opened inside a modal is rendered **into the modal's backdrop element** (not beside it in `<body>`), so it is above the modal and inside what the modal leaves reachable; a tooltip there still describes its control. The command palette opens over a modal (`Mod+K`): it is the top layer, takes the focus into its input, and gives it back to the modal when it closes. Layer order: `plan/tokens.json`, "layer" (`--umbra-layer-popover` < `-tooltip` < `-modal` < `-palette`; within a layer the overlay opened later is on top). `--umbra-modal-z-index` overrides the modal's layer.
- Rendered in a portal, with the density, context tint, brand and tokens of where it was opened.
- Motion: 240ms. The backdrop fades; the panel fades with an 8px rise; a drawer fades and slides in from its edge. Ease-out on enter, ease-in on exit. Under reduced motion only the fades stay.
- `ConfirmDialog`: an alert dialog, so focus starts on Cancel. When `onConfirm` returns a promise the confirm button shows `loading` (and announces `loadingLabel`), Cancel is disabled and nothing closes the dialog until it settles. It closes when the promise resolves and stays open when it rejects; the app shows the error, for example in `children`.

## Open questions

Resolved 2026-10-11:

- **The narrow state is read from the window** (`src/internal/useNarrow.ts`, the media query `AppShell` used), not from a context that only `AppShell` set. A modal used without an `AppShell` now fills the window below the minimum and moves its navigation behind the "Sections" toggle. `Columns` and `Card` read the same hook, so tab mode no longer needs an `AppShell` either.
- **Focus leaves the modal when it starts to close**, not after its exit animation (`useReturnFocusOnClose`, shared with `CommandPalette`).


None.

Resolved 2026-10-10:

- **No `aria-modal` attribute.** With it, assistive technology ignores everything outside the dialog element, including a popover or menu opened from inside the modal, which renders in its own portal. The page is made `inert` instead (React Aria's approach), which gives the same result without that fault.
- One `description` prop serves as both the visible subtitle and the accessible description.
- An alert dialog hides the close button by default and never closes on an outside press; Escape still closes it (`dismissOnEscape={false}` turns that off). Its "least destructive action" is, by convention, the first action in the footer.
- Below the minimum window the navigation goes behind a toggle, not into a top strip: `nav` is any node, and a vertical list cannot be laid out as a strip from outside.
- A modal that is already open when it mounts appears without the enter animation; closing it animates.
- A modal that is open when it mounts inside another modal opens one render later, so the two stack in order.
- No backdrop blur by default (the source has one): it is costly over a full window. `--umbra-modal-backdrop-filter` adds it.
- The size of a bottom drawer is its content, up to the window height less 40px; `size` does not apply to it.
- `footer` is a plain flex row aligned to the end. A status at the start comes from an `ActionBar`, or from a child with `margin-inline-end: auto`.
- `ConfirmDialog` swallows the rejection of `onConfirm`: the app that rejected it knows why.
- `Modal` does not take the slot props: it is never a layout child.

Resolved 2026-10-11 (review 2):

- Overlays opened from a modal render into its backdrop (F6): a tooltip in `<body>` was inert and did not describe its control. Tooltips also carry React Aria's top-layer mark, so the page behind a modal never hides them.
- The tooltips the library opens by itself (a text that is cut, a `DataTable` cell or header, a meter) render into the backdrop too (Milestone 2): they go through one internal `Tip`, which uses `useOverlayLayer` as every overlay does. `Escape` on one dismisses the tooltip only. A chart's tooltip is drawn inside the chart, so it was never outside; it does not stop `Escape` (the chart specs), so the modal closes with it.
- The backdrop, the drawer and `ConfirmDialog` carry the page's `dir` (F8): the `start` drawer is on the right when the direction is right to left.
- **Focus when it closes** is never left on nothing: it returns to what had it when the modal opened; a modal that opened without a press (`defaultOpen`, or opened by the app) gives it to its own trigger, and without one to the first control of the page. Below the minimum window, choosing a section in the navigation moves the focus to the "Sections" toggle, since the chosen control is hidden with the list (F18).
- `ConfirmDialog` `parts` (`cancel`, `confirm`) have a story and a test (F22).
