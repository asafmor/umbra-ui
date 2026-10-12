# ContextBlock

**Tier** 2 · **Group** Shell · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

The two-line status at the end of the `TopBar`: what "now" is for the app (a date, a period, a workspace), a quieter second line, and a short value in a chip, usually the time.

## Not for

- The one primary action of the app: use `PrimaryAction`.
- A count or a state on a control: use `Badge` or `Tag`.
- A date as data in a list or a card: use `DateChip`.

## Evidence

Nearly every screenshot, top bar, right side: 1 (bold date, a quieter line, a dark inset chip with the time), 11 (the chip is outlined in the bar's text colour), 31, 36 (other bar colours). The source block is not a control; the press and the link are this library's addition.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `text` | holds the two lines | shown |
| `primary` | the main line, bold | shown when given |
| `secondary` | the quieter second line | shown when given |
| `chip` | a short value in an outlined box: `chip`, or `time` formatted | shown when `chip` or `time` is given, or `live` |

## Variants and states

No variants. The block takes its text colour from where it sits, so it is right on a brand bar of any colour, the light one included. With `onPress` or `href` it is a button or a link: hover, pressed and focus as in `plan/interaction.md`, `disabled` at the shared opacity.

## Customisation

### 1. Tokens

`--umbra-context-block-gap` (between the text and the chip), `--umbra-context-block-max-width` (the lines end in an ellipsis past it), `--umbra-context-block-primary-font`, `--umbra-context-block-secondary-font`, `--umbra-context-block-chip-font`, `--umbra-context-block-chip-padding-x`, `--umbra-context-block-chip-padding-y`, `--umbra-context-block-chip-radius`, `--umbra-context-block-chip-border`, `--umbra-context-block-chip-bg`, `--umbra-context-block-hover-bg`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `primary` | node | — | The main line |
| `secondary` | node | — | The second line |
| `chip` | node | — | The chip's content; wins over `time` |
| `variant` | `plain`, `filled` | `plain` | `filled` sets the block on a surface of its own, a step lighter or darker than the bar |
| `time` | `Date` \| ISO string \| number | — | Shown in the chip, formatted with the provider's `locale` |
| `timeFormat` | `Intl.DateTimeFormatOptions` | hour and minute | How `time` is written. Give it a `timeZone` when the page is rendered on a server (see "Server rendering") |
| `live` | boolean | `false` | The chip is a clock: it starts at `time` (or now) and moves on each minute |
| `onPress` | function | — | Makes the block a button |
| `href` / `renderLink` | string / function | — | Makes the block a link; `renderLink` takes the shared `LinkRenderProps` |
| `disabled` | boolean | `false` | |
| `aria-label` | string | — | Replaces the name a button or link takes from its lines. It has to contain the text that is shown (WCAG 2.5.3), so it is for adding to it |

### 3. Parts

`primary`, `secondary`, `chip`. Each accepts a node, `null` or a function receiving `{ children }`.

### 4. Blocks

`ContextBlock.Root`, `ContextBlock.Text`, `ContextBlock.Primary`, `ContextBlock.Secondary`, `ContextBlock.Chip`. `Root` takes `onPress`, `href`, `renderLink`, `disabled` and `tooltip`; `Chip` takes `dateTime`.

## Behaviour as space shrinks

Inside a `TopBar` the block is the first thing to give way, one step at a time; the bar asks for a step only while it still overflows.

| Step | Result |
|---|---|
| 1 | `secondary` hides |
| 2 | `chip` hides |
| 3 | The bar hides the whole block (the bar's step 1) |

The step is `data-shrink` (`0` to `2`) on the block. While a line or the chip is hidden, hovering or focusing the block shows everything in a tooltip.

Outside a bar nothing is measured: the block can shrink, both lines end in an ellipsis, and the same tooltip shows the full text while a line is cut.

## Interaction and accessibility

- Without `onPress` or `href` the block is plain text and no tab stop.
- As a button or link it is named by its lines and chip, or by `aria-label`.
- The chip of a `time` is a `<time>` element with a machine-readable `dateTime`.
- A `live` clock announces nothing: it is no live region, so a screen reader is not interrupted each minute.
- Text and chip use the bar's text colour at full strength, so the 4.5:1 the bar computes holds for both lines. The second line is quieter by weight and size, not by opacity.
- The tooltip repeats what assistive technology reads from the block, so it is not wired as a description.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **A ticking clock is built in, opt-in** (`live`). With `time` it starts there and advances by the time that has passed since it was mounted, so an app can show a server's clock, and a story or test with a fixed `time` shows that value. Without `time` it shows the device's clock. It re-renders once per minute, at the minute's start.
- **`time` is formatted by the library** with `Intl.DateTimeFormat` and the provider's locale; `chip` takes any other value (a period, a version, a count).
- **The chip is outlined, not filled**: a fill mixed from the bar's colour could lower the contrast of the text in it on a brand colour near the limit.
- **The steps inside a bar are driven by the bar**, not measured by the block: the block's own width never changes there, it is the nav beside it that runs out of room. `TopBar.Root` takes two steps for the block before its own first step; `data-shrink` on the bar still counts `0` to `4`.
- **`ContextBlock` replaces the plain two-line node** in the stories that fill the bar's `context` slot.

Changed 2026-10-11 (fix pass of review 2, and the owner's O-9):

- **`variant="filled"`** (O-9, after the dark inset panel of the source): the block sits on a surface of its own. Tokens: `--umbra-context-block-bg`, `--umbra-context-block-padding-x`, `--umbra-context-block-padding-y`, `--umbra-context-block-radius`. The colour is worked out from the brand by the provider (`insetOn`, `src/provider/contrast.ts`, as `--umbra-color-brand-inset`): 14% towards the bar's text colour, so lighter on a dark bar and darker on a light one, when the text keeps 4.5:1 on it; on a mid-tone bar, where that would cost the text its contrast, 14% the other way, which only adds contrast. So text that is readable on the bar is readable on the surface on any brand, and the chip's outline, in the text colour, keeps more than 3:1. Hover and press mix the text colour into the surface. **`plain` stays the default**: see "Which is the default" below.
- **Server rendering** (X-6). Without `timeFormat.timeZone` the time is written in the viewer's time zone, which a server does not know: rendered there in its own zone, the markup did not match the browser's. Now, on a server and while the browser takes the page over, the chip holds the time written in UTC, not shown (`visibility: hidden`): the same text on both sides, and the chip has its size already, so the bar does not move. The viewer's time is written as soon as the page is the browser's. A page rendered in the browser writes it at once. With a `timeZone` nothing waits anywhere, and the text is the same on every machine: an app that renders on a server and wants no empty chip in the first paint gives one.
- **The font tokens are taken whole** (SL-14): the weight of `--umbra-context-block-primary-font`, `-secondary-font` and `-chip-font` was overridden by the block. The defaults are the label font at 700, 400 and 700.
- **A plain block whose lines a bar has hidden is a tab stop** (SL-15), so the tooltip with the whole text is within reach of the keyboard (it shows on focus). Whole, it is text and no tab stop. A block cut by an ellipsis outside a bar is not one either, like every truncated text of the library.
- **The generated token table lists the block's tokens** (SL-13): the generator took `--umbra-context-block-*` for tokens of the global context tint.

**Which is the default** (O-9, decided 2026-10-11): `plain`. The owner asked for the surface as an option. `filled` reads well on all five bars of the `Filled` story (`shell-contextblock--filled`), but it is 24px wider, so a bar at 1024px takes its first shrink step earlier, and every baseline with a top bar would change. Not compared side by side in the full-page stories: making it the default is one word (`variant = 'filled'`) if the owner prefers it after seeing the story.
