# WeekStrip

**Tier** 2 · **Group** Time · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

Seven days side by side, each with a header and its slots: a week at a glance, small enough for a card in a side column.

## Not for

- A month, or controls beside a week: use `Planner`.
- A list of what is coming up, with times and text: use `List`.
- Picking a date in a form.

## Evidence

A "this week" card with seven narrow columns, a weekday header (today's filled) and two or three small icon slots per day (1, 2, 4, 11, 17, 27, 28); a wide strip with a date pill per day and three labelled slots (22). `plan/reference/index.html` shows the small card: weekday names, today filled, two slots a day. The hand-made stand-in of the overview page story (`src/stories/pages/OverviewScreen.tsx`) is replaced by this component.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `dayCell` | the header of a day: holds the `day` part | shown |
| `day` | the `DateChip` of a day | weekday and number |
| `row` | one line: the headers, or one slot of each day | |
| `slotCell` | one slot of one day: holds `slot`, `placeholder` or `skeleton` | |
| `slot` | the `ScheduleSlot` of an item | |
| `placeholder` | a free slot: a dashed box, named by `freeLabel` | |
| `skeleton` | a slot while `loading` | |
| `hiddenItems` | the "+N" of a day with more items than slots: a button that opens their list | shown where a day is full |
| `state` | the empty or error state, in place of the grid | |

In the page the `day` part is the chip (`[data-umbra="date-chip"][data-part="day"]`), `slot` and `placeholder` are schedule slots (`[data-umbra="schedule-slot"][data-part="slot"]`). The number inside a chip is the chip's own `day` part, a `span`.

The data is a flat list of `ScheduleItem` (`id`, `date`, `label`, and optionally `slot`, `icon`, `tone`, `series`, `color`, `variant`, `selected`, `disabled`, `textValue`). Items fill the slots of their day in order; one with a `slot` index takes that slot when it is one of the day's and free, and the first free slot otherwise (`plan/specs/ScheduleSlot.md`, "Where an item is placed"). A day with more items than `slotsPerDay` shows "+N" for the rest.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `dayHeader` | `both`, `weekday`, `date` | "Mon 12", "Mon" (the reference), "12" |
| `weekdayFormat` | `auto`, `long`, `short`, `narrow` | |
| `slotSize` | `small`, `default` | `small` for a small card |
| `slotDisplay` | `auto`, `full`, `icon` | |

States: `loading`, empty, `error`; today (chip state, and the whole day tinted); a selected day; focus on one cell.

Which days: `startDate` is the first of the seven as given. Otherwise the strip is the week that holds `date` (default `today`), starting on the locale's first day of the week, or on `weekStartsOn`.

## Customisation

### 1. Tokens

`--umbra-week-strip-gap`, `--umbra-week-strip-today-bg`. The chips and slots read their own tokens.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | `ScheduleItem[]` | `[]` | |
| `startDate` / `date` | ISO date | — / `today` | Which seven days |
| `today` | ISO date | the current day | A prop, so stories and tests are deterministic |
| `weekStartsOn` | 0–6 (0 is Sunday) | the locale's | |
| `slotsPerDay` | number | the most any day has, at least 1 | |
| `dayHeader`, `weekdayFormat`, `slotSize`, `slotDisplay` | see above | `both`, `auto`, `small`, `auto` | |
| `selectedDate` / `defaultSelectedDate` / `onSelectedDateChange` | ISO date \| `null` / same / function | — | Days can be chosen when any of the three is given |
| `onAction` | `(id) => void` | — | An item was activated |
| `onDayAction` | `(date) => void` | — | A day's header or one of its free slots was activated |
| `loading`, `empty`, `error`, `onRetry`, `retryLabel` | as everywhere | | `src/internal/dataState.tsx` |
| `freeLabel` | string | "Free" | |
| `hiddenItemsLabel` | `(count) => string` | "2 more" | Names the "+N" of a full day, before the names of its items |
| `aria-label` / `aria-labelledby` | string | — | Names the grid |

### 3. Parts

`day`, `slot`, `placeholder`, `skeleton`, `state`. The `slot` function receives the props of the default `ScheduleSlot` and the `item`.

### 4. Blocks

`WeekStrip.Root` (the grid and its keyboard), `WeekStrip.Row` (`week`: the first day of the row) and `WeekStrip.Cell` (`date`, `line`, `today`, `selected`, `outside`, `disabled`, `onPress`, `role`). A cell holds a `DateChip`, a `ScheduleSlot` or anything else. The all-in-one is built from them.

## Behaviour as space shrinks

By the room inside a day: its width less the gap between days (`--umbra-week-strip-gap`, 4px by default). Each cell is the size container `umbra-schedule`.

| Step | Trigger (room inside a day) | Result |
|---|---|---|
| 1 | label wider than its slot | the label ends in an ellipsis |
| 2 | 128px or less | weekday names: long to short |
| 3 | 68px or less (56px with `slotSize="small"`, the default) | beside a number, weekday names: short to narrow |
| 4 | 64px or less | slots show their icon only; the label is the tooltip of the focused or hovered cell |
| 5 | 52px or less (44px with `slotSize="small"`) | a header with a weekday and a number shows the number alone |
| 6 | 48px or less | with `dayHeader="weekday"`, weekday names: short to narrow |
| 7 | the date and its "+N" do not fit side by side | the "+N" goes under the date |

The number of a day is never drawn cut (`plan/specs/DateChip.md`).

All in CSS, so the steps are a function of the width: growing brings back what shrinking took. Columns are `minmax(0, 1fr)`, so the strip is never wider than its container. Its height is its content's: it does not scroll, and in a card too short for it the card body does.

## Interaction and accessibility

- **Role: `grid`**, always, also when nothing can be activated. The headers of the days are `columnheader`, the slots `gridcell`, each line a `row`. Following the ARIA authoring practices for a grid of dates: a grid is one tab stop moved through with the arrow keys, which is what a strip of 21 small things needs. A list of seven lists was rejected: 21 tab stops, or no keyboard reach at all for a read-only strip, whose labels may be in tooltips only.
- **One tab stop**: the selected day, else today, else the first day; after that, the cell the user was last on.
- **Keys**: arrows move by a day and by a line and stop at the edges; `Home` and `End` go to the first and last day of the line; `Ctrl+Home` and `Ctrl+End` to the first and the last cell. `Enter` and `Space` activate the cell: an item calls `onAction(id)`; a header or a free slot selects the day and calls `onDayAction(date)`.
- **Right to left**: the first day is on the right; `ArrowLeft` goes to the next day. The keys follow what is drawn.
- A cell is the control; the chip and the slot inside it are not. Today's header has `aria-current="date"`; headers have `aria-selected` where days can be chosen.
- Loading sets `aria-busy`. The empty and error states are drawn by the same root element. When the grid gives way to one of them under the focus, the focus goes to the first control of the state (Retry), or to the root itself; when the grid comes back, to the cell the user was on.
- **Targets**: a cell that can be pressed is at least 24px high (WCAG 2.5.8). At `slotSize="small"` the chip and the slot are drawn lower than that (16px at the compact density) and keep their look: the cell around them is what is pressed, and only a cell that can be pressed is made taller, so a strip that is only read is as low as before.
- **The "+N" of a full day** is a button, 24px each way, that opens a popover with the hidden items: each is a `ScheduleSlot` that calls `onAction(id)` and closes the list (plain slots where the strip has no `onAction`). A press on it does not press the day. From the grid: `F2` on the day's header moves to it, `Enter` opens it, `Escape` returns to the header. `Enter` on a header that can be pressed stays the day's.
- **Loading holds the layout.** With `slotsPerDay` the lines are fixed. Without it they are those of the items given while loading, else those the strip last showed (a reload, the next week), else two: an app whose first load must not move gives `slotsPerDay`.
- The rules are those of `DataTable`'s grid (`plan/specs/DataTable.md`); the code is `src/time/grid.ts`, shared with `Planner` (see `plan/specs/Planner.md`, "Keyboard").

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **A grid, not a list** (above).
- **The cell is pressed, not the slot.** A button inside each focusable cell would be two things to focus for one action.
- **`empty` replaces the grid only when the app gives it.** A week without items is a normal thing to look at and to fill: the days show with free slots. With `empty` set, its text takes the grid's place.
- **Default header is weekday and number** in one chip (the fuller option); `dayHeader="weekday"` is the reference's look.
- **Free slots are drawn**, as dashed boxes with a name for screen readers, so a day's lines stay aligned across the week.
- **`startDate` is taken as given**: an app that wants "the next seven days" gets them without a week boundary.
- **No shrink by height**: the reference hides the second line of slots in a short card. Here the card body scrolls instead, since which line matters is the app's to say.
- **A day with more items than `slotsPerDay` says so** (integration pass, 2026-10-11): "+N" beside its date, named by `hiddenItemsLabel(count)`; see `plan/specs/Planner.md`. Token `--umbra-week-strip-hidden-items-color`.

Resolved in the fix pass of review 1 (2026-10-11): the steps (T-3, T-15: the spec was wrong, see `plan/specs/DateChip.md`), the size of what is pressed (T-5), the focus in a change of state (T-2), where an item is placed (T-7), loading without `slotsPerDay` (T-9), the names of the parts in the page (T-11), dates that are not dates (T-13: `today`, `date`, `startDate` are as if not given and `selectedDate` is no day chosen, each with a warning in development; `plan/specs/Planner.md`, "Dates"), and the list of hidden items.
