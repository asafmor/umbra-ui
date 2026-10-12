# Planner

**Tier** 2 · **Group** Time · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A month of days, each with a fixed number of slots, and room beside every week for the app's own controls. It fills its slot and scrolls its weeks inside itself.

## Not for

- One week in a small card: use `WeekStrip`.
- Events with a start and an end time on a time axis: not in the library.
- Picking a date in a form.
- Dragging entries between days, or a clipboard: the app's buttons do that (see "Resolved").

## Evidence

A month grid in a large card: a month list with previous, next and "Today" above; per week a leading control cell (a label, a select, a meter, three buttons) and seven day cells, each a date pill over three stacked slots; the grid scrolled inside the card (37). The same with empty weeks, which show their day headers and one line of text (38).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `toolbar` | the month list, previous, next, the app's `actions`, "Today" | shown |
| `title` | the month as text, in the toolbar when `monthSelect` is off | hidden |
| `grid` | the weeks; inside a `ScrollArea` | shown |
| `weekdays` | the names of the weekdays; stays at the top while the weeks scroll | shown |
| `week` | one week: its lines and its side cell | |
| `weekAside` | the side cell of a week: what `renderWeek` returns | shown with `renderWeek` |
| `row`, `dayCell`, `day`, `slotCell`, `slot`, `placeholder`, `skeleton` | as in `WeekStrip` | |
| `weekEmpty` | the one line of a week without items | "Nothing planned" |
| `state` | the empty or error state, in place of the weeks | |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `slotsPerDay` | number | 3. Every day has that many lines; a line without an item is a free slot |
| `height` | `fill`, `content`, pixels | the shared prop (`src/internal/height.ts`) |
| `weekdayFormat` | `auto`, `long`, `short`, `narrow` | |
| `slotSize`, `slotDisplay` | as `WeekStrip` | `default`, `auto` |
| side column | `renderWeek` | none without it |

States: `loading` (the days are known, so they are drawn; the slots are placeholders), empty, `error`; today (chip, and the day tinted through all its lines); a selected day; days of the months beside (dimmed chips, still shown and reachable); a week without items; focus on one cell.

## Customisation

### 1. Tokens

`--umbra-planner-gap`, `--umbra-planner-day-gap`, `--umbra-planner-border-color`, `--umbra-planner-header-bg`, `--umbra-planner-aside-padding`. The sticky weekday names are filled with the surface the planner stands on, through the private `--scroll-fade-color` its card sets. The collapsed side column gives its button a size and an inward ring through the private `--icon-button-size` and `--focus-offset`. The width of the side column is the `weekAsideWidth` prop, not a token: the step that collapses it is worked out from it. No new global token.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | `ScheduleItem[]` | `[]` | Those on the days shown are drawn |
| `month` / `defaultMonth` / `onMonthChange` | `'2026-10'` | the month of `today` | The month shown |
| `minMonth` / `maxMonth` | `'2026-10'` | — | The first and last month the user can go to |
| `today` | ISO date | the current day | |
| `weekStartsOn` | 0–6 (0 is Sunday) | the locale's | |
| `slotsPerDay` | number | 3 | |
| `selectedDate` / `defaultSelectedDate` / `onSelectedDateChange` | ISO date \| `null` / same / function | — | Days can be chosen when any of the three is given |
| `onAction` | `(id) => void` | — | An item was activated |
| `onDayAction` | `(date) => void` | — | A day's header or one of its free slots was activated |
| `renderWeek` | `(week) => node` | — | The side column. `week` is `{ start, end, days, index, items, collapsed }` |
| `weekAsideWidth` | pixels | 200 | |
| `height` | `fill` \| `content` \| pixels | `fill` | |
| `size`, `priority`, `minWidth`, `minHeight`, `label` | slot props | | As a child of `Columns` or `Stack` (`useSlot`) |
| `loading`, `empty`, `error`, `onRetry`, `retryLabel` | as everywhere | | `src/internal/dataState.tsx` |
| `weekdayFormat`, `slotSize`, `slotDisplay` | see above | | |
| `monthLabel`, `previousLabel`, `nextLabel`, `todayLabel`, `weekLabel`, `emptyWeekLabel`, `freeLabel` | string | "Month", "Previous month", "Next month", "Today", "Week", "Nothing planned", "Free" | The built-in texts |
| `aria-label` | string | — | Names the grid, before the month: "Schedule, October 2026" |

### 3. Parts

`toolbar`, `weekdays`, `weekEmpty`, `day`, `slot`, `placeholder`, `skeleton`, `state`. The `toolbar` function receives the toolbar's props, so it can return `<Planner.Toolbar {...props} monthSelect={false} actions={…} />`; `null` hides it.

The side column is the `renderWeek` prop and not a part: it has no default content to replace or hide, and it is drawn once per week from that week's data.

### 4. Blocks

`Planner.Root` (the month, the limits, `today`, the slot props and `height`), `Planner.Toolbar` (`monthSelect`, `monthSpan`, `actions`, the labels) and `Planner.Grid` (the items and everything about days and slots). The toolbar and the grid read the month from the root, so they can stand in any order, with anything between them. `Planner.Row` and `Planner.Cell` are the row and the cell of `WeekStrip`, for a grid drawn by hand.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | weeks taller than the planner | the weeks scroll inside; the toolbar and the weekday names stay |
| 2 | label wider than its slot | the label ends in an ellipsis |
| 3 | day 128px or narrower, then 44px | weekday names: long, short, narrow |
| 4 | day 64px or narrower | slots show their icon only; a month beside a day number goes ("Sep 27" becomes "27") |
| 5 | the days would be narrower than 40px beside the side column (grid narrower than `weekAsideWidth` + 280px) | the side column collapses to a button per week that opens the week's content in a `Popover`. The slots are then icon only whatever their width |

Steps 2 to 4 are container queries on each day. Step 5 changes what is rendered, so it is measured (a `ResizeObserver` on the grid, applied before the paint); it is a function of the grid's width alone, so a resize and a fresh load at a width agree. The page never scrolls, and the grid is never wider than the planner.

Limit: when the side column collapses or opens, its content is mounted again, so state kept inside what `renderWeek` returns (not in the app) is lost on that resize.

## Interaction and accessibility

### Roles

`grid`, named by `aria-label` and the month. Following the ARIA authoring practices for a grid of dates, with these differences, each because a day here has several things in it:

- A week is a `rowgroup` of `1 + slotsPerDay` rows: the row of day headers, then one row per slot. Every header and every slot is its own `gridcell`, so "down" from a day is its first slot.
- The weekday names are the `columnheader`s. A slot's cell is described by the header of its day (`aria-describedby`), since the weekday alone does not say the date.
- The side cell of a week is its `rowheader`, named "Week, Oct 11 – 17", spanning the week's rows.
- The line of an empty week is one cell spanning the seven days. It is not a stop.
- Today's header has `aria-current="date"`; headers have `aria-selected` where days can be chosen.
- The month's name is in a polite live region, so a change is said when the focus is on a button that did not change.

A list of weeks holding lists of days was rejected: a month is some 140 things, and a list gives no arrow keys and no column to move along.

### Keyboard

One tab stop in the grid: the selected day if it is in the month, else today, else the first of the month; after that, the cell the user was last on. The toolbar's controls are ordinary tab stops before it.

| Key | Does |
|---|---|
| Arrows left and right | The day before or after, on the same line; past the end of a week, into the next. In right to left they follow what is drawn. Before the first day of a week is its side cell, when there is one |
| Arrows up and down | The line above or below; from a day's header, the last slot of the same weekday a week earlier. A week without slots is one stop |
| `Home` / `End` | The first and last day of the week |
| `Ctrl+Home` / `Ctrl+End` | The first day of the month; the last line of its last day |
| `PageUp` / `PageDown` | The same day of the previous or next month (its last day when it has no such day). With `Shift`, a year |
| `Enter` / `Space` | Activates the cell: `onAction(id)` for an item; for a header or a free slot, selects the day and calls `onDayAction(date)` |
| `Enter` / `F2` on a side cell | Moves into its controls; `Tab` stays among them; `Escape` returns to the cell. A side cell with one control (the collapsed button) presses it |

A move to a day that is not shown changes the month, within `minMonth` and `maxMonth`, and the focus lands on that day once it is drawn. The focused cell is scrolled into view inside the planner only, clear of the weekday names.

These are the rules of `DataTable`'s grid (`plan/specs/DataTable.md`, "Interaction and accessibility"): one tab stop, the active cell remembered by what it is (a date and a line) and not by its element, controls inside a cell out of the tab order, focus taken back when a render removes the focused element. The code is not shared: `src/table/grid.ts` walks `<tr>` rows, column spans and a virtual row list, while a planner walks dates, where "up" crosses into another week and a move can ask for another month. A clean extraction would have been the forty lines of roving tab stop; the rest differs. `src/time/grid.ts` mirrors the rules and says so at its top, and serves both `Planner` and `WeekStrip`.

### Other

- "Today" is never disabled: on today's month it scrolls today into view. A button that disabled itself when pressed would drop the focus.
- Previous and next are disabled at `minMonth` and `maxMonth`.
- Loading sets `aria-busy`. The error state is an alert; when Retry brings the weeks back the focus goes to the planner's first tab stop.
- A popover opened from a collapsed side cell closes when the weeks scroll, as every anchored overlay does.

### Dates

One model for the four time components, in `src/time/dates.ts`, unit-tested:

- Public values are ISO text: a day `'2026-10-11'`, a month `'2026-10'`. No date library type is in a prop, a callback or a return type.
- Arithmetic is `@internationalized/date` on calendar dates, which have no time and no zone. It is a direct dependency at the version React Aria already installs, so nothing new is downloaded.
- Text is `Intl.DateTimeFormat` with the provider's locale, formatted in UTC from a UTC instant. Nothing goes through a local-time `Date`, so a clock change cannot move a day (tested in five zones, including ones where a local midnight does not exist).
- The first day of the week is the locale's (`startOfWeek`); `weekStartsOn` overrides it.
- The dates are Gregorian and so is the text, whatever calendar the locale prefers; digits and names are the locale's.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation; decision 11 of `plan/reviews/milestone-2.md` fixed the first four):

- **The side column is a render slot**, `renderWeek(week)`.
- **A fixed number of slots per day**, `slotsPerDay`; free slots are drawn.
- **`onAction(id)` per item, `onDayAction(date)` per day.**
- **No drag, no built-in copy and paste.** The app's buttons go in the side column; the "Default" story copies, pastes and clears a week with three `Button`s and its own state.
- **The toolbar has a month list** (the fuller option, and what the source shows), with `monthSelect={false}` for a plain title. It offers twelve months each way (`monthSpan`), within the limits.
- **Each slot is a grid cell** (above), rather than a day being one cell with three buttons inside: every item is one arrow key away, and Enter always means "this one".
- **Days of the months beside are shown and can be reached**; moving past the grid changes the month.
- **`empty` replaces the weeks only when the app gives it.** Without it, a month without items shows its weeks, each with the empty-week line, because an empty planner is where a user starts planning.
- **The side column collapses to a popover**, not to nothing: its controls must stay reachable. It collapses after the slots have gone to icons, as the milestone plan orders the steps.
- **Past days are not dimmed** as the source does: dimming by opacity would cost the labels their contrast, and what "past" means is the app's (an item can take `variant="empty"` or `disabled`).
- **Selection is on only when the app asks for it** (any of the three selection props).
- **The planner opens with the day that holds the tab stop in view**, and "Today" brings today into view.
- **Rows use `display: contents`** so that a week is one CSS grid and the side cell can span its rows. Chrome keeps the role of such an element (the tests read the rows by role). Firefox and Safari are not tested automatically: that their minimum versions keep it too is to be confirmed in the manual browser check before a release; the fallback, should one not, is `subgrid` rows with the side cell placed by the week.
- **The toolbar's `actions` move into a "more" menu when they do not fit** (integration pass, 2026-10-11): `moreLabel` on the toolbar and the planner. The list of months gives way first, down to 6rem, then the actions move, so the app's buttons keep their labels.
- **A day with more items than `slotsPerDay` says so** (integration pass, 2026-10-11; they were dropped with no sign): "+N" beside its date (`hiddenItems`), named by `hiddenItemsLabel(count)` ("2 more") and the items it stands for, which a pointer reads in its tooltip and a screen reader hears with the day. Weaker than it could be: no popover that lists them as controls, so they cannot be activated from the planner.
- **Works in the popover of a layout-collapsed card** (integration pass, 2026-10-11): the keyboard grid and every control did nothing there (`plan/layout.md`, "Mechanism"). Still open: the side column's content is mounted again when the column collapses or opens.
- **The month opens on today's week whatever the planner's first sizes are** (review 2, OP-6, 2026-10-11). The day was scrolled into view once, before the side column collapsed, the stack gave the card its height or the columns became tabs. It is kept in view through every resize until the user scrolls or moves in the weeks; from then on the place is theirs.
- **What brings a week into view stops clear of the weekday names** (review 2, OP-7, 2026-10-11): the scrolling element has a `scroll-padding-top` of their height, which the browser's `scrollIntoView` honours (a `Spotlight` on a week uses it).
