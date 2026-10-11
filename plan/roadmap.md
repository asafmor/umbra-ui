# Roadmap (approved 2026-10-10)

Tiers refer to the "Tier" column in `components.md`.

## Before any code

| # | Task | Output |
|---|---|---|
| P1 | Tokens — **done** | `plan/tokens.json` |
| P2 | Specs for the tier 0 components — **done and approved** (14 files; `Card.md` is the template) | `plan/specs/` |
| P3 | Static HTML reference screen — **done** | `plan/reference/index.html` and three renders |

## Milestone 0 — Foundation (tier 0)

- Repo setup: build, Storybook, visual tests.
- Provider: theme (brand, context tint), density, icon map, shortcut registry.
- Layout: `AppShell`, `Page`, `Columns`, `Stack`, `Card`, `CardHeader`, `SectionTitle`, `ScrollArea`.
- Shell: `TopBar`, `PrimaryNav`, `SubNav`.
- Basics: `Button`, `IconButton`, `Skeleton`.
- Docs: README, the getting-started and layout guides, the `basic` example app, and the generator for customisation tables.

**Done when**: a three-column page of placeholder cards fills any window from 1024 × 600 up with no page scroll, the stack-collapse rule works, and all three density levels pass visual tests.

## Milestone 1 — Core (tier 1), in this order

| Batch | Components |
|---|---|
| 1a. Data basics | Tag, Badge, ValuePill, Avatar, EntityIcon, KeyValue, StatValue, SummaryTile, TrendArrow, StatusIndicator, GroupHeader, List, ListItem, Banner, Legend, EmptyState, Link |
| 1b. Inputs | Popover and Tooltip first (moved from 1c: Select and Menu need them), then SegmentedFilter, Tabs, Select, Menu, Checkbox, Radio, Toggle, FormField, SearchField |
| 1c. Overlays | Modal, ActionBar, VerticalNav, CommandPalette; every Milestone 0 overlay moved to the public Popover, Menu and Tooltip |
| 1d. Table | DataTable (sorting, cell widgets, priority-based column hiding, keyboard grid) |
| 1e. Meters and charts | ProgressBar, LevelMeter, DonutChart, RadarChart, LineChart, BarChart |
| 1f. Shell extras | ShortcutBar, HistoryButtons, PrimaryAction, PageHeader, Accordion |

Docs in this milestone: the theming, customisation and recipes guides; the `dashboard` and `advanced` example apps.

Before 1a: the open items of the Milestone 0 review marked "before 1a" (`plan/reviews/milestone-0.md`).

**Done when**: three reference screens are rebuilt as full-page stories (an overview with many cards, a list + detail screen, a table-heavy screen). First public release, as `0.1.0`.

## Milestone 2 — Extended (tier 2)

Planner, WeekStrip, ScheduleSlot, DateChip, StarRating, SequenceDots, MediaCard, Comparison, SplitButton, Slider, Stepper, ColorScaleEditor, Spotlight, ShortcutsSheet, PieIndicator, DivergingMeter, Sparkline, Heatmap, Scatter, WidgetBoard, HorizontalScroller, ContextBlock, EntitySwitcher.

Order inside this milestone is decided by demand.

## Per-component definition of done

1. Spec written, matches the catalog row, and lists all four customisation layers.
2. Stories for every variant and state, including loading, empty and error.
3. Shrink behaviour defined and covered by visual tests at several sizes.
4. Keyboard and screen-reader checks pass: the automated accessibility test passes on every tint, and an interaction test covers the component's keys and focus.
5. Works on every context tint and all three density levels: no page scroll at any size and density, the images of `plan/decisions/06-docs-and-testing.md` ("Baseline images") captured, one story of the component captured on each other tint (its first, or the one tagged `tints`), and the accessibility test passing on every tint.
