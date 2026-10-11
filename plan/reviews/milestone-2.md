# Milestone 2 (started 2026-10-11)

The record of Milestone 2: the starting state, the decisions made under the owner's delegation, and (added at the end) the independent reviews.

## Starting state (commit `90e62d5`)

| Check | Result |
|---|---|
| `npm ci`, lint, typecheck | pass; 48 doc samples compile |
| Unit tests | 109 passed, 14 files |
| Build, `check:package` | pass; tarball 414 files, 669 kB; `Card` 74.6 KB gzip, `Button` 37.5, `Skeleton` 0.5 |
| `release:check` | pass |
| `test:examples` | 33 passed |
| `test:visual` | 6334 passed, 11.2 min |
| Baselines | 354 stories, 4,281 images, 197 MB |

## Owner's delegation (2026-10-11)

The owner answered the plan's questions with: decide yourself, from the code and from what users of such a library expect, aim for the best experience, record any compromise in the component's documentation, and continue to completion without stopping. Specs are therefore approved under delegation; each open question is decided, the fuller option chosen, and recorded under "Resolved" in its spec.

| # | Question | Decision |
|---|---|---|
| 1 | Baseline trim | Per story: default density at 1920x1080, 1280x720 and 1024x600; compact at 1280x720; spacious at 1024x600 (the tightest combination). Tint images (1280x720, default density, three tints) for one story per component: the one tagged `tints`, else the first of its file; every full-page story is tagged. `narrow` stories: 900x560 at the default density. The no-page-scroll check and axe keep running at every size, density and tint, without images. |
| 2 | Thresholds | One exported type, `Threshold = { from: number; tone?: Tone; color?: string; label?: string }`, in an ascending list, for `ValuePill`, `ProgressBar`, `BarChart`, `DonutChart` and what `ColorScaleEditor` produces. `ValuePill` still accepts a plain `number[]` as shorthand for boundaries on the value ramp. |
| 3 | Token rule scope | A component's stylesheet declares no `--umbra-*` property at all, global or another component's. A container that needs a different default sets a private property and the reader falls back through it (`plan/decisions/07-customisation.md`). A check enforces it. **Done 2026-10-11**: 29 declarations became private properties, `scripts/check-tokens.mjs` is in `npm run lint`, and `tests/visual/tokens.spec.ts` proves each container lets the app's token through. |
| 4 | First day of the week | `@internationalized/date` becomes a direct dependency (it is already installed through React Aria, so nothing new is downloaded). `weekStartsOn` overrides the locale. |
| 5 | ShortcutsSheet key | `?`, as already recorded in `plan/interaction.md`. |
| 6 | Spotlight layer | A new token `layer.spotlight` between `modal` and `palette`: a spotlight can point at something inside a modal, and the command palette still opens on top. |
| 7 | Spec approval | No stop: specs are approved under delegation. |
| 8 | Milestone 0 leftovers | Taken with the open items: the three literal durations become tokens, and the generated tables get a defaults column. **Durations done 2026-10-11**: they were tokens already; a check now refuses a literal duration in a stylesheet. **Tables done 2026-10-11**: a Default column, and each token under the component whose name it carries. |
| 9 | Heatmap and Scatter | Both take a `backdrop` part: an app-supplied node drawn behind the plot. |
| 10 | WidgetBoard | A masonry of collapsible cards that scrolls inside itself. No drag to reorder. |
| 11 | Planner | The per-week side column is a render slot; a fixed number of slots per day; `onAction` per slot; no drag and no built-in copy and paste (the app's buttons go in the side column). |
| 12 | `Card` and the menu | The overflow menu is loaded with a dynamic `import()` the first time a header overflows. |

## Groups

| # | Group | Components |
|---|---|---|
| A | Time (`src/time/`) | DateChip, ScheduleSlot, WeekStrip, Planner |
| B | Data | SequenceDots, MediaCard, Comparison |
| C | Inputs | StarRating, SplitButton, Slider, Stepper, ColorScaleEditor |
| D | Meters and charts | PieIndicator, DivergingMeter, Sparkline, Heatmap, Scatter |
| E | Shell and layout | ContextBlock, EntitySwitcher, WidgetBoard, HorizontalScroller |
| F | Overlays | Spotlight, ShortcutsSheet |
