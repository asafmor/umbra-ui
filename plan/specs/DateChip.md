# DateChip

**Tier** 2 · **Group** Time · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A pill with the number of a day: the header of a day in a `WeekStrip` or a `Planner`, with or without the name of its weekday.

## Not for

- A whole date in a sentence or a table cell ("11 Oct 2026"): format it as text.
- Choosing a date: the chip is not a control. In a `WeekStrip` or `Planner` the cell around it is what is pressed.
- A count on a corner: use `Badge`.

## Evidence

Day headers of the month grid: a dark pill with a light number, today in a filled pill with the whole day tinted, and "28 Sep", "1 Oct", "1 Nov" where a month starts or the grid begins (37, 38). The week strips head their days with the number and the month on the 1st (22), or with the weekday name, today's highlighted (1, 2, 4, 11, 17, 27). `plan/reference/index.html` shows the weekday name with today filled in the primary colour.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `weekday` | the name of the weekday | hidden; shown with `weekday` |
| `day` | the day number, with the short month when `showMonth` applies | shown |

The chip is a `<time datetime="2026-10-11">`. What is drawn is short and hidden from assistive technology; the whole date ("Sunday, October 11, 2026") is there in its place, followed by `todayLabel` and `selectedLabel` when they apply.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `size` | `default`, `small` | The height follows the density level: label size plus 10px, or plus 4px for `small` |
| `weekday` | none, `long`, `short`, `narrow`, `auto` | `auto` is the long name that gives way (below) |
| `day` | `true`, `false` | `false` leaves the weekday name alone, as in the reference |
| `showMonth` | `auto`, `true`, `false` | `auto`: on the first day of a month |

States, each with a cue besides its colour:

| State | Look | Second cue |
|---|---|---|
| default | faint fill, primary text | |
| `today` | the fixed primary colour | a bar under the text, and a heavier weekday name |
| `selected` | the fixed violet | a ring in the text colour. With `today`, violet wins and the bar stays |
| `outside` | no fill, muted text | dimmed by colour, not opacity, so the text keeps 4.5:1 |

## Customisation

### 1. Tokens

`--umbra-date-chip-bg`, `--umbra-date-chip-fg`, `--umbra-date-chip-height`, `--umbra-date-chip-padding-x`, `--umbra-date-chip-radius`, `--umbra-date-chip-font`, and per state `--umbra-date-chip-today-bg` / `-fg`, `--umbra-date-chip-selected-bg` / `-fg`, `--umbra-date-chip-outside-bg` / `-fg`. No new global token.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `date` | `'2026-10-11'` | required | The day, as ISO text |
| `today` / `selected` / `outside` | boolean | `false` | The states above. The chip does not work them out: its holder knows what today is |
| `size` | `default` \| `small` | `default` | |
| `weekday` | `long` \| `short` \| `narrow` \| `auto` | — | Shows the weekday name |
| `day` | boolean | `true` | Shows the number |
| `showMonth` | boolean \| `auto` | `auto` | Adds the short month, in the locale's order |
| `todayLabel` / `selectedLabel` | string | "Today" / "Selected" | Said after the date. A holder that says the state itself (`aria-current`, `aria-selected`) passes `''` |

All text comes from the provider's `locale` through `Intl`: digits, names and the order of day and month ("1 Nov", "Nov 1").

### 3. Parts

`weekday`, `day`. Each accepts a node, `null` or a function receiving the default part's props (`{ format }`, `{ month }`).

### 4. Blocks

`DateChip.Root`, `DateChip.Weekday`, `DateChip.Day`. The root holds the date; the two blocks read it.

## Behaviour as space shrinks

Inside a day of a `WeekStrip` or `Planner` (the size container `umbra-schedule`), by the room inside that day: its width less the gap between days (`--umbra-week-strip-gap` or `--umbra-planner-day-gap`, 4px by default). So a day of 72px has 68px of room.

| Step | Trigger (room inside the day) | Result |
|---|---|---|
| 1 | 128px or less | `weekday="auto"`: the long name becomes the short one |
| 2 | 68px or less (56px for `size="small"`) | `weekday="auto"` beside a number: the short name becomes the narrow one ("Wed 14" to "W 14") |
| 3 | 64px or less | the month beside the number goes ("Sep 28" becomes "28") |
| 4 | 52px or less (44px for `size="small"`) | a chip with a weekday and a number shows the number alone |
| 5 | 48px or less | `weekday="auto"` without a number: the short name becomes the narrow one |
| 6 | 36px or less | the chip gives up its side padding: a round pill around the number, whole down to a room of 24px |

**The number is never drawn cut**: a number cut short would read as another day ("14" as "1"). The weekday gives way first, at every step. Each width is the room the widest text of its step needs at the spacious density, the largest font (en-US, the default font), so nothing is cut at any density; a browser test narrows a strip pixel by pixel at the three densities and both sizes. Where the texts still do not fit side by side (a longer weekday name in another locale, a larger font from the token), the weekday is what is shortened, with an ellipsis, and the number keeps its width.

All in CSS: the chip holds each text and shows one. The widths are literal because a container query cannot read a custom property. Outside such a container nothing changes: `auto` is the long name. The chip never grows past its container (`max-width: 100%`), and what is said to assistive technology is the whole date at every step.

## Interaction and accessibility

- Not focusable and not a control.
- The state words are part of the text, so they are read wherever the chip stands; a grid cell that carries `aria-current="date"` and `aria-selected` turns them off so nothing is said twice.
- Contrast: white on the primary and on violet is checked in `tokens.json`; the default and outside texts are the base text colours on the card.
- Right to left: the parts follow the reading direction; names and digits are the locale's.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **Dates are ISO text** in the public API (`'2026-10-11'`); no date library type appears in a prop. The shared logic is `src/time/dates.ts` (`plan/specs/Planner.md`, "Dates").
- **The chip is told its states**; it does not read the clock. Its holders take `today` as a prop, so stories and tests are deterministic.
- **Today is primary, selected is violet**: the source uses purple for today, which is this library's colour for "selected". Today gets the primary colour, as in the reference screen, and a bar as its second cue.
- **The weekday is part of the chip** (`weekday`, with `day={false}` for the name alone), so one component heads a day in every form the screenshots show: number, number with month, weekday name.
- **Texts are always Gregorian**, whatever calendar the locale prefers, because the dates are; digits and names stay the locale's.

Resolved in the fix pass of review 1 (2026-10-11):

- **The number stays, the weekday goes** (T-3): the last step used to keep the weekday and hide the number, and between the steps "Wed 14" was drawn as "Wed 1" in days of 60 to 78px. The steps are now sized for the largest font, and the narrowest keeps the number.
- **The steps are stated as what is measured** (T-15): the spec gave them as the width of a day; a container query measures the room inside the day, 4px less. The spec was wrong, and the numbers above are the ones in the stylesheet.
- **`--umbra-date-chip-font` resizes the small chip too** (T-10): the smaller font of `size="small"` is the default of the token.
- **A `date` that is not a date draws nothing**, with a warning in development (`plan/specs/Planner.md`, "Dates"): never a wrong date.
