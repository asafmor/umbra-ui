# Tooltip

**Tier** 1 · **Group** Overlays · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A short description of a control, shown on hover and on keyboard focus. Plain (one line) or rich (a title, a text and a key hint).

## Not for

- Anything the user must be able to press, select or scroll: use `Popover`.
- Information a user needs to finish a task: put it on the page.
- The only name of a control: the control needs its own label (`IconButton` requires `label`).

## Evidence

40 (a rich hover panel over a table: title, a small table, a description, no close button). Plain tooltips do not appear in the screenshots; they are the library's own rule (`plan/interaction.md`, key hints in tooltips).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `title` | heading of a rich tooltip | hidden |
| `body` | the text (`content`) | shown |
| `hint` | the keys of `shortcut` | hidden |
| wrapper | a focusable stand-in around a control that takes no events | only with `wrap` |

## Variants and states

| Variant | How | Look |
|---|---|---|
| plain | `content` only | one line, label font; the key hint at its end |
| rich | `title` set | bold title with the key hint at the end of its line, quieter text below, more padding |

States: open, closed, entering. Data attributes on the root: `data-rich`, `data-placement`, `data-entering`.

## Customisation

### 1. Tokens

`--umbra-tooltip-bg`, `--umbra-tooltip-fg`, `--umbra-tooltip-border`, `--umbra-tooltip-radius`, `--umbra-tooltip-max-width`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | element | — | The control: any umbra-ui control, or a plain focusable element |
| `content` | node | — | The text. Nothing shows when `content`, `title` and `shortcut` are all empty |
| `title` | node | — | Makes it rich |
| `shortcut` | shortcut id | — | Shows the keys from the provider's shortcut list |
| `placement` | as `Popover` | `top` | Flips to stay in the window |
| `delay` | number (ms) | `500` | Before it shows on hover; focus shows it at once |
| `offset` | number | `6` | Gap to the control |
| `open` / `defaultOpen` / `onOpenChange` | boolean / boolean / function | — | Controlled or uncontrolled state |
| `disabled` | boolean | `false` | Never shows |
| `wrap` | boolean | the control's own `disabled` | Puts the control in a focusable wrapper that carries the tooltip |

### 3. Parts

`title`, `body`, `hint`.

### 4. Blocks

None.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | No room on the asked side | Flips to the other side and slides along the control to stay in the window |
| 2 | Text wider than 320px (`--umbra-tooltip-max-width`) or than the window minus a margin | The text wraps; long words break |

## Interaction and accessibility

- Role `tooltip`; while open the control points at it with `aria-describedby`. It is a description, never the control's name.
- Shows after `delay` on hover and at once on keyboard focus; once one tooltip has shown, the next shows without delay. Only one tooltip is open at a time.
- Hoverable and dismissible (WCAG 1.4.13): it stays while the pointer is over the control **or over the tooltip itself**, and for `closeDelay` (200ms) after the pointer has left the control, which is the time to move onto it. It hides when the pointer has left both, when focus leaves, when the control is pressed, and on `Escape` (without moving the pointer or the focus).
- It never takes focus and never holds interactive content.
- A disabled control takes no pointer or focus events, so `wrap` puts it in a wrapper that does: the wrapper is in the tab order and reads as a disabled button with the control's name, described by the tooltip.
- Inside an overflow menu the control is a menu row with its label and key hint, and the tooltip is not rendered.
- It keeps the density, context tint and tokens of the place it was opened from.
- Motion: 180ms fade in with a 4px slide (the slide is removed under reduced motion). It leaves at once.

- Inside a modal it renders into the modal's layer, so it is above it and still describes its control.

## Open questions

None.

Resolved 2026-10-10:

- No exit fade: when another tooltip opens during a fade out, React Aria leaves the first one in the page, invisible. Leaving at once avoids it.
- The look is the Milestone 0 internal tooltip: raised surface, strong border, overlay shadow. The source's coloured border (40) is left to `--umbra-tooltip-border`.
- A plain element as the control must be focusable and have an interactive role, otherwise keyboard users cannot reach the tooltip.
- `wrap` defaults to the child's `disabled` prop. `Button` and `IconButton` do not wrap themselves for their own `tooltip` prop: a disabled button shows none, as before.
- No arrow and no blocks: a tooltip is one small piece, replaced through `parts`.
- `IconButton`'s `tooltip` part now receives the text only; the key hint of `shortcut` is added by the tooltip after it.

Resolved 2026-10-11 (review 2):

- `closeDelay` (prop, 200ms). It was 0, so the tooltip went away before the pointer could reach it (F19); the earlier line "hides when the pointer leaves" contradicted WCAG 1.4.13.
- `wrap`: the control inside the wrapper is `inert`, so assistive technology sees one disabled button, not two (F30).
