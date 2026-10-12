# Component catalog (approved 2026-10-10)

Clustered from the four inventory files in `plan/inventory/` (40 screenshots).

- **Tier 0** = foundation, needed by everything. **Tier 1** = core set for a first usable release. **Tier 2** = later.
- "Absorbs" lists the inventory names folded into the component as variants.
- Screenshot numbers are examples, not exhaustive; the inventory files hold the full evidence.

## 0. Foundation

| Component | Absorbs | Seen in | Tier |
|---|---|---|---|
| UmbraProvider | theme, density, icon map, shortcut registry; `UmbraScope` for subtrees | not visible (see `specs/UmbraProvider.md`) | 0 |

## 1. Shell

| Component | Absorbs | Seen in | Tier |
|---|---|---|---|
| AppShell | full-window frame, themed background | all | 0 |
| TopBar | brand-coloured bar, light variant (38) | nearly all | 0 |
| PrimaryNav | top-level sections with dropdown carets | nearly all | 0 |
| SubNav | second-level tabs, some with dropdowns | nearly all | 0 |
| ShortcutBar | pinned shortcuts, "(+1)" overflow, icon-only mode (28) | nearly all | 1 |
| HistoryButtons | back / forward | nearly all | 1 |
| PrimaryAction | ContinueButton; label changes with context | nearly all | 1 |
| ContextBlock | DateTimeBlock: two-line status + clock chip | nearly all | 2 |
| VerticalNav | side navigation inside modals / settings | 21, 26 | 1 |
| PageHeader | EntityBanner, MessageHeader | 5, 6, 13–16, 30, 31 | 1 |
| EntitySwitcher | picker for the current entity in a header | 31, 33, 40 | 2 |

## 2. Layout

| Component | Absorbs | Seen in | Tier |
|---|---|---|---|
| Page / Columns / Stack | the fit-to-window layout primitives | all | 0 |
| Card | SummaryCard, ActionCard, NavCard (watermark icon), SettingCard | all | 0 |
| CardHeader | plain, brand-tinted (32, 33), collapsible caret (38) | most | 0 |
| SectionTitle | uppercase condensed, underlined link, sentence-case with rule | all | 0 |
| ScrollArea | thin thumb, no track; per-region scroll | most | 0 |
| Accordion | collapsible sections and cards | 15, 36, 38 | 1 |
| WidgetBoard | masonry of collapsible widgets | 36 | 2 |
| HorizontalScroller | row of cards that scrolls sideways | 5 | 2 |

## 3. Data display

| Component | Absorbs | Seen in | Tier |
|---|---|---|---|
| DataTable | cell widgets, RowAccent, GroupHeader, highlighted row, column menu, saved views | ~30 screens | 1 |
| List | leaderboard, person list, MediaObject (a `ListItem` with a large `leading` and `descriptionLines`), FixtureRow (the `pair` variant of `ListItem`: two sides mirrored around a centre) | ~20 screens | 1 |
| ListItem (message) | MessageListItem: sender, title, tags, time, unread dot, category tint | 1, 2, 13–16, 25, 27, 28 | 1 |
| GroupHeader | DateGroupHeader, OfferGroupHeader | 1, 2, 7, 13–16, 31 | 1 |
| KeyValue | KeyValueRow, FactItem, AttributeList; `KeyValueList` for a group of rows | 5–7, 9, 32, 33, 37, 40 | 1 |
| StatValue | large value + label + optional bar | ~15 screens | 1 |
| SummaryTile | compact tile: icon, title, one value | 37, 38, 40 | 1 |
| Tag | PositionChip, FixtureChip, RatingTag; edge-stripe variant | ~25 screens | 1 |
| Badge | count badge, unread dot | ~12 screens | 1 |
| ValuePill | RatingPill, GradeBadge, AttributeValue; colour by threshold | 4, 6, 9–11, 15, 17, 18, 31, 32, 36 | 1 |
| StarRating | | 3, 6, 10, 15, 23, 29, 40 | 2 |
| TrendArrow | up / down / flat | 1, 5, 6, 32, 36 | 1 |
| StatusIndicator | StatusIcon, StatusLabel, MoodIndicator | 4, 6, 8, 9, 11, 12, 16–18 | 1 |
| SequenceDots | FormIndicator, PersonDots: a short row of coloured dots | 1, 2, 4, 6, 9, 11, 18, 27, 28, 31, 37, 38 | 2 |
| Avatar | person, silhouette placeholder; `AvatarGroup` for an overlapping row | ~25 screens | 1 |
| EntityIcon | CrestIcon: small logo / flag next to a name | ~30 screens | 1 |
| MediaCard | NewsCard hero and compact, ResultCard | 1, 2, 5, 27, 28, 30, 31 | 2 |
| Banner | InsightBanner, RecommendationBand, Callout, Alert, NotificationPrompt | 1, 5, 15, 36, 39 | 1 |
| Comparison | StatComparison, Scoreboard, ScoreStrip: two sides, one metric per row | 30, 36 | 2 |
| Legend | | 1, 3, 5, 19, 23, 24, 29, 32, 33, 35, 36 | 1 |
| EmptyState | title + explanation; inline variant | 2, 8, 15, 19, 24, 27, 38 | 1 |
| Skeleton | loading placeholder; used by every data component's `loading` prop | not in screenshots (see `interaction.md`) | 0 |
| Link | coloured inline link, "See all" | 12, 18, 20 | 1 |

## 4. Inputs

| Component | Absorbs | Seen in | Tier |
|---|---|---|---|
| Button | primary (magenta), secondary (purple), neutral, disabled | most | 0 |
| IconButton | | most | 0 |
| SplitButton | button + dropdown | 3, 4, 10, 29 | 2 |
| SegmentedFilter | with counts | ~20 screens | 1 |
| Tabs | pill, underline and button-group variants | 3, 9–11, 15, 20–23, 26, 28, 29, 35 | 1 |
| Select | plain, in-cell coloured, PersonSelect, RoleSelect | ~30 screens | 1 |
| Menu | listbox, context menu with submenus, system menu | 2, 12, 17, 19, 21 | 1 |
| Checkbox | | 4, 11, 12, 18, 20, 21, 26, 35, 40 | 1 |
| Radio | Radio, RadioCardGroup, OptionTile, InstructionTile | 3, 6, 7, 9, 29, 34 | 1 |
| Toggle | | 12, 20, 26, 28, 39, 40 | 1 |
| Slider | intensity bar, timeline scrubber | 36, 38 | 2 |
| SearchField | the collapsed trigger seen in the source; the expanded field, suggestions and recent searches are this library's own design | nearly all | 1 |
| FormField | SettingRow: label + description + control | 12, 20, 21, 26 | 1 |
| TextField | plain text input seen inside search and settings rows; single-line and multiline | 12, 20, 21, 26 (implied) | 1 |
| Stepper | | 29 | 2 |
| ColorScaleEditor | ColorScalePreview: editable value-to-colour ramp | 26 | 2 |

## 5. Overlays

| Component | Absorbs | Seen in | Tier |
|---|---|---|---|
| Modal | dimmed backdrop, optional VerticalNav | 3, 12, 20–22, 26, 29, 34, 35 | 1 |
| ConfirmDialog | built on Modal; the confirm step before a destructive action | not in screenshots | 1 |
| Popover | large anchored panel with own tabs and footer; no backdrop | 11, 28 | 1 |
| Tooltip | plain and rich | 40 | 1 |
| ActionBar | footer with status + actions; Undo / Redo / Reset / Confirm; "Must Respond" | 7, 10, 12, 14, 16, 20–23, 26, 33, 34, 36 | 1 |
| Spotlight | CoachMark: dims everything but one target | 25 | 2 |
| CommandPalette | opened from the TopBar search; app supplies entries | not in screenshots (see `interaction.md`) | 1 |
| ShortcutsSheet | help overlay rendered from the shortcut registry | not in screenshots (see `interaction.md`) | 2 |

## 6. Meters and charts

| Component | Absorbs | Seen in | Tier |
|---|---|---|---|
| ProgressBar | plain, segmented, colour-by-fill | 1, 2, 6, 7, 19–22, 27, 28, 36–38, 40 | 1 |
| LevelMeter | tick strip with marker; range variant (40) | 3, 6, 10, 23, 37–40 | 1 |
| PieIndicator | small wedge-disc gauge | 7, 15, 39 | 2 |
| DivergingMeter | ImpactMeter: fills left or right of centre | 22 | 2 |
| MeterList | a group of meters in aligned columns: labels, bars, values (the owner's O-7) | 3, 6, 10, 37–40 | 2 |
| Sparkline | in-cell mini bars / line | 17, table cells | 2 |
| DonutChart | KPI ring | 7, 8 | 1 |
| RadarChart | | 1, 3, 29 | 1 |
| LineChart | ordinal Y axis, step line, per-point colours | 13, 25, 31, 35, 36 | 1 |
| BarChart | diverging variant | 36 | 1 |
| Heatmap / Scatter | only seen overlaid on a pitch | 35, 36 | 2 |

## 7. Time

| Component | Absorbs | Seen in | Tier |
|---|---|---|---|
| Planner | Calendar: month grid of slots with side controls per week | 37, 38 | 2 |
| WeekStrip | 7-day strip of small slots | 1, 2, 4, 11, 17, 18, 22, 27, 28 | 2 |
| ScheduleSlot | coloured slot chip: icon + label | same as above | 2 |
| DateChip | pill with the day number | 37, 38 | 2 |

## Dropped (football-specific)

Pitch, FormationView, PlayerToken, KitIcon, ShirtNumberIcon, OppositionSummary, PlayerStatusStrip, ScoreThumbnail, ScoreBox.

## Decisions (2026-10-10)

- **Name**: `umbra-ui`.
- **Domain-neutral**: no football or manager components.
- **Scrolling**: the page never scrolls; regions may.
- **Theme**: dark base; the app sets brand and context tint; violet (selected) and magenta (primary action) are fixed.
- **Density**: three levels, set on the provider.
- **DataTable**: sorting, rich cells, row highlight, columns auto-hide by priority. No end-user column editing or saved views.
- **DataTable, end-user columns** (2026-10-11, owner's finding O-2; changes the line above): the end user can show, hide, reorder, pin and resize columns. Saving the choice is the app's: the table is controlled (`columnState`) and ships no storage. Named saved views stay out of scope.
- **Charts, first release**: radar, line, bar, donut. Heatmap and scatter later.
- **Layout**: see `layout.md`.
- **Interaction**: see `interaction.md` (crisp motion, skeleton loading, opt-in change highlight, full keyboard navigation, command palette, shortcut registry).
- **Icons**: one open default set; icon props accept any node; built-in icons come from an overridable map.

## Cross-cutting findings

- **Theming has three layers**: brand (TopBar, can be light), context tint (page background and card tint per section), and fixed interaction colours (violet = selected, magenta = primary action).
- **Density is a setting** in the source (Default / Detailed / Condensed).
- **Colour carries data** everywhere (thresholds, row tints, stripes); every such use needs a non-colour fallback.
- **The source is inconsistent** (primary button colour, four SectionTitle styles, two checkbox styles); the library must pick one rule each.
- **Hex values and proportions in the inventory are eyeballed**; the token step must pixel-sample.
