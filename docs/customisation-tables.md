# Customisation tables

Generated from the source by `npm run docs:tables`. Do not edit.

Every component is customised through the same four layers: tokens, props, parts and blocks.
A token is a CSS variable: set it in CSS on any ancestor, or through the `tokens` prop of
`UmbraProvider` or `UmbraScope` (without the `--umbra-` prefix). Every component also accepts
`className` and `style` on its root.

A token is listed under the component whose name it carries, with its default: the value it has
until you set it. A default that names a global token shows that token and its value. A name
without `--umbra-` is a value the component works out from its variant or state. Where two
defaults are given, the token is read in more than one place (a size per `size`, for example).
A token no component is named in (`--umbra-focus-color`, `--umbra-chart-*`) is shared: it is
listed under every component that reads it.

## Built-in strings

Every prop that holds one of the library's own words, with an English default. Pass your own to
translate a component. A name followed by brackets can also be a function of what it describes.

| Component | Text props |
|---|---|
| [`ActionBar`](#actionbar) | `selectionLabel(count)`, `clearLabel` |
| [`AppShell`](#appshell) | `skipLabel` |
| [`AvatarGroup`](#avatargroup) | `moreLabel(count)` |
| [`Banner`](#banner) | `dismissLabel` |
| [`BarChart`](#barchart) | `retryLabel`, `allHiddenLabel`, `pointsLabel`, `legendLabel` |
| [`Button`](#button) | `loadingLabel` |
| [`Card`](#card) | `retryLabel`, `collapseLabel`, `expandLabel`, `moreLabel` |
| [`Checkbox`](#checkbox) | `requiredLabel` |
| [`CheckboxGroup`](#checkboxgroup) | `requiredLabel` |
| [`ColorScaleEditor`](#colorscaleeditor) | `stopLabel`, `fromLabel`, `colorLabel`, `nameLabel`, `removeLabel`, `addLabel`, `resetLabel`, `trackLabel` |
| [`Columns`](#columns) | `tabsLabel` |
| [`CommandPalette`](#commandpalette) | `label`, `placeholder`, `emptyLabel`, `errorLabel`, `retryLabel`, `loadingLabel`, `recentLabel`, `shortcutsLabel`, `resultsLabel`, `backLabel`, `moveHint`, `enterKeyLabel`, `backspaceKeyLabel`, `escapeKeyLabel`, `runHint`, `backHint`, `closeHint` |
| [`Comparison`](#comparison) | `metricLabel`, `summaryLabel`, `leaderLabel`, `retryLabel`, `increasedLabel`, `decreasedLabel` |
| [`ConfirmDialog`](#confirmdialog) | `confirmLabel`, `cancelLabel`, `loadingLabel` |
| [`DataTable`](#datatable) | `selectRowLabel(row)`, `selectAllLabel`, `highlightLabel`, `collapseGroupLabel`, `expandGroupLabel`, `showDetailsLabel`, `hideDetailsLabel`, `hiddenColumnsLabel(count)`, `loadingMoreLabel`, `increasedLabel`, `decreasedLabel`, `retryLabel` |
| [`DateChip`](#datechip) | `selectedLabel`, `todayLabel` |
| [`DivergingMeter`](#divergingmeter) | `noValueLabel`, `increasedLabel`, `decreasedLabel` |
| [`DonutChart`](#donutchart) | `retryLabel`, `allHiddenLabel`, `pointsLabel`, `legendLabel`, `valueLabel` |
| [`EntitySwitcher`](#entityswitcher) | `emptyLabel`, `searchLabel`, `noResultsLabel`, `previousLabel`, `nextLabel` |
| [`FormField`](#formfield) | `requiredLabel`, `optionalLabel` |
| [`GroupHeader`](#groupheader) | `moreLabel`, `collapseLabel`, `expandLabel` |
| [`Heatmap`](#heatmap) | `retryLabel`, `allHiddenLabel`, `pointsLabel`, `legendLabel`, `lowLabel`, `highLabel` |
| [`HistoryButtons`](#historybuttons) | `backLabel`, `forwardLabel`, `entriesLabel` |
| [`HorizontalScroller`](#horizontalscroller) | `previousLabel`, `nextLabel`, `retryLabel` |
| [`IconButton`](#iconbutton) | `loadingLabel` |
| [`KeyValue`](#keyvalue) | `increasedLabel`, `decreasedLabel` |
| [`KeyValueList`](#keyvaluelist) | `increasedLabel`, `decreasedLabel`, `retryLabel` |
| [`Legend`](#legend) | `moreLabel(count)`, `allLabel`, `retryLabel` |
| [`LevelMeter`](#levelmeter) | `noValueLabel`, `compareLabel`, `rangeLabel`, `increasedLabel`, `decreasedLabel` |
| [`LineChart`](#linechart) | `retryLabel`, `allHiddenLabel`, `pointsLabel`, `legendLabel` |
| [`Link`](#link) | `externalLabel` |
| [`List`](#list) | `loadingMoreLabel`, `retryLabel` |
| [`ListItem`](#listitem) | `unreadLabel`, `accentLabel`, `increasedLabel`, `decreasedLabel` |
| [`MediaCard`](#mediacard) | `moreLabel` |
| [`Menu`](#menu) | `emptyLabel` |
| [`Modal`](#modal) | `navLabel`, `closeLabel` |
| [`PageHeader`](#pageheader) | `moreLabel`, `backLabel`, `breadcrumbsLabel` |
| [`PieIndicator`](#pieindicator) | `noValueLabel`, `increasedLabel`, `decreasedLabel` |
| [`Planner`](#planner) | `retryLabel`, `weekLabel`, `freeLabel`, `hiddenItemsLabel(count)`, `moreLabel`, `previousLabel`, `nextLabel`, `todayLabel`, `monthLabel` |
| [`Popover`](#popover) | `closeLabel` |
| [`PrimaryAction`](#primaryaction) | `loadingLabel`, `attentionLabel`, `menuLabel` |
| [`PrimaryNav`](#primarynav) | `moreLabel`, `submenuLabel(label)` |
| [`ProgressBar`](#progressbar) | `targetLabel`, `noValueLabel`, `increasedLabel`, `decreasedLabel` |
| [`RadarChart`](#radarchart) | `retryLabel`, `allHiddenLabel`, `pointsLabel`, `legendLabel` |
| [`RadioGroup`](#radiogroup) | `requiredLabel` |
| [`Scatter`](#scatter) | `retryLabel`, `allHiddenLabel`, `pointsLabel`, `legendLabel`, `sizeLabel` |
| [`ScheduleSlot`](#scheduleslot) | `selectedLabel` |
| [`SearchField`](#searchfield) | `clearLabel`, `label`, `loadingLabel`, `noResultsLabel`, `recentLabel`, `removeRecentLabel` |
| [`SectionTitle`](#sectiontitle) | `moreLabel` |
| [`SegmentedFilter`](#segmentedfilter) | `allLabel`, `moreLabel` |
| [`Select`](#select) | `placeholder`, `clearLabel`, `retryLabel`, `searchPlaceholder`, `searchLabel`, `loadingLabel`, `noResultsLabel`, `selectedLabel(count)` |
| [`SequenceDots`](#sequencedots) | `loadingLabel`, `noValueLabel` |
| [`ShortcutBar`](#shortcutbar) | `moreLabel(count)`, `moreName(count)`, `editLabel` |
| [`ShortcutsSheet`](#shortcutssheet) | `searchLabel`, `clearLabel`, `closeLabel`, `emptyLabel`, `ungroupedLabel`, `reservedLabel`, `orLabel` |
| [`Slider`](#slider) | `startLabel`, `endLabel` |
| [`Sparkline`](#sparkline) | `noValueLabel` |
| [`SplitButton`](#splitbutton) | `menuLabel`, `loadingLabel` |
| [`Spotlight`](#spotlight) | `nextLabel`, `previousLabel`, `skipLabel`, `doneLabel`, `progressLabel(current, total)` |
| [`StarRating`](#starrating) | `emptyLabel`, `noValueLabel`, `clearLabel` |
| [`StatValue`](#statvalue) | `increasedLabel`, `decreasedLabel` |
| [`Stepper`](#stepper) | `emptyLabel`, `previousLabel`, `nextLabel` |
| [`SubNav`](#subnav) | `moreLabel`, `submenuLabel(label)` |
| [`SummaryTile`](#summarytile) | `increasedLabel`, `decreasedLabel` |
| [`Tabs`](#tabs) | `moreLabel`, `closeLabel` |
| [`Tag`](#tag) | `removeLabel`, `stripeLabel` |
| [`TextField`](#textfield) | `clearLabel` |
| [`TopBar`](#topbar) | `searchLabel`, `backLabel`, `forwardLabel`, `moreLabel` |
| [`TrendArrow`](#trendarrow) | `upLabel`, `downLabel`, `flatLabel` |
| [`ValuePill`](#valuepill) | `levelLabel(level, steps)`, `increasedLabel`, `decreasedLabel` |
| [`VerticalNav`](#verticalnav) | `collapseLabel`, `expandLabel` |
| [`WeekStrip`](#weekstrip) | `freeLabel`, `hiddenItemsLabel(count)`, `retryLabel` |
| [`WidgetBoard`](#widgetboard) | `collapseAllLabel`, `expandAllLabel`, `retryLabel` |

## Accordion

A stack of sections that open and close. It fills its slot; an open panel scrolls inside when space is short.

**Tokens**: each with its default. It also reads the tokens of [`Card`](#card), [`ScrollArea`](#scrollarea).

| Token | Default |
|---|---|
| `--umbra-accordion-border` | `--umbra-color-base-border-subtle` (#2e2440) or `var(--umbra-card-border, var(--umbra-color-base-border-subtle))` |
| `--umbra-accordion-gap` | `--umbra-space-3` (8px) |
| `--umbra-accordion-header-height` | `calc(var(--umbra-density-control-height) + 2 * var(--umbra-space-2))` |
| `--umbra-accordion-padding` | `--umbra-density-card-padding` (16px at the default density) or `var(--umbra-card-padding, var(--umbra-density-card-padding))` |
| `--umbra-accordion-title-font` | `700 var(--umbra-density-body-size) / 1.375 var(--umbra-font-family-body)` or `var(--umbra-card-title-font, var(--umbra-font-card-title))` |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |

| Prop | Type | Purpose |
|---|---|---|
| `collapsible` | `boolean` | May every section be closed? Only matters for `type="single"`; when `false`, the open section stays open. |
| `variant` | `"plain" \| "card"` | `plain`: rules between the sections. `card`: each section looks like a card. |
| `headingLevel` | `4 \| 3 \| 2 \| 5 \| 6` | Heading level of the section titles. |
| `keepMounted` | `boolean` | Keeps the content of closed sections in the page (hidden), so it keeps its state. |
| `aria-label` | `string` | Accessible name of the group of sections. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `id` | `string` | The `id` of the root element. |
| `type` | `"single" \| "multiple"` | `single`: one section open at a time. `multiple`: any number. |
| `value` | `string \| string[] \| null` | The open section (controlled). `null` for none. The open sections (controlled). |
| `defaultValue` | `string \| string[] \| null` |  |
| `onChange` | `((value: string \| null) => void) \| ((value: string[]) => void)` | Called with the id of the open section, or `null`. Called with the ids of the open sections. |
| `items` | `AccordionItemData[]` | The sections. Or pass `Accordion.Item` elements as children. |
| `parts` | `see Parts` | Replace or hide named pieces. `item` applies to every section built from `items`. |

**Parts**: `item`.

**Blocks**: `Accordion.Root`, `Accordion.Item`, `Accordion.Section`, `Accordion.Header`, `Accordion.Panel`.

## ActionBar

The bar at the bottom of a page, card or modal: a status at the start and the actions at the end.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-action-bar-bg` | `color-mix(in oklab, var(--tone) 24%, var(--umbra-color-base-surface1))` or `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-action-bar-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-action-bar-danger-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-action-bar-gap` | `--umbra-space-3` (8px) |
| `--umbra-action-bar-info-color` | `--umbra-color-semantic-info` (#3d9be8) |
| `--umbra-action-bar-neutral-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-action-bar-offset` | `--umbra-space-5` (16px) |
| `--umbra-action-bar-padding-x` | `var(--umbra-card-padding, var(--umbra-density-card-padding))`; `--umbra-density-card-padding` (16px at the default density); `--umbra-space-4` (12px) |
| `--umbra-action-bar-padding-y` | `--umbra-space-3` (8px) |
| `--umbra-action-bar-radius` | `--umbra-radius-card` (8px) |
| `--umbra-action-bar-success-color` | `--umbra-color-semantic-success` (#16b877) |
| `--umbra-action-bar-warning-color` | `--umbra-color-semantic-warning` (#f2b23a) |
| `--umbra-icon-size` | `1.25em` |

| Prop | Type | Purpose |
|---|---|---|
| `status` | `ReactNode \| { tone?: ActionBarTone; text: ReactNode; }` | The message at the start: a node, or a tone and a text. The tone adds its icon, so it is not colour alone. |
| `actions` | `ReactNode` | The actions, as nodes. Or use `primary`, `secondary` and `tertiary`. |
| `primary` | `ReactNode \| ActionBarAction \| ActionBarAction[]` | The main action or actions, at the end. Their labels never hide. |
| `secondary` | `ReactNode \| ActionBarAction \| ActionBarAction[]` | Before the primary actions. With an icon, they keep only the icon when the bar is narrow. |
| `tertiary` | `ReactNode \| ActionBarAction \| ActionBarAction[]` | At the start, after the status. They collapse like the secondary ones. |
| `selectionCount` | `number` | Floating bar: how many things are selected. The bar is open while it is above 0, unless `open` is set. |
| `selectionLabel` | `((count: number) => string)` | The status text for a selection. |
| `onClearSelection` | `(() => void)` | Shows a button that clears the selection. |
| `clearLabel` | `string` | Accessible name of the clear button. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name of the group. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `variant` | `"inline" \| "floating"` | `inline`: in the flow, at the bottom of a page, card or modal. `floating`: over the bottom of its container. |
| `emphasis` | `"default" \| "strong"` | `strong` fills the bar with the tone, for a status the user has to act on. |
| `open` | `boolean` | Shows a `floating` bar. Its container needs `position: relative`. |
| `align` | `"start" \| "center" \| "end"` | Where the actions sit. The status is always at the start. |

**Parts**: `status`, `clear`, `tertiary`, `actions`.

**Blocks**: `ActionBar.Root`, `ActionBar.Status`, `ActionBar.Actions`, `ActionBar.Group`, `ActionBar.Action`, `ActionBar.Clear`.

## AppShell

The outermost frame: exactly the size of the window, never scrolls, bars above one `Page`.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-shell-bg` | `--umbra-context-page-background` |
| `--umbra-shell-bg-end` | `--umbra-context-page-background-end` |
| `--umbra-shell-pattern-opacity` | `0` |

| Prop | Type | Purpose |
|---|---|---|
| `topBar` | `ReactNode` | A `TopBar`. |
| `subNav` | `ReactNode` | A `SubNav`. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `children` | `ReactNode` | The `Page`. |
| `background` | `"gradient" \| "flat"` | `flat` removes the gradient and pattern. |
| `skipLabel` | `string` | Text of the "skip to content" link, the first focus stop. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `topBar`, `subNav`, `main`, `background`.

**Blocks**: `AppShell.Root`, `AppShell.Background`, `AppShell.Bars`, `AppShell.Main`.

## Avatar

A person or entity: its image, or its initials, or a silhouette.

**Tokens**: each with its default. It also reads the tokens of [`AvatarGroup`](#avatargroup).

| Token | Default |
|---|---|
| `--umbra-avatar-bg` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-avatar-fallback-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-avatar-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-avatar-radius` | `--umbra-radius-control` (4px) |
| `--umbra-avatar-ring` | `--umbra-color-fixed-accent-text` (#f77bf0) |
| `--umbra-avatar-size` | `--umbra-density-control-height` (36px at the default density); `18px`; `24px`; `32px`; `48px`; `72px` |
| `--umbra-avatar-status-size` | `max(8px, calc(var(--size) * 0.28))` |

| Prop | Type | Purpose |
|---|---|---|
| `src` | `string` | The image. When it is missing or fails to load, the initials or the silhouette show instead. |
| `alt` | `string` | Accessible name. Defaults to `name`. Pass `""` when the name is written next to the avatar. |
| `name` | `string` | The person or entity. Gives the initials shown without an image. |
| `fallbackIcon` | `ReactNode` | Replaces the silhouette shown when there is no image and no name. |
| `status` | `ReactNode` | A small node at the corner, for example a status dot. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `size` | `AvatarSize` | Fixed size. Without it the avatar is as tall as a control, so it follows the density level. |
| `shape` | `AvatarShape` |  |
| `ring` | `string \| boolean` | A ring around the avatar: `true` for the accent colour, or any CSS colour. |

**Parts**: `image`, `initials`, `fallback`, `status`.

**Blocks**: `Avatar.Root`, `Avatar.Image`, `Avatar.Initials`, `Avatar.Fallback`, `Avatar.Status`.

## AvatarGroup

A row of overlapping avatars. Those that do not fit are counted in a "+N" at the end.

**Tokens**: each with its default. It also reads the tokens of [`Avatar`](#avatar).

| Token | Default |
|---|---|
| `--umbra-avatar-group-border` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-avatar-group-overlap` | `0.16` |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The avatars. |
| `max` | `number` | Shows at most this many avatars; the rest are counted in "+N". Fewer show when the group is narrow. |
| `total` | `number` | The number of members, when it is larger than the number of avatars given. |
| `moreLabel` | `((count: number) => string)` | Accessible name of the "+N" counter. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Names the group for assistive technology. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `size` | `AvatarSize` | Size and shape of every avatar in the group. |
| `shape` | `AvatarShape` |  |

**Parts**: `overflow`.

**Blocks**: `AvatarGroup.Root`, `AvatarGroup.Overflow`.

## Badge

A count or a dot, alone or on the corner of another element.

**Tokens**: each with its default. It also reads the tokens of [`Button`](#button).

| Token | Default |
|---|---|
| `--umbra-badge-bg` | `var(--tone)` or `color-mix(in oklab, var(--tone), var(--umbra-color-base-text-primary) var(--umbra-badge-dot-lighten, 25%))` |
| `--umbra-badge-dot-lighten` | `25%` |
| `--umbra-badge-dot-size` | `--umbra-space-3` (8px) |
| `--umbra-badge-fg` | `var(--on-tone)` |
| `--umbra-badge-font` | `700 11px / var(--size) var(--umbra-font-family-body)` |
| `--umbra-badge-offset` | `--umbra-space-2` (4px) |
| `--umbra-badge-padding-x` | `--umbra-space-2` (4px) |
| `--umbra-badge-radius` | `--umbra-radius-pill` (999px) |
| `--umbra-badge-ring` | `transparent` |
| `--umbra-badge-ring-width` | `1px` |
| `--umbra-badge-size` | `var(--umbra-icon-button-badge-size, 14px)` or `--umbra-space-5` (16px) |

| Prop | Type | Purpose |
|---|---|---|
| `count` | `number` | The number to show. |
| `dot` | `boolean` | Shows a dot instead of a number. |
| `max` | `number` | Counts above this show as "99+". |
| `showZero` | `boolean` | Shows the badge when `count` is 0. |
| `label` | `string \| ((count: number) => string)` | What a screen reader hears: a string, or a function of the count (`(n) => n + ' unread'`). By default the full count is read, also above `max`. A dot is silent without it. |
| `decorative` | `boolean` | Draws the count without making it text of the page, and hides the badge from assistive technology. For a badge inside a control whose own name already holds the count, as `IconButton` does. |
| `children` | `ReactNode` | The element the badge sits on the corner of. Without it the badge stands alone. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `Tone` | What the colour means. `accent` is the fixed violet. |
| `color` | `string` | A custom colour (any CSS colour). Replaces `tone`. |

**Parts**: `indicator`.

**Blocks**: `Badge.Root`, `Badge.Indicator`.

## Banner

A message band inside a card or page: a notice, a warning, or an insight about the data beside it.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-banner-accent-color` | `--umbra-color-fixed-accent-text` (#f77bf0) |
| `--umbra-banner-bg` | `color-mix(in oklab, var(--tone) var(--umbra-banner-subtle-strength, 16%), transparent)`; `var(--tone)`; `--umbra-color-fixed-selected` (#6a1fd6); `transparent` |
| `--umbra-banner-border` | `color-mix(in oklab, var(--tone) 45%, transparent)`; `transparent`; `var(--tone)` |
| `--umbra-banner-danger-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-banner-dismiss-size` | `var(--row)` |
| `--umbra-banner-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-banner-focus-color` | `var(--fg)` |
| `--umbra-banner-focus-offset` | `1px` or `calc(-1 * var(--umbra-state-focus-ring-width))` |
| `--umbra-banner-icon-color` | `var(--tone)` or `var(--fg)` |
| `--umbra-banner-info-color` | `--umbra-color-semantic-info` (#3d9be8) |
| `--umbra-banner-neutral-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-banner-padding-x` | `--umbra-space-4` (12px) |
| `--umbra-banner-padding-y` | `--umbra-space-1` (2px) |
| `--umbra-banner-radius` | `--umbra-radius-control` (4px) |
| `--umbra-banner-row-height` | `--umbra-density-control-height` (36px at the default density) or `--umbra-density-table-row` (26px at the default density) |
| `--umbra-banner-solid-fg` | `--umbra-color-base-surface1` (#0b0612) or `--umbra-color-fixed-on-selected` (#ffffff) |
| `--umbra-banner-stripe-width` | `--umbra-space-2` (4px) |
| `--umbra-banner-subtle-strength` | `16%` |
| `--umbra-banner-success-color` | `--umbra-color-semantic-success` (#16b877) |
| `--umbra-banner-warning-color` | `--umbra-color-semantic-warning` (#f2b23a) |
| `--umbra-icon-size` | `1.25em` |

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` | The headline, in bold. |
| `children` | `ReactNode` | The description. |
| `icon` | `ReactNode` | Replaces the tone's default icon. `null` hides it. |
| `actions` | `ReactNode` | Trailing controls, usually one or two buttons. They move below the text when the banner is narrow. |
| `dismissible` | `boolean` | Shows a dismiss button. |
| `dismissLabel` | `string` | Accessible name of the dismiss button. |
| `maxLines` | `number` | Clamps the description to this many lines. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `compact` | `boolean` | One line: the title and the description share it and truncate. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `BannerTone` | What the message is. Each tone has its own colour and its own default icon. |
| `variant` | `BannerVariant` | `subtle`: tinted fill. `solid`: filled with the tone colour. `outline`: border only. |
| `emphasis` | `"default" \| "insight"` | `insight` adds a stripe on the leading edge, for a finding or recommendation about the data beside it. |
| `live` | `"polite" \| "assertive" \| "off"` | How a screen reader announces the banner when it appears. `polite` is a `status`, `assertive` an `alert`, `off` is not announced. Defaults to `assertive` for the `danger` tone and `polite` otherwise. |
| `open` | `boolean` | Controlled visibility. Set it to `false` in `onDismiss`. |
| `defaultOpen` | `boolean` |  |
| `onDismiss` | `(() => void)` | Called when the dismiss button is pressed. |

**Parts**: `icon`, `title`, `description`, `actions`, `dismiss`.

**Blocks**: `Banner.Root`, `Banner.Icon`, `Banner.Content`, `Banner.Title`, `Banner.Description`, `Banner.Actions`, `Banner.Dismiss`.

## BarChart

Compares values across categories: grouped, stacked or diverging around zero, upright or sideways.

**Tokens**: each with its default. It also reads the tokens of [`Heatmap`](#heatmap), [`Legend`](#legend), [`Scatter`](#scatter).

| Token | Default |
|---|---|
| `--umbra-chart-annotation` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-annotation-dash` | `5 3` |
| `--umbra-chart-annotation-width` | `1.5px` |
| `--umbra-chart-area-opacity` | `0.22` |
| `--umbra-chart-axis` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-axis-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-edge-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-opacity` | `0.16` |
| `--umbra-chart-bar-radius` | `2px` |
| `--umbra-chart-center-font` | `--umbra-font-title` |
| `--umbra-chart-content-height` | `240px` |
| `--umbra-chart-dim-opacity` | `0.25` |
| `--umbra-chart-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-font` | `--umbra-font-label` |
| `--umbra-chart-gap` | `--umbra-space-3` (8px) |
| `--umbra-chart-grid` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-grid-dash` | `1 4` |
| `--umbra-chart-grid-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-info` | `--umbra-color-semantic-info` (#3d9be8) |
| `--umbra-chart-label-halo` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-chart-line-width` | `2px` |
| `--umbra-chart-negative` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-chart-outline-width` | `1.5px` |
| `--umbra-chart-point-scale` | `1` |
| `--umbra-chart-positive` | `--umbra-color-semantic-success` (#16b877) |
| `--umbra-chart-ring-width` | `1.5px` |
| `--umbra-chart-tooltip-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-chart-tooltip-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-chart-tooltip-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-chart-tooltip-max-width` | `20rem` |
| `--umbra-chart-tooltip-radius` | `--umbra-radius-control` (4px) |
| `--umbra-chart-track` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-chart-track-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-track-border-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-value` | `--umbra-color-series-1` (#4a94e8) |
| `--umbra-chart-value-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-chart-warning` | `--umbra-color-semantic-warning` (#f2b23a) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-series-marker-size` | `0.875rem` |

| Prop | Type | Purpose |
|---|---|---|
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name of the chart. Required unless `aria-labelledby` is set. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `variant` | `"stacked" \| "grouped" \| "diverging"` | `grouped`: the series side by side. `stacked`: on top of each other. `diverging`: every second series is drawn on the other side of zero, with all values shown as positive. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `orientation` | `"vertical" \| "horizontal"` | `horizontal` puts the categories on the left and draws the bars sideways. |
| `hiddenIds` | `readonly string[]` | Ids of the series that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |
| `thresholds` | `ThresholdList<BarThreshold>` | Colours bars by the band of their value: an ascending list of `{ from, tone?, color?, label? }`, or plain numbers as boundaries on the value ramp. Each band also has a fill, so the bands differ without colour, and its `label` joins the value in the tooltip and for screen readers. |
| `lowerIsBetter` | `boolean` | For a scale where low is good: mirrors the colours and fills of the bands. The labels stay. |
| `formatValue` | `((value: number) => string)` | Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. |
| `height` | `number \| "content" \| "fill"` | `fill` (default) takes the height of the parent, and falls back to the content's height in a parent that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content: the plot is `--umbra-chart-content-height` (240px) high. A number is a height in pixels. |
| `description` | `string` | What a screen reader hears after the name. Defaults to a generated summary of the data. |
| `labels` | `boolean` | Draws labels on the chart itself, so it can be read without the legend or the tooltip. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `series` (required) | `BarSeries[]` |  |
| `aria-labelledby` | `string` | Id of the element that names the chart, for example a card title. |
| `categories` (required) | `string[]` |  |
| `colorBy` | `"series" \| "sign"` | `sign` colours bars by the sign of their value; negative bars are also striped. |
| `valueDomain` | `[number, number]` | The range of the value axis. Defaults to round numbers around the data, with zero. |
| `annotations` | `ChartAnnotation[]` | Reference lines and bands on the value axis. |
| `xTitle` | `string` | Title of the horizontal axis. |
| `yTitle` | `string` | Title of the vertical axis. |
| `legend` | `string \| number \| bigint \| boolean \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| ReactPortal \| Promise<string \| number \| bigint \| boolean \| ReactPortal \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| null \| undefined> \| null` | The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it. By default it is shown below the chart when there is more than one series. |
| `onPointPress` | `((point: ChartPoint) => void)` | Called when a point is clicked, or activated with Enter or Space. |
| `allHiddenLabel` | `string` | Shown in place of the plot when the legend has switched every series off. |
| `pointsLabel` | `string` | Accessible name of the list of data points. |
| `legendLabel` | `string` | Accessible name of the legend. |

**Parts**: `legend`, `tooltip`, `skeleton`, `empty`, `error`.

**Blocks**: `BarChart.Root`, `BarChart.Grid`, `BarChart.Annotations`, `BarChart.Bars`, `BarChart.Axes`, `BarChart.ValueLabels`.

## Button

Triggers an action. Text, with an optional icon.

**Tokens**: each with its default. It also reads the tokens of [`Badge`](#badge), [`IconButton`](#iconbutton).

| Token | Default |
|---|---|
| `--umbra-button-accent-bg` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-button-accent-border` | `transparent` |
| `--umbra-button-accent-fg` | `--umbra-color-fixed-on-selected` (#ffffff) |
| `--umbra-button-danger-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-button-danger-border` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-button-danger-fg` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-button-ghost-bg` | `transparent` |
| `--umbra-button-ghost-border` | `transparent` |
| `--umbra-button-ghost-fg` | `currentColor` |
| `--umbra-button-height` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-button-neutral-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-button-neutral-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-button-neutral-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-button-padding-x` | `--umbra-space-4` (12px) |
| `--umbra-button-pressed-color` | `--umbra-color-fixed-accent-text` (#f77bf0) |
| `--umbra-button-primary-bg` | `--umbra-color-fixed-primary` (#db1065) |
| `--umbra-button-primary-border` | `transparent` |
| `--umbra-button-primary-fg` | `--umbra-color-fixed-on-primary` (#ffffff) |
| `--umbra-button-radius` | `--umbra-radius-control` (4px) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label. |
| `variant` | `ButtonVariant` | `primary`: the single main action of a screen. `accent`: the confirming action of a group. |
| `iconStart` | `ReactNode` |  |
| `iconEnd` | `ReactNode` |  |
| `size` | `"default" \| "small"` | `small` is for use inside table cells. Otherwise the height follows the density level. |
| `loading` | `boolean` | Shows the spinner and blocks presses. The button stays focusable. |
| `loadingLabel` | `string` | What a screen reader hears while `loading`. |
| `disabled` | `boolean` |  |
| `href` | `string` | Renders a link that looks like a button. |
| `shortcut` | `string` | Id of a shortcut in the provider's list: binds the key and shows the hint in the tooltip. |
| `fullWidth` | `boolean` |  |
| `collapseTo` | `"icon"` | With an icon set, hides the label when the button does not fit; the label becomes its tooltip and name. |
| `type` | `"button" \| "submit" \| "reset"` |  |
| `onPress` | `(() => void)` |  |
| `pressed` | `boolean` | Makes it a toggle. While `true` it takes the accent colour, an outline, and its icons are drawn filled. |
| `onPressedChange` | `((pressed: boolean) => void)` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `iconStart`, `label`, `iconEnd`, `spinner`.

**Blocks**: none.

## Card

The container for one unit of content on a page. Fills the slot its parent gives it and scrolls its own body when the content is taller.

**Tokens**: each with its default. It also reads the tokens of [`ActionBar`](#actionbar), [`PageHeader`](#pageheader).

| Token | Default |
|---|---|
| `--umbra-card-bg` | `--umbra-context-card-tint`; `--umbra-context-card-tint-strong`; `--umbra-color-base-surface-neutral` (#141a22) |
| `--umbra-card-border` | `--umbra-color-base-border-subtle` (#2e2440); `color-mix(in oklab, var(--umbra-context) 30%, var(--umbra-color-base-border-subtle))`; `--umbra-color-base-border-neutral` (#232b36) |
| `--umbra-card-header-bg` | `transparent` or `--umbra-color-brand` (#2a2f8f) |
| `--umbra-card-header-fg` | `inherit` or `var(--umbra-color-on-brand, #fff)` |
| `--umbra-card-header-height` | `auto` |
| `--umbra-card-min-height` | `--umbra-density-card-min-height` (88px at the default density) |
| `--umbra-card-padding` | `--umbra-density-card-padding` (16px at the default density) |
| `--umbra-card-radius` | `--umbra-radius-card` (8px) |
| `--umbra-card-title-font` | `--umbra-font-card-title` |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` | Header title. The header is shown when it is set. |
| `loading` | `boolean` | Shows the body skeleton. |
| `empty` | `ReactNode \| DataStateContent` | Shown in place of the body when set (and not loading or in error): text or a node, or `{ title, description, icon, action }` for the same empty state as the other data components. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the body when set: text or a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `parts` | `see Parts` | Replace or hide named pieces. `toolbar` and `footer` are empty unless given, as `Card.Toolbar` and `Card.Footer`. |
| `tone` | `"neutral" \| "default" \| "tinted"` | `tinted` takes more of the context tint; `neutral` ignores it. |
| `headerStyle` | `"plain" \| "band"` | `band` fills the header with the brand colour, or the header's `bandColor`. |
| `padding` | `"default" \| "none"` | `none` for edge-to-edge tables and media. |
| `collapsible` | `boolean` | Lets the end user collapse the card to its header. |
| `collapsed` | `boolean` | Controlled collapse state. |
| `defaultCollapsed` | `boolean` |  |
| `onCollapsedChange` | `((collapsed: boolean) => void)` |  |
| `headingLevel` | `4 \| 3 \| 2 \| 5 \| 6` | Heading level of the title. |
| `aria-label` | `string` | Accessible name, for a card without a title. |
| `collapseLabel` | `string` | Accessible names of the collapse caret and of the header of a card the layout has collapsed. |
| `expandLabel` | `string` |  |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `id` | `string` | The `id` of the root element. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link for `href`. Defaults to a plain `<a>`. |
| `moreLabel` | `string` | Accessible name of the overflow menu button. |
| `icon` | `ReactNode` | Leading icon or image. |
| `subtitle` | `ReactNode` | Second line, in the body font. |
| `actions` | `ReactNode` | Trailing controls. They move into an overflow menu when they do not fit. |
| `href` | `string` | Makes the title a link. |
| `onOpen` | `(() => void)` |  |

**Parts**: `header`, `title`, `actions`, `toolbar`, `body`, `footer`, `skeleton`.

**Blocks**: `Card.Root`, `Card.Header`, `Card.Title`, `Card.Actions`, `Card.Toolbar`, `Card.Body`, `Card.Footer`.

## Checkbox

A box that is checked or not: one yes-or-no choice, or one of several in a `CheckboxGroup`.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-checkbox-bg` | `transparent` |
| `--umbra-checkbox-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-checkbox-border-width` | `calc(var(--umbra-border-width) * 2)` |
| `--umbra-checkbox-gap` | `--umbra-space-3` (8px) |
| `--umbra-checkbox-invalid-border` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-checkbox-mark-color` | `--umbra-color-fixed-on-selected` (#ffffff) |
| `--umbra-checkbox-radius` | `--umbra-radius-control` (4px) |
| `--umbra-checkbox-selected-bg` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-checkbox-size` | `calc(var(--umbra-density-control-height) / 2)` |
| `--umbra-checkbox-small-size` | `calc(var(--umbra-density-table-row) / 2 + 2px)` |
| `--umbra-field-description-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-field-error-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-field-marker-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-option-group-gap` | `--umbra-space-3` (8px) |
| `--umbra-option-group-inline-gap` | `--umbra-space-6` (20px) |
| `--umbra-option-group-min-option-width` | `12em` |
| `--umbra-option-group-text-gap` | `--umbra-space-2` (4px) |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label. |
| `description` | `ReactNode` | A second line under the label. |
| `error` | `ReactNode` | An error message under the checkbox, shown with an icon. Setting it makes the checkbox invalid. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `indeterminate` | `boolean` | Shows the "some, not all" mark, whatever `checked` is. |
| `invalid` | `boolean` |  |
| `value` | `string` | The form value when checked; inside a `CheckboxGroup`, the entry in the group's `value`. |
| `onChange` | `((checked: boolean) => void)` |  |
| `aria-label` | `string` | Accessible name of a checkbox that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` |  |
| `size` | `"default" \| "small"` | `small` is for use inside table cells. Otherwise the size follows the density level. |
| `disabled` | `boolean` |  |
| `checked` | `boolean` | Controlled state. |
| `defaultChecked` | `boolean` |  |
| `readOnly` | `boolean` | Focusable, but cannot be changed. |
| `required` | `boolean` |  |
| `requiredLabel` | `string` | The text of the required marker after the label. |
| `name` | `string` | Form field name. |

**Parts**: `box`, `label`, `description`, `error`.

**Blocks**: `Checkbox.Root`, `Checkbox.Box`, `Checkbox.Label`, `Checkbox.Description`, `Checkbox.Error`.

## CheckboxGroup

Several checkboxes that answer one question, with a shared label, description and error.

**Tokens**: each with its default. It also reads the tokens of [`Checkbox`](#checkbox).

| Token | Default |
|---|---|
| `--umbra-field-description-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-field-error-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-field-marker-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-option-group-gap` | `--umbra-space-3` (8px) |
| `--umbra-option-group-inline-gap` | `--umbra-space-6` (20px) |
| `--umbra-option-group-min-option-width` | `12em` |
| `--umbra-option-group-text-gap` | `--umbra-space-2` (4px) |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The checkboxes. |
| `label` | `ReactNode` | The group's label. |
| `description` | `ReactNode` | A line under the label. |
| `error` | `ReactNode` | An error message under the checkboxes, shown with an icon. Setting it makes the group invalid. |
| `columns` | `number` | Lays the checkboxes in a grid of at most this many columns; columns drop as the group narrows. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `invalid` | `boolean` |  |
| `value` | `string[]` | Controlled: the `value` of every checked checkbox. |
| `onChange` | `((value: string[]) => void)` |  |
| `aria-label` | `string` | Accessible name of a group that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` |  |
| `orientation` | `"vertical" \| "horizontal"` | `horizontal` puts the checkboxes on one line, wrapping when they do not fit. |
| `disabled` | `boolean` |  |
| `readOnly` | `boolean` |  |
| `required` | `boolean` | At least one checkbox must be checked. |
| `requiredLabel` | `string` | The text of the required marker after the group label. |
| `name` | `string` | Form field name of every checkbox in the group. |
| `defaultValue` | `string[]` |  |

**Parts**: `label`, `description`, `options`, `error`.

**Blocks**: `CheckboxGroup.Root`, `CheckboxGroup.Label`, `CheckboxGroup.Description`, `CheckboxGroup.Options`, `CheckboxGroup.Error`.

## ColorScaleEditor

Edits a scale of value bands and their colours: the `thresholds` that `ValuePill`, `ProgressBar`, `LevelMeter`, `BarChart` and `DonutChart` take. With `readOnly` it is the preview row alone.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |

| Prop | Type | Purpose |
|---|---|---|
| `parts` | `see Parts` | Replace or hide named pieces. |
| `invalid` | `boolean` |  |
| `value` | `readonly Threshold[]` | Controlled value: the stops, ascending. The `thresholds` of every component that colours by value. |
| `onChange` | `((value: Threshold[]) => void)` |  |
| `aria-label` | `string` | Accessible name, when no `FormField` names it. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` |  |
| `disabled` | `boolean` |  |
| `min` | `number` | The bottom of the scale: the `from` of the first stop. Defaults to the first stop's own `from`. |
| `max` | `number` | The top of the scale. |
| `formatValue` | `((value: number) => string)` | The text of a boundary. |
| `readOnly` | `boolean` | Preview only: the row of swatches, with nothing to edit. |
| `name` | `string` | Form field name: the value is sent as JSON. |
| `defaultValue` | `readonly Threshold[]` | The stops to start from, and what the reset button goes back to (in controlled use too). |
| `step` | `number` | The distance between two boundaries. |
| `minStops` | `number` | Fewest stops: the remove buttons are disabled at this number. |
| `maxStops` | `number` | Most stops: the add button is disabled at this number. |
| `stopLabel` | `string` | The word for one stop: "Stop 2". |
| `fromLabel` | `string` | Names the boundary field of a stop. |
| `colorLabel` | `string` | Names the colour choice of a stop. |
| `nameLabel` | `string` | Names the label field of a stop, and is its placeholder. |
| `removeLabel` | `string` |  |
| `addLabel` | `string` |  |
| `resetLabel` | `string` |  |
| `trackLabel` | `string` | Names the track with the boundary handles. |
| `toneLabels` | `Partial<Record<"default" \| ThresholdTone \| "custom", string>>` | The names of the colour choices. |
| `formatAnnouncement` | `((change: ColorScaleChange) => string)` | What a screen reader hears after a stop is added or removed, and after a reset. |

**Parts**: `preview`, `track`, `stops`, `actions`.

**Blocks**: `ColorScaleEditor.Root`, `ColorScaleEditor.Preview`, `ColorScaleEditor.Track`, `ColorScaleEditor.Stops`, `ColorScaleEditor.Actions`.

## Columns

Shares its width among its children. Below the minimum window it shows one child at a time.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-layout-gap` | `--umbra-density-gap` (20px at the default density) |

| Prop | Type | Purpose |
|---|---|---|
| `gap` | `0 \| 4 \| 3 \| 1 \| 2 \| 5 \| 6 \| 7 \| 8 \| 9` | Overrides the gap, which otherwise follows the density level. |
| `narrow` | `"tabs" \| "keep"` | When there is no room for the columns (below the minimum window, or when the children cannot all have their `minWidth`): `tabs` shows one child at a time, `keep` keeps the columns. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `tabsLabel` | `string` | Accessible name of the tab strip. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `id` | `string` | The `id` of the root element. |

**Parts**: `tabs`.

**Blocks**: none.

## CommandPalette

A search over everything the app can do or open, in a dialog near the top of the window. Opened by the `TopBar` search and by `Mod+K`. Focus stays in the input; the arrow keys move through the results.

**Tokens**: each with its default. It also reads the tokens of [`ScrollArea`](#scrollarea).

| Token | Default |
|---|---|
| `--umbra-command-palette-active-bg` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-command-palette-active-fg` | `--umbra-color-fixed-on-selected` (#ffffff) |
| `--umbra-command-palette-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-command-palette-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-command-palette-item-height` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-command-palette-max-height` | `480px` |
| `--umbra-command-palette-offset` | `min(12vh, 96px)` |
| `--umbra-command-palette-radius` | `--umbra-radius-card` (8px) |
| `--umbra-command-palette-scrim` | `--umbra-color-base-scrim` (rgba(5, 2, 10, 0.72)) |
| `--umbra-command-palette-width` | `640px` |
| `--umbra-command-palette-z-index` | `--umbra-layer-palette` (1300) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |

| Prop | Type | Purpose |
|---|---|---|
| `commands` | `Command[]` | A fixed list. The palette filters and ranks it as the user types. |
| `onQuery` | `((text: string, page: Command \| undefined) => Command[] \| Promise<Command[]>)` | Called with the text (after `debounce`) and the open page, for results the app looks up. They are listed after the matches from `commands`, as given. An answer that arrives late is dropped. |
| `debounce` | `number` | Milliseconds to wait after the last key before `onQuery` is called. |
| `loading` | `boolean` | Shows the loading rows, in addition to the time `onQuery` takes. |
| `error` | `ReactNode` | Shows the error state: text, a node, or `true` for the default text. A failed `onQuery` shows it too. |
| `recent` | `string[]` | Ids of recently used commands, newest first. Listed first while the input is empty. |
| `includeShortcuts` | `boolean` | Lists every shortcut of the provider's registry that has a label, with its keys. |
| `open` | `boolean` | Controlled state. |
| `defaultOpen` | `boolean` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onRun` | `((command: Command) => void)` | Called with every command the user runs, after its own `onRun`. |
| `navigate` | `((href: string) => void)` | Called with the `href` of a command that has one. Defaults to a full page navigation. |
| `shortcut` | `string \| null` | Id of the shortcut that opens and closes the palette. `null` binds none. |
| `aria-label` | `string` | Accessible name of the dialog and of the input. |
| `label` | `string` |  |
| `placeholder` | `string` |  |
| `emptyLabel` | `string` |  |
| `errorLabel` | `string` |  |
| `retryLabel` | `string` |  |
| `loadingLabel` | `string` |  |
| `recentLabel` | `string` |  |
| `shortcutsLabel` | `string` |  |
| `resultsLabel` | `string` | Accessible name of the list of results. |
| `backLabel` | `string` | Accessible name of the breadcrumb button that leaves the open page. |
| `moveHint` | `string` | The key hints in the footer. |
| `enterKeyLabel` | `string` | The names of the keys in the footer hints. |
| `backspaceKeyLabel` | `string` |  |
| `escapeKeyLabel` | `string` |  |
| `runHint` | `string` |  |
| `backHint` | `string` |  |
| `closeHint` | `string` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` | On the palette's panel. |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `searchIcon`, `item`, `sectionHeader`, `empty`, `footer`.

**Blocks**: none.

## Comparison

Two sides compared on a list of metrics: a value on each side of every label, with bars from the centre.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-comparison-bar-height` | `0.25rem` |
| `--umbra-comparison-border` | `--umbra-color-base-border-subtle` (#2e2440) |
| `--umbra-comparison-color` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-comparison-font` | `--umbra-font-label` |
| `--umbra-comparison-leader-size` | `0.375rem` |
| `--umbra-comparison-row-height` | `--umbra-density-table-row` (26px at the default density) |
| `--umbra-comparison-row-padding` | `--umbra-space-2` (4px) |
| `--umbra-comparison-secondary-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-comparison-strip-bg` | `color-mix(in oklab, #000 var(--umbra-state-press-darken-strong), transparent)` |
| `--umbra-comparison-summary-font` | `--umbra-font-display` |
| `--umbra-comparison-track` | `color-mix(in oklab, currentColor 12%, transparent)` |

| Prop | Type | Purpose |
|---|---|---|
| `sides` (required) | `readonly [ComparisonSide, ComparisonSide]` | The two things compared: the first at the start of each row, the second at its end. |
| `rows` (required) | `readonly ComparisonRow[]` | One row per metric. |
| `summary` | `ComparisonSummary` | A large pair of values in the middle of the header, with a caption. |
| `showBars` | `boolean` | Draws each row's two values as bars that grow from the centre. |
| `highlightLeader` | `boolean` | Marks the side that leads each row, by weight and a mark. |
| `formatValue` | `((value: number, row: ComparisonRow) => ReactNode)` | Text of a value. |
| `emptyLabel` | `ReactNode` | Shown in place of a value that is missing. |
| `metricLabel` | `string` | The header of the label column, for assistive technology. |
| `summaryLabel` | `string` | The name of the summary row for assistive technology, when it has no caption. |
| `leaderLabel` | `string` | What assistive technology reads with a leading value. |
| `skeletonRows` | `number` | Number of placeholder rows while `loading`. |
| `aria-label` | `string` | Names the comparison for assistive technology. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `variant` | `"strip" \| "table"` | `strip` is one line: the two names around one pair of values. |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `height` | `FillHeight` | `fill` (default) takes the slot's height, `content` its own, a number that many pixels. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `highlightChanges` | `boolean` | A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise. A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value is never counted up or down. |
| `increasedLabel` | `string` | What a screen reader hears with the sign of a value that rose or fell. |
| `decreasedLabel` | `string` |  |

**Parts**: `header`, `side`, `summary`, `row`, `label`, `value`, `bars`, `strip`, `skeleton`, `state`.

**Blocks**: `Comparison.Root`, `Comparison.Table`, `Comparison.Header`, `Comparison.Side`, `Comparison.Summary`, `Comparison.Body`, `Comparison.Row`, `Comparison.Label`, `Comparison.Value`, `Comparison.Bars`, `Comparison.Strip`.

## ConfirmDialog

The confirm step before an action that cannot be undone. An alert dialog: it opens with the focus on Cancel, and cannot be dismissed by a press outside it.

**Tokens**: none of its own. It also reads the tokens of [`Modal`](#modal).

| Prop | Type | Purpose |
|---|---|---|
| `title` (required) | `ReactNode` |  |
| `description` | `ReactNode` | What will happen, in a sentence. |
| `confirmLabel` | `string` |  |
| `cancelLabel` | `string` |  |
| `tone` | `"danger" \| "default"` | `danger` makes the confirm button a danger button. |
| `onConfirm` | `(() => void \| Promise<unknown>)` | Called on confirm. When it returns a promise, the confirm button shows `loading` until it settles: the dialog closes when it resolves and stays open when it rejects. |
| `onCancel` | `(() => void)` |  |
| `loadingLabel` | `string` | What a screen reader hears while the confirm action runs. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `icon` | `ReactNode` | Leading icon or image. |
| `open` | `boolean` | Controlled open state. |
| `defaultOpen` | `boolean` |  |
| `size` | `ModalSize` | Width. `full` fills the window minus a margin. A bottom drawer is always as wide as the window. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `trigger` | `ReactNode` | A button that opens the modal. Leave out to control it with `open`. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `cancel`, `confirm`.

**Blocks**: none.

## ContextBlock

The two-line status of a `TopBar`, with a short value in a chip, usually the time.

**Tokens**: none of its own.

| Prop | Type | Purpose |
|---|---|---|
| `primary` | `ReactNode` | The main line. |
| `secondary` | `ReactNode` | The quieter second line. |
| `chip` | `ReactNode` | The chip's content: any short value. Wins over `time`. |
| `time` | `string \| number \| Date` | A moment, shown in the chip in the provider's locale: a `Date`, an ISO string or milliseconds. |
| `timeFormat` | `Intl.DateTimeFormatOptions` | How `time` is written. Defaults to hour and minute. |
| `live` | `boolean` | Makes the chip a clock: it starts at `time`, or at the device's time, and moves on each minute. Nothing is announced. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link. Defaults to a plain `<a>`. |
| `aria-label` | `string` | Replaces the name a button or link takes from its lines. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `href` | `string` | Makes the block a link. |
| `disabled` | `boolean` |  |
| `onPress` | `(() => void)` | Makes the block a button. |

**Parts**: `primary`, `secondary`, `chip`.

**Blocks**: `ContextBlock.Root`, `ContextBlock.Text`, `ContextBlock.Primary`, `ContextBlock.Secondary`, `ContextBlock.Chip`.

## DataTable

A table of rows and columns that fills its slot and scrolls inside it: sorting, selection, groups, pinned columns, and columns that hide by priority as it narrows.

**Tokens**: each with its default. It also reads the tokens of [`Checkbox`](#checkbox), [`GroupHeader`](#groupheader), [`Radio`](#radio), [`ScrollArea`](#scrollarea).

| Token | Default |
|---|---|
| `--umbra-change-down` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-change-neutral` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-change-up` | `--umbra-color-semantic-success` (#16b877) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-table-border-color` | `--umbra-color-base-border-subtle` (#2e2440) |
| `--umbra-table-caption-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-table-cell-padding-x` | `--umbra-space-3` (8px) |
| `--umbra-table-change-down` | `var(--umbra-change-down, var(--umbra-color-semantic-danger))` |
| `--umbra-table-change-neutral` | `var(--umbra-change-neutral, var(--umbra-color-base-text-primary))` |
| `--umbra-table-change-up` | `var(--umbra-change-up, var(--umbra-color-semantic-success))` |
| `--umbra-table-color` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-table-control-size` | `calc(var(--row-h) - 2px)` |
| `--umbra-table-detail-bg` | `color-mix(in oklab, #000 var(--umbra-state-press-darken), var(--surface))` |
| `--umbra-table-edge-padding-x` | `--umbra-density-card-padding` (16px at the default density) |
| `--umbra-table-focus-offset` | `calc(-1 * var(--umbra-state-focus-ring-width))` |
| `--umbra-table-font` | `--umbra-font-table-cell` |
| `--umbra-table-footer-bg` | `var(--umbra-table-header-bg, var(--surface))` |
| `--umbra-table-header-active-color` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-table-header-bg` | `var( --umbra-table-row-bg, var(--umbra-scroll-fade-color, var(--scroll-fade-color, var(--umbra-context-card-tint))) )` |
| `--umbra-table-header-border-color` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-table-header-color` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-table-header-font` | `--umbra-font-label` |
| `--umbra-table-header-group-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-table-header-height` | `calc(var(--row-h) + var(--umbra-space-2))` |
| `--umbra-table-highlight-bg` | `color-mix(in oklab, var(--umbra-color-fixed-accent-text) 14%, var(--surface))` |
| `--umbra-table-highlight-marker` | `--umbra-color-fixed-accent-text` (#f77bf0) |
| `--umbra-table-hover-bg` | `color-mix(in oklab, var(--umbra-color-base-text-primary) 8%, var(--bg))` |
| `--umbra-table-pin-border-color` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-table-row-bg` | `var(--umbra-scroll-fade-color, var(--scroll-fade-color, var(--umbra-context-card-tint)))` |
| `--umbra-table-row-height` | `--umbra-density-table-row` (26px at the default density) |
| `--umbra-table-selected-bg` | `color-mix(in oklab, var(--umbra-color-fixed-selected) 32%, var(--surface))` |
| `--umbra-table-stripe-bg` | `color-mix(in srgb, var(--umbra-color-base-text-primary) var(--umbra-state-stripe-strength), var(--surface))` |
| `--umbra-table-stripe-width` | `3px` |

| Prop | Type | Purpose |
|---|---|---|
| `data` (required) | `Row[]` | The rows. Keep the array stable between renders (state or a memo): a new array is sorted again. |
| `getRowId` (required) | `(row: Row) => string` | A stable, unique id for a row. Selection, highlight, focus and change highlighting are kept by it. |
| `columns` (required) | `DataTableColumn<Row>[]` | The columns, in order. Pinned columns move to their edge. Keep the array stable between renders. |
| `columnGroups` | `DataTableColumnGroup[]` | Headers that span several columns, in a row above the column headers. |
| `sort` | `DataTableSort[]` | Controlled sort order: the first entry sorts first. |
| `defaultSort` | `DataTableSort[]` |  |
| `onSortChange` | `((sort: DataTableSort[]) => void)` |  |
| `multiSort` | `boolean` | Shift+click or Shift+Enter on a header adds it to the sort instead of replacing it. |
| `manualSorting` | `boolean` | The rows arrive sorted (by a server): headers still show and report the sort, the table does not reorder. |
| `selectionMode` | `"none" \| "single" \| "multiple"` | Lets the user select rows, and adds a column for it: a radio per row in `single`, a checkbox in `multiple`. |
| `selectedIds` | `string[]` | Controlled selection: the ids of the selected rows. |
| `defaultSelectedIds` | `string[]` |  |
| `onSelectionChange` | `((ids: string[]) => void)` |  |
| `selectRowLabel` | `((row: Row) => string)` | Accessible name of a row's checkbox or radio. |
| `selectAllLabel` | `string` | Accessible name of the header checkbox, or of the radio column in `single`. |
| `highlightedRowIds` | `string[]` | Ids of rows shown with a stronger fill and an edge marker: "my row" in a ranking. |
| `rowHighlight` | `((row: Row) => boolean)` | The same, as a function. |
| `highlightLabel` | `string` | What assistive technology hears for a highlighted row. |
| `rowAccent` | `((row: Row) => DataTableRowAccent \| undefined)` | A coloured edge stripe that carries a category or status, with the label that says what it means. |
| `striped` | `boolean` | A faint fill on every other row. |
| `dividers` | `boolean` | A line under every row. |
| `onRowAction` | `((row: Row) => void)` | Called when a row is activated: Enter, a double click, or a single click when rows cannot be selected. |
| `rowHref` | `((row: Row) => string \| undefined)` | Makes the row a link: its row header cell (or first cell) holds the link, and activating the row follows it. |
| `isRowDisabled` | `((row: Row) => boolean)` | Disabled rows are dimmed and can be neither selected nor activated. |
| `groupBy` | `(keyof Row & string) \| ((row: Row) => string)` | Groups the rows under header rows: a key of the row, or a function that returns the group's key. |
| `groups` | `DataTableGroup[]` | Titles and order of the groups. Groups not listed follow, titled by their key, as they first appear. |
| `collapsibleGroups` | `boolean` | Adds a caret to every group header row. |
| `collapsedGroups` | `string[]` | Controlled: the keys of the collapsed groups. |
| `defaultCollapsedGroups` | `string[]` |  |
| `onCollapsedGroupsChange` | `((keys: string[]) => void)` |  |
| `stickyGroups` | `boolean` | Group header rows stick below the header while their rows scroll. |
| `collapseGroupLabel` | `string` | Accessible names of a group's caret; the group's title is added. |
| `expandGroupLabel` | `string` |  |
| `onHiddenColumnsChange` | `((ids: string[]) => void)` | Called with the ids of the columns hidden for lack of width, whenever they change. |
| `expandableHidden` | `boolean` | While columns are hidden, each row gets a control that shows their labels and values under the row. |
| `showDetailsLabel` | `string` | Accessible names of that control. |
| `hideDetailsLabel` | `string` |  |
| `hiddenColumnsLabel` | `((count: number) => string)` | Accessible name of the mark in the header that says columns are hidden ("+3"), from their number. The mark is shown while columns are hidden and rows cannot show them (no `expandableHidden`). |
| `skeletonRows` | `number` | Number of skeleton rows shown while `loading`. |
| `height` | `number \| "content" \| "fill"` | `fill` (default) takes the height of the parent, and falls back to the content's height in a parent that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content, and shows every row (no virtualisation). A number is a height in pixels. |
| `loadingMore` | `boolean` | Shows a skeleton row after the last row while more rows load. |
| `loadingMoreLabel` | `string` | What assistive technology hears while more rows load. |
| `onReachEnd` | `(() => void)` | Called when the table is scrolled to its end, for loading more. |
| `virtualize` | `boolean \| "auto"` | Renders only the rows in view. `auto`: above 200 rows, unless a column wraps. Rows must then all have the same height. |
| `highlightChanges` | `boolean \| string[]` | A changed value flashes once: green up, red down (with a sign), neutral otherwise. `true` for every column with an `accessor`, or the ids of some. |
| `increasedLabel` | `string` | What assistive technology hears with the sign of a changed value. |
| `decreasedLabel` | `string` |  |
| `caption` | `ReactNode` | Names the table. Read by assistive technology; shown above the table with `showCaption`. |
| `showCaption` | `boolean` |  |
| `aria-label` | `string` | Accessible name of the table. Give this, `aria-labelledby` or `caption`. |
| `aria-labelledby` | `string` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `id` | `string` | The `id` of the root element. |

**Parts**: `header`, `headerCell`, `sortIndicator`, `hiddenIndicator`, `row`, `cell`, `groupHeader`, `detail`, `footer`, `skeleton`, `empty`, `error`.

**Blocks**: `DataTable.Root`, `DataTable.Header`, `DataTable.HeaderCell`, `DataTable.SortIndicator`, `DataTable.Body`, `DataTable.Row`, `DataTable.Cell`, `DataTable.GroupRow`, `DataTable.Footer`.

## DateChip

A pill with the number of a day: the header of a day in a `WeekStrip` or a `Planner`.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-date-chip-bg` | `color-mix(in oklab, var(--umbra-color-base-text-primary) 10%, transparent)` |
| `--umbra-date-chip-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-date-chip-font` | `--umbra-font-label` |
| `--umbra-date-chip-height` | `calc(var(--umbra-density-label-size) + 10px)` or `calc(var(--umbra-density-label-size) + 4px)` |
| `--umbra-date-chip-outside-bg` | `transparent` |
| `--umbra-date-chip-outside-fg` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-date-chip-padding-x` | `--umbra-space-3` (8px) or `--umbra-space-2` (4px) |
| `--umbra-date-chip-radius` | `--umbra-radius-pill` (999px) |
| `--umbra-date-chip-selected-bg` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-date-chip-selected-fg` | `--umbra-color-fixed-on-selected` (#ffffff) |
| `--umbra-date-chip-today-bg` | `--umbra-color-fixed-primary` (#db1065) |
| `--umbra-date-chip-today-fg` | `--umbra-color-fixed-on-primary` (#ffffff) |

| Prop | Type | Purpose |
|---|---|---|
| `weekday` | `"auto" \| WeekdayFormat` | Shows the name of the weekday before the number. |
| `day` | `boolean` | Shows the day number. Off leaves the weekday alone ("Mon"). |
| `showMonth` | `boolean \| "auto"` | Adds the short month to the number ("1 Nov"). `auto`: on the first day of a month. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `size` | `"default" \| "small"` | `small` is for dense strips and table cells. Otherwise the height follows the density level. |
| `selected` | `boolean` | Marks the chosen day: the violet fill and a ring. |
| `outside` | `boolean` | A day of another month than the one shown: dimmed. |
| `selectedLabel` | `string` | What a screen reader hears after the date of the chosen day. Empty when the holder says it. |
| `date` (required) | `string` | The day, as `'2026-10-11'`. |
| `today` | `boolean` | Marks the current day: the primary fill, a heavier weight and a bar under the text. |
| `todayLabel` | `string` | What a screen reader hears after the date of the current day. Empty when the holder says it. |

**Parts**: `weekday`, `day`.

**Blocks**: `DateChip.Root`, `DateChip.Weekday`, `DateChip.Day`.

## DivergingMeter

A bar that fills to one side of an origin or the other: the direction and the size of a change or an effect.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-diverging-meter-fill` | `--umbra-color-fixed-primary` (#db1065) |
| `--umbra-diverging-meter-hatch` | `color-mix(in oklab, var(--umbra-color-base-surface1) 75%, transparent)` |
| `--umbra-diverging-meter-height` | `6px`; `4px`; `12px` |
| `--umbra-diverging-meter-min-width` | `--umbra-space-7` (24px) |
| `--umbra-diverging-meter-origin` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-diverging-meter-origin-width` | `2px` |
| `--umbra-diverging-meter-radius` | `--umbra-radius-pill` (999px) |
| `--umbra-diverging-meter-track` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-diverging-meter-track-border` | `--umbra-color-base-border-control` (#7a6e91) |

| Prop | Type | Purpose |
|---|---|---|
| `label` | `ReactNode` | The name of the meter, shown above or beside it. |
| `valueLabel` | `ReactNode` | Replaces the formatted value. Setting it shows the value. |
| `showValue` | `boolean` | Shows the value as text. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `number \| null` | The current value. `null` or nothing means there is no value: nothing is filled, and the text says so. |
| `aria-label` | `string` | Names a meter that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `MeterTone` | Colour of a fill above the origin. A matching threshold wins over it. |
| `loading` | `boolean` | Shows skeletons in place of the bar and the value. |
| `size` | `"default" \| "thin" \| "thick"` |  |
| `layout` | `"block" \| "inline"` | `inline` puts the label, the bar and the value on one line, for table cells and rows. |
| `emptyLabel` | `ReactNode` | Shown in place of the value text when there is no value. |
| `min` | `number` |  |
| `max` | `number` |  |
| `thresholds` | `ThresholdList` | Colours the fill by the band of the value: an ascending list of `{ from, tone?, color?, label? }`, or plain numbers as boundaries on the value ramp. The band's `label` joins the value text. |
| `lowerIsBetter` | `boolean` | For a scale where low is good: swaps the colours of the two sides, and mirrors those of the bands. The hatch stays below the origin. |
| `formatValue` | `((value: number, scale: DivergingMeterScale) => string)` | Text of a value. The default is the distance from the origin, with its sign. |
| `noValueLabel` | `string` | What assistive technology and the tooltip say when there is no value. |
| `tooltip` | `boolean` | `false` turns off the tooltip that shows the exact value on hover. |
| `origin` | `number` | The value the fill grows from. Defaults to 0, or to the middle of a scale that does not hold 0. |
| `negativeTone` | `MeterTone` | Colour of a fill below the origin, which is also hatched. |
| `originTick` | `boolean` | `false` hides the tick at the origin. |
| `highlightChanges` | `boolean` | A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise. A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value is never counted up or down. |
| `increasedLabel` | `string` | What a screen reader hears with the sign of a value that rose or fell. |
| `decreasedLabel` | `string` |  |

**Parts**: `label`, `value`, `track`, `fill`, `origin`, `skeleton`.

**Blocks**: `DivergingMeter.Root`, `DivergingMeter.Label`, `DivergingMeter.Value`, `DivergingMeter.Track`, `DivergingMeter.Fill`, `DivergingMeter.Origin`.

## DonutChart

A ring that shows one value against a total, or how a total splits into segments.

**Tokens**: each with its default. It also reads the tokens of [`Heatmap`](#heatmap), [`Legend`](#legend), [`Scatter`](#scatter).

| Token | Default |
|---|---|
| `--umbra-chart-annotation` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-annotation-dash` | `5 3` |
| `--umbra-chart-annotation-width` | `1.5px` |
| `--umbra-chart-area-opacity` | `0.22` |
| `--umbra-chart-axis` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-axis-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-edge-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-opacity` | `0.16` |
| `--umbra-chart-bar-radius` | `2px` |
| `--umbra-chart-center-font` | `--umbra-font-title` |
| `--umbra-chart-content-height` | `240px` |
| `--umbra-chart-dim-opacity` | `0.25` |
| `--umbra-chart-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-font` | `--umbra-font-label` |
| `--umbra-chart-gap` | `--umbra-space-3` (8px) |
| `--umbra-chart-grid` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-grid-dash` | `1 4` |
| `--umbra-chart-grid-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-info` | `--umbra-color-semantic-info` (#3d9be8) |
| `--umbra-chart-label-halo` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-chart-line-width` | `2px` |
| `--umbra-chart-negative` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-chart-outline-width` | `1.5px` |
| `--umbra-chart-point-scale` | `1` |
| `--umbra-chart-positive` | `--umbra-color-semantic-success` (#16b877) |
| `--umbra-chart-ring-width` | `1.5px` |
| `--umbra-chart-tooltip-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-chart-tooltip-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-chart-tooltip-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-chart-tooltip-max-width` | `20rem` |
| `--umbra-chart-tooltip-radius` | `--umbra-radius-control` (4px) |
| `--umbra-chart-track` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-chart-track-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-track-border-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-value` | `--umbra-color-series-1` (#4a94e8) |
| `--umbra-chart-value-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-chart-warning` | `--umbra-color-semantic-warning` (#f2b23a) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-series-marker-size` | `0.875rem` |

| Prop | Type | Purpose |
|---|---|---|
| `centerValue` | `ReactNode` | The large line in the middle. In the single-value form it defaults to the percentage; `null` hides it. |
| `centerLabel` | `ReactNode` | The caption under it. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `number` | The single-value form: one value against `max`. |
| `aria-label` | `string` | Accessible name of the chart. Required unless `aria-labelledby` is set. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `tone` | `DonutTone` | Colour of the single value. The number in the centre is the cue that does not depend on colour. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `hiddenIds` | `readonly string[]` | Ids of the series that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |
| `color` | `string` | Any CSS colour for the single value; wins over `tone` and `thresholds`. |
| `max` | `number` | What a full ring stands for, in the single-value form. |
| `thresholds` | `ThresholdList` | Colours the single value by its band: an ascending list of `{ from, tone?, color?, label? }`, or plain numbers as boundaries on the value ramp. The band's `label` joins the value text. |
| `lowerIsBetter` | `boolean` | For a scale where low is good: mirrors the colours of the bands. The labels stay. |
| `formatValue` | `((value: number) => string)` | Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. |
| `height` | `number \| "content" \| "fill"` | `fill` (default) takes the height of the parent, and falls back to the content's height in a parent that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content: the plot is `--umbra-chart-content-height` (240px) high. A number is a height in pixels. |
| `description` | `string` | What a screen reader hears after the name. Defaults to a generated summary of the data. |
| `labels` | `boolean` | Draws labels on the chart itself, so it can be read without the legend or the tooltip. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `aria-labelledby` | `string` | Id of the element that names the chart, for example a card title. |
| `legend` | `string \| number \| bigint \| boolean \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| ReactPortal \| Promise<string \| number \| bigint \| boolean \| ReactPortal \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| null \| undefined> \| null` | The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it. By default it is shown below the chart when there is more than one series. |
| `onPointPress` | `((point: ChartPoint) => void)` | Called when a point is clicked, or activated with Enter or Space. |
| `allHiddenLabel` | `string` | Shown in place of the plot when the legend has switched every series off. |
| `pointsLabel` | `string` | Accessible name of the list of data points. |
| `legendLabel` | `string` | Accessible name of the legend. |
| `data` | `DonutSegment[]` | The segment form: several values that share the ring. |
| `thickness` | `number` | Width of the ring in pixels. By default a fifth of the radius. |
| `startAngle` | `number` | Where the ring starts, in degrees clockwise from 12 o'clock. |
| `sweep` | `number` | Degrees the ring covers. Less than 360 leaves it open, as a gauge. |
| `roundedCaps` | `boolean` | Rounds the ends of the value. On by default in the single-value form. |
| `gap` | `number` | Degrees left empty between segments. |
| `valueLabel` | `string` | What the single value is called for screen readers when the chart is named by `aria-labelledby`. |

**Parts**: `legend`, `tooltip`, `skeleton`, `empty`, `error`, `center`.

**Blocks**: `DonutChart.Root`, `DonutChart.Track`, `DonutChart.Segments`, `DonutChart.Labels`, `DonutChart.Center`.

## EmptyState

Says that a region has nothing to show, or failed to load, and what to do about it.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-empty-state-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-empty-state-error-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-empty-state-focus-offset` | `calc(-1 * var(--umbra-state-focus-ring-width))` |
| `--umbra-empty-state-gap` | `--umbra-space-3` (8px) |
| `--umbra-empty-state-icon-color` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-empty-state-icon-size` | `2em` |
| `--umbra-empty-state-inline-icon-size` | `1.25em` |
| `--umbra-empty-state-max-width` | `44ch` |
| `--umbra-empty-state-padding` | `--umbra-space-4` (12px) |
| `--umbra-empty-state-title-color` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-empty-state-title-font` | `--umbra-font-body` |

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` | The short statement: "No orders". |
| `description` | `ReactNode` | One or two sentences that explain the state or say what to do. |
| `icon` | `ReactNode` | Decorative icon. Hides first when space is short. |
| `action` | `ReactNode` | A control that resolves the state, for example a `Button`. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `"neutral" \| "error"` | `error` marks a failure: a danger-coloured icon, the built-in one unless `icon` is given. |
| `variant` | `"block" \| "inline"` | `block` is centred in its slot; `inline` is one line of text. |
| `role` | `"alert" \| "status"` | `alert` announces the content when it appears (for an error); `status` announces it politely. |
| `data-part` | `string` | The part this state plays in the component that shows it (`empty`, `error`). |

**Parts**: `icon`, `title`, `description`, `action`.

**Blocks**: `EmptyState.Root`, `EmptyState.Icon`, `EmptyState.Title`, `EmptyState.Description`, `EmptyState.Action`.

## EntityIcon

A small mark for an entity (a logo, a flag, a category glyph), with an optional name next to it.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-entity-icon-bg` | `var(--generated)` |
| `--umbra-entity-icon-fg` | `#fff` |
| `--umbra-entity-icon-gap` | `--umbra-space-2` (4px) or `--umbra-space-3` (8px) |
| `--umbra-entity-icon-radius` | `calc(var(--size) * 0.2)` |
| `--umbra-entity-icon-size` | `1.25em`; `14px`; `18px`; `24px`; `32px`; `56px` |

| Prop | Type | Purpose |
|---|---|---|
| `src` | `string` | An image: a logo or a flag. When it is missing or fails to load, `icon` or the generated mark shows. |
| `icon` | `ReactNode` | An icon node, used when there is no image. |
| `name` | `string` | The entity. Names the mark, and gives the letters and colour of the generated mark. |
| `alt` | `string` | Accessible name of the mark, when it differs from `name`. |
| `label` | `ReactNode` | Text shown next to the mark, truncated when it does not fit. `true` shows `name`. |
| `letters` | `1 \| 2` | Letters in the generated mark. Default: 1 up to `sm`, 2 from `md`. |
| `color` | `string` | Background of the generated mark, in place of the colour derived from `name`. White text must keep 4.5:1 on it. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `size` | `EntityIconSize` | Fixed size of the mark. Without it the mark follows the size of the text around it. |
| `shape` | `EntityIconShape` |  |

**Parts**: `mark`, `label`.

**Blocks**: `EntityIcon.Root`, `EntityIcon.Mark`, `EntityIcon.Label`.

## EntitySwitcher

The current entity of a header, with steps to its siblings and a searchable picker.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-entity-switcher-gap` | `--umbra-space-2` (4px) |
| `--umbra-entity-switcher-hover-bg` | `color-mix(in oklab, currentColor 12%, transparent)` |
| `--umbra-entity-switcher-icon-size` | `1.25em` |
| `--umbra-entity-switcher-name-min-width` | `4ch` |
| `--umbra-entity-switcher-padding-x` | `--umbra-space-2` (4px) |
| `--umbra-entity-switcher-picker-width` | `280px` |
| `--umbra-entity-switcher-radius` | `--umbra-radius-control` (4px) |
| `--umbra-entity-switcher-stepper-direction` | `column` |
| `--umbra-entity-switcher-stepper-size` | `24px` |

| Prop | Type | Purpose |
|---|---|---|
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `string` | Controlled: the id of the current entity. |
| `onChange` | `((id: EntitySwitcherId) => void)` | Called with the id when another entity is chosen, by a row or a stepper. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link for the rows of items with `href`. Defaults to a plain `<a>`. |
| `aria-label` | `string` | Accessible name of the picker and of the group of steppers. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `open` | `boolean` | Controlled state of the picker. |
| `defaultOpen` | `boolean` |  |
| `loading` | `boolean` | Shows skeleton rows in the picker. |
| `disabled` | `boolean` |  |
| `wrap` | `boolean` | Stepping past the last entity goes to the first. Otherwise the stepper at an end is disabled. |
| `emptyLabel` | `string` |  |
| `defaultValue` | `string` |  |
| `placeholder` | `ReactNode` | Shown in place of the name while no entity is current. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onSearchChange` | `((text: string) => void)` | Called with the search text, for an app that loads the matches itself. |
| `searchable` | `boolean` | Shows the search field in the picker. |
| `searchLabel` | `string` |  |
| `noResultsLabel` | `string` |  |
| `onAction` | `((id: EntitySwitcherId) => void)` | Called with the id for every choice, also when it is the current entity. |
| `previousLabel` | `string` | Built-in strings. |
| `nextLabel` | `string` |  |
| `items` (required) | `EntitySwitcherItem[]` | The entities to choose from. |
| `stepperPosition` | `"start" \| "end"` | `start` puts the steppers before the name, for a page title beside its mark. |
| `skeletonRows` | `number` | Number of skeleton rows shown while `loading`. |

**Parts**: `icon`, `name`, `caret`, `steppers`, `search`, `row`.

**Blocks**: `EntitySwitcher.Root`, `EntitySwitcher.Trigger`, `EntitySwitcher.Steppers`, `EntitySwitcher.Picker`.

## FormField

Pairs a label, a description and an error message with one control: a row of a form or settings list.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-field-description-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-field-error-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-field-marker-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-form-field-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-form-field-control-gap` | `--umbra-space-2` (4px) |
| `--umbra-form-field-control-max-width` | `60%` |
| `--umbra-form-field-gap` | `--umbra-space-5` (16px) |
| `--umbra-form-field-padding-x` | `--umbra-space-4` (12px) |
| `--umbra-form-field-padding-y` | `--umbra-space-3` (8px) |
| `--umbra-form-field-radius` | `--umbra-radius-control` (4px) |
| `--umbra-option-group-gap` | `--umbra-space-3` (8px) |
| `--umbra-option-group-inline-gap` | `--umbra-space-6` (20px) |
| `--umbra-option-group-min-option-width` | `12em` |
| `--umbra-option-group-text-gap` | `--umbra-space-2` (4px) |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode \| ((control: FormFieldControlProps) => ReactNode)` | The control: an umbra-ui input, or a function for a plain form element. |
| `label` | `ReactNode` | The label. A click on it focuses or toggles the control. |
| `description` | `ReactNode` | A line that explains the setting. |
| `error` | `ReactNode` | An error message, shown with an icon. Setting it makes the control invalid. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `invalid` | `boolean` | Marks the control invalid. Set by itself when the field has an error. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The id of the control. Generated when not set. |
| `disabled` | `boolean` | Disables the control. |
| `layout` | `"inline" \| "stacked" \| "row"` | `row`: label and description at the start, control at the end, as in a settings list. `stacked`: label above the control. `inline`: label and control on one line, the description and error under the control. `row` and `inline` stack when the field is narrow. |
| `labelWidth` | `string \| number` | The width of the label column of a `row` or `inline` field: a number of pixels, or any CSS width. |
| `required` | `boolean` | Marks the control required and shows the required marker. |
| `requiredLabel` | `string` | The text of the required marker. |
| `surface` | `boolean` | Gives the field its own raised surface and padding, as the rows of a settings list have. |
| `optional` | `boolean` | Shows the optional marker. |
| `optionalLabel` | `string` | The text of the optional marker. |

**Parts**: `label`, `description`, `control`, `error`.

**Blocks**: `FormField.Root`, `FormField.Label`, `FormField.Description`, `FormField.Control`, `FormField.Error`.

## GroupHeader

A header row for one group of rows inside a list or table.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-group-header-bg` | `--umbra-color-base-surface2` (#1b1329); `transparent`; `--umbra-context-card-tint`; `color-mix(in oklab, var(--umbra-color-base-surface2) 80%, var(--surface))` |
| `--umbra-group-header-color` | `--umbra-color-base-text-secondary` (#b3adbf) or `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-group-header-focus-offset` | `calc(-1 * var(--umbra-state-focus-ring-width))` |
| `--umbra-group-header-font` | `--umbra-font-label` |
| `--umbra-group-header-height` | `calc(var(--umbra-density-table-row) + var(--umbra-space-2))` or `calc(var(--row-h) + var(--umbra-space-2))` |
| `--umbra-group-header-padding-x` | `--umbra-density-card-padding` (16px at the default density) |
| `--umbra-group-header-title-min-width` | `4rem` |

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` | The group's name. |
| `icon` | `ReactNode` | Leading icon. |
| `count` | `number` | Number of rows in the group, shown after the title. |
| `meta` | `ReactNode` | Trailing text, for example a total. Hides when the header is too narrow. |
| `actions` | `ReactNode` | Trailing controls. They move into an overflow menu when they do not fit. |
| `moreLabel` | `string` | Accessible name of the overflow menu button. |
| `headingLevel` | `4 \| 3 \| 2 \| 5 \| 6` | Heading level of the title. |
| `collapsible` | `boolean` | Adds a caret button that collapses the group. The app (or `List`) hides the rows. |
| `collapsed` | `boolean` | Controlled collapse state. |
| `defaultCollapsed` | `boolean` |  |
| `onCollapsedChange` | `((collapsed: boolean) => void)` |  |
| `collapseLabel` | `string` | Accessible names of the caret. With a text `title`, the title is added: "Collapse Today". |
| `expandLabel` | `string` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `variant` | `"plain" \| "strip"` | `strip` is a full-width band (a date above its messages); `plain` has no fill (a label above a few rows). |
| `sticky` | `boolean` | Sticks to the top of the scroll area while its group scrolls. The header and its rows must share a parent element. |

**Parts**: `toggle`, `icon`, `title`, `count`, `meta`, `actions`.

**Blocks**: `GroupHeader.Root`, `GroupHeader.Toggle`, `GroupHeader.Title`, `GroupHeader.Count`, `GroupHeader.Meta`, `GroupHeader.Actions`.

## Heatmap

A grid of cells coloured by value: two categories against each other, or points summed into bins.

**Tokens**: each with its default. It also reads the tokens of [`Legend`](#legend), [`Scatter`](#scatter).

| Token | Default |
|---|---|
| `--umbra-chart-annotation` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-annotation-dash` | `5 3` |
| `--umbra-chart-annotation-width` | `1.5px` |
| `--umbra-chart-area-opacity` | `0.22` |
| `--umbra-chart-axis` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-axis-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-edge-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-opacity` | `0.16` |
| `--umbra-chart-bar-radius` | `2px` |
| `--umbra-chart-center-font` | `--umbra-font-title` |
| `--umbra-chart-content-height` | `240px` |
| `--umbra-chart-dim-opacity` | `0.25` |
| `--umbra-chart-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-font` | `--umbra-font-label` |
| `--umbra-chart-gap` | `--umbra-space-3` (8px) |
| `--umbra-chart-grid` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-grid-dash` | `1 4` |
| `--umbra-chart-grid-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-info` | `--umbra-color-semantic-info` (#3d9be8) |
| `--umbra-chart-label-halo` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-chart-line-width` | `2px` |
| `--umbra-chart-negative` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-chart-outline-width` | `1.5px` |
| `--umbra-chart-point-scale` | `1` |
| `--umbra-chart-positive` | `--umbra-color-semantic-success` (#16b877) |
| `--umbra-chart-ring-width` | `1.5px` |
| `--umbra-chart-tooltip-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-chart-tooltip-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-chart-tooltip-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-chart-tooltip-max-width` | `20rem` |
| `--umbra-chart-tooltip-radius` | `--umbra-radius-control` (4px) |
| `--umbra-chart-track` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-chart-track-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-track-border-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-value` | `--umbra-color-series-1` (#4a94e8) |
| `--umbra-chart-value-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-chart-warning` | `--umbra-color-semantic-warning` (#f2b23a) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-heatmap-backdrop-opacity` | `0.8` |
| `--umbra-heatmap-cell-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-heatmap-cell-border-width` | `--umbra-border-width` (1px) |
| `--umbra-heatmap-cell-radius` | `2px` |
| `--umbra-heatmap-high` | `--umbra-color-series-1` (#4a94e8) |
| `--umbra-heatmap-low` | `--umbra-color-base-surface3` (#261b38) |

| Prop | Type | Purpose |
|---|---|---|
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name of the chart. Required unless `aria-labelledby` is set. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `hiddenIds` | `readonly string[]` | Ids of the series that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |
| `columns` | `string[]` | The names of the columns. |
| `rows` | `string[]` | The names of the rows, from the top down. |
| `thresholds` | `ThresholdList` | Colours cells by the band of their value in place of the scale: an ascending list of `{ from, tone?, color?, label? }`, or plain numbers as boundaries on the value ramp. The band's `label` joins the value in the tooltip and for screen readers, and names the band in the legend. |
| `lowerIsBetter` | `boolean` | For a scale where low is good: mirrors the colours over the steps or bands. The labels stay. |
| `formatValue` | `((value: number) => string)` | Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. |
| `steps` | `number` | Number of steps of the colour scale. `thresholds` replaces it. |
| `height` | `number \| "content" \| "fill"` | `fill` (default) takes the height of the parent, and falls back to the content's height in a parent that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content: the plot is `--umbra-chart-content-height` (240px) high. A number is a height in pixels. |
| `description` | `string` | What a screen reader hears after the name. Defaults to a generated summary of the data. |
| `labels` | `boolean` | Draws labels on the chart itself, so it can be read without the legend or the tooltip. |
| `values` | `(number \| null)[][]` | One list per row, with one value per column. `null` leaves the cell out. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `aria-labelledby` | `string` | Id of the element that names the chart, for example a card title. |
| `valueDomain` | `[number, number]` | The range of the colour scale. Defaults to the lowest and highest value. |
| `xTitle` | `string` |  |
| `yTitle` | `string` |  |
| `legend` | `string \| number \| bigint \| boolean \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| ReactPortal \| Promise<string \| number \| bigint \| boolean \| ReactPortal \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| null \| undefined> \| null` | The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it. By default it is shown below the chart when there is more than one series. |
| `onPointPress` | `((point: ChartPoint) => void)` | Called when a point is clicked, or activated with Enter or Space. |
| `allHiddenLabel` | `string` | Shown in place of the plot when the legend has switched every series off. |
| `pointsLabel` | `string` | Accessible name of the list of data points. |
| `legendLabel` | `string` | Accessible name of the legend. |
| `yDomain` | `[number, number]` |  |
| `points` | `HeatPoint[]` | Instead of `rows`, `columns` and `values`: points that the chart sums into a grid of `bins`. |
| `axes` | `boolean` | `false` draws no axis lines, tick labels or titles: the cells take the whole plot, for a chart over a backdrop. |
| `bins` | `number \| [number, number]` | The grid of `points`: the number of columns and rows, or one number for both. |
| `xDomain` | `[number, number]` | The range `points` are binned over. Defaults to the range of the points. |
| `lowLabel` | `string` | The captions at the two ends of the scale's legend. |
| `highLabel` | `string` |  |

**Parts**: `backdrop`, `legend`, `tooltip`, `skeleton`, `empty`, `error`.

**Blocks**: `Heatmap.Root`, `Heatmap.Backdrop`, `Heatmap.Cells`, `Heatmap.Axes`, `Heatmap.ValueLabels`.

## HistoryButtons

Back and forward. On their own they drive the browser history; with `onBack` and `onForward` they drive the app's router.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-history-buttons-bg` | `color-mix(in oklab, currentColor 8%, transparent)` |
| `--umbra-history-buttons-gap` | `--umbra-space-3` (8px) |
| `--umbra-history-buttons-size` | `--umbra-density-control-height` (36px at the default density) |

| Prop | Type | Purpose |
|---|---|---|
| `canGoBack` | `boolean` | Router mode: whether there is somewhere to go. Leave both out to use the browser history. |
| `canGoForward` | `boolean` |  |
| `onBack` | `(() => void)` | Router mode: called in place of `history.back()` and `history.forward()`. |
| `onForward` | `(() => void)` |  |
| `entries` | `HistoryEntry[]` | Recent places, newest first. They open from a caret, a long press or a right click on the buttons. |
| `onNavigate` | `((id: string) => void)` | Called with the id of the entry the user chose. |
| `backShortcut` | `string \| null` | Ids of the shortcuts the buttons bind. `null` binds none. |
| `forwardShortcut` | `string \| null` |  |
| `backLabel` | `string` | Accessible names and tooltip texts. |
| `forwardLabel` | `string` |  |
| `entriesLabel` | `string` | Accessible name of the caret and of the menu of `entries`. |
| `aria-label` | `string` | Accessible name of the group. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `backIcon`, `forwardIcon`, `entriesIcon`.

**Blocks**: none.

## HorizontalScroller

A row of cards or tiles that scrolls sideways inside itself. Each child is one item.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-horizontal-scroller-button-size` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-horizontal-scroller-fade-size` | `--umbra-space-8` (32px) |
| `--umbra-horizontal-scroller-gap` | `--umbra-density-gap` (20px at the default density) |
| `--umbra-horizontal-scroller-item-width` | `auto` or `160px` |
| `--umbra-horizontal-scroller-skeleton-height` | `72px` |
| `--umbra-layout-gap` | `--umbra-density-gap` (20px at the default density) |

| Prop | Type | Purpose |
|---|---|---|
| `itemWidth` | `string \| number` | The width of every item: pixels, or any CSS length. Without it each item keeps its own width. |
| `gap` | `0 \| 4 \| 3 \| 1 \| 2 \| 5 \| 6 \| 7 \| 8 \| 9` | Overrides the gap between items, which otherwise follows the density level. |
| `scrollbar` | `"none" \| "auto" \| "hover"` | `none` draws no thumb at all; `hover` and `auto` are the thin thumb of a `ScrollArea`. |
| `snap` | `boolean` | Scrolling comes to rest at the start of an item. |
| `fade` | `boolean` | Fades the items out at an edge that has more. It is a mask, so it is right on any background. |
| `onReachEnd` | `(() => void)` | Called when the far edge is reached, for loading more. Once each time it is reached. |
| `skeletonItems` | `number` | Number of placeholder items shown while `loading`. |
| `previousLabel` | `string` | Accessible names of the two buttons. |
| `nextLabel` | `string` |  |
| `aria-label` | `string` | Accessible name of the list. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` | `HorizontalScroller.Item` elements. |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `id` | `string` | The `id` of the root element. |

**Parts**: `previous`, `next`, `skeleton`.

**Blocks**: `HorizontalScroller.Root`, `HorizontalScroller.Item`.

## IconButton

A button that shows only an icon. Inside an overflow menu it becomes a menu item with its icon and label.

**Tokens**: each with its default. It also reads the tokens of [`Badge`](#badge), [`Button`](#button).

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-icon-button-badge-dot-size` | `8px` |
| `--umbra-icon-button-badge-font` | `700 10px / var(--umbra-badge-size, var(--badge-size)) var(--umbra-font-family-body)` |
| `--umbra-icon-button-badge-padding-x` | `3px` |
| `--umbra-icon-button-badge-size` | `14px` |
| `--umbra-icon-button-size` | `var(--height)` |

| Prop | Type | Purpose |
|---|---|---|
| `icon` (required) | `ReactNode` |  |
| `label` (required) | `string` | Required. The accessible name and the tooltip text. |
| `variant` | `ButtonVariant` |  |
| `shape` | `"square" \| "circle"` |  |
| `pressed` | `boolean` | Makes it a toggle (for example a star). While `true` the icon takes the accent colour and is drawn filled; a `ghost` toggle has no outline. |
| `onPressedChange` | `((pressed: boolean) => void)` |  |
| `pressedIcon` | `ReactNode` | The icon while `pressed`, in place of `icon` drawn filled: for an icon that is not one closed shape, or a set that has its own filled glyphs. |
| `badge` | `number \| true` | A count, or `true` for a dot, at the corner. |
| `tooltip` | `ReactNode` | Shows `label` on hover and focus. A node replaces the text. |
| `shortcut` | `string` | Id of a shortcut in the provider's list: binds the key and shows the hint in the tooltip. |
| `disabled` | `boolean` |  |
| `loading` | `boolean` |  |
| `loadingLabel` | `string` | What a screen reader hears while `loading`. |
| `onPress` | `(() => void)` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `icon`, `badge`, `tooltip`.

**Blocks**: none.

## KeyValue

One label with its value. Use it inside a `KeyValueList`, or on its own.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-key-value-divider` | `--umbra-color-base-border-subtle` (#2e2440) |
| `--umbra-key-value-gap` | `--umbra-space-4` (12px) |
| `--umbra-key-value-highlight-bg` | `--umbra-context-card-tint-strong` |
| `--umbra-key-value-highlight-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-key-value-hint-fg` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-key-value-label-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-key-value-label-width` | `60%` |
| `--umbra-key-value-min-column` | `140px` |
| `--umbra-key-value-padding-x` | `--umbra-space-3` (8px) |
| `--umbra-key-value-row-height` | `--umbra-density-table-row` (26px at the default density) |
| `--umbra-key-value-stripe` | `color-mix(in srgb, var(--umbra-color-base-text-primary) var(--umbra-state-stripe-strength), transparent)` |
| `--umbra-key-value-value-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-key-value-value-font` | `--umbra-font-body` |

| Prop | Type | Purpose |
|---|---|---|
| `label` | `ReactNode` | What the value is. |
| `value` | `ReactNode` | The value. `children` is used when it is not set. With neither, the row shows `emptyLabel`. |
| `children` | `ReactNode` |  |
| `emptyLabel` | `ReactNode` | Shown when there is no value. |
| `icon` | `ReactNode` | Shown before the label. |
| `hint` | `ReactNode` | A secondary line: under the label when inline, under the value when stacked. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `orientation` | `Orientation` | `inline`: label and value side by side. `stacked`: the label above the value. |
| `align` | `Align` | Where the value sits. Default: `end` when inline, `start` when stacked. |
| `wrap` | `boolean` | Lets a long value wrap onto more lines. Without it the value is cut with an ellipsis. |
| `highlighted` | `boolean` | Marks a key row: a tinted fill, and the label in bold as the cue that is not colour. |
| `highlightChanges` | `boolean` | A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise. A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value is never counted up or down. |
| `changeValue` | `unknown` | What is compared, when the content is not the value itself (a formatted text). Default: the content, when it is text or a number. |
| `increasedLabel` | `string` | What a screen reader hears with the sign of a value that rose or fell. |
| `decreasedLabel` | `string` |  |

**Parts**: `icon`, `label`, `value`, `hint`.

**Blocks**: `KeyValue.Root`, `KeyValue.Label`, `KeyValue.Value`, `KeyValue.Hint`.

## KeyValueList

A group of labels with their values, in rows, columns or a grid.

**Tokens**: none of its own. It also reads the tokens of [`KeyValue`](#keyvalue).

| Prop | Type | Purpose |
|---|---|---|
| `items` | `KeyValueItem[]` | The rows as data. Use this or `children`. |
| `children` | `ReactNode` | The rows as `KeyValue` elements. |
| `skeletonRows` | `number` | Number of skeleton rows. |
| `parts` | `see Parts` | Replace or hide named pieces. `item` receives the props of each row built from `items`. |
| `aria-label` | `string` | Names the list for assistive technology. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `orientation` | `Orientation` | Orientation of every item. Default: `inline` in rows, `stacked` in columns and in the grid. |
| `align` | `Align` | Where every value sits. |
| `wrap` | `boolean` | Lets long values wrap instead of being cut. |
| `highlightChanges` | `boolean` | A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise. A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value is never counted up or down. |
| `increasedLabel` | `string` | What a screen reader hears with the sign of a value that rose or fell. |
| `decreasedLabel` | `string` |  |
| `layout` | `"columns" \| "rows" \| "grid"` | `rows`: one row per item, sharing one label column. `columns`: side by side. `grid`: in `columns` columns. |
| `columns` | `number` | Most columns of the `grid` layout. Fewer are used when the list is narrow. |
| `striped` | `boolean` | Shades every other row (`rows` layout). |
| `dividers` | `boolean` | Draws a line between items (`rows` and `columns` layouts). |
| `labelWidth` | `string \| number` | Width of the shared label column in the `rows` layout: pixels or any CSS length. Default: as wide as the longest label, at most 60%. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |

**Parts**: `item`, `skeleton`, `empty`, `error`.

**Blocks**: `KeyValueList.Root`, `KeyValueList.Item`.

## Legend

The key for a chart or any colour-coded data: one marker and label per series.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-legend-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-legend-focus-offset` | `calc(-1 * var(--umbra-state-focus-ring-width))` |
| `--umbra-legend-font` | `--umbra-font-label` |
| `--umbra-legend-gap` | `--umbra-space-4` (12px) |
| `--umbra-legend-item-radius` | `--umbra-radius-control` (4px) |
| `--umbra-legend-row-gap` | `--umbra-space-1` (2px) |
| `--umbra-legend-row-height` | `--umbra-density-table-row` (26px at the default density) |
| `--umbra-legend-value-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-series-marker-size` | `0.875rem` |

| Prop | Type | Purpose |
|---|---|---|
| `items` (required) | `LegendItem[]` |  |
| `marker` | `SeriesMarkerKind` | The marker of every item that does not set its own. Patterns (`stripes`, `dots`) do not depend on colour. |
| `skeletonRows` | `number` | Number of placeholder items while `loading`. |
| `moreLabel` | `((count: number) => string)` | Text of the button that stands for the items that did not fit. |
| `allLabel` | `string` | Accessible name of the popover with the full list. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name of the legend. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `orientation` | `"vertical" \| "horizontal"` |  |
| `align` | `"start" \| "center" \| "end"` | Where the items sit along the legend. A vertical legend with values always fills its width. |
| `interactive` | `boolean` | Makes each item a toggle button that switches its series on and off. |
| `onHighlight` | `((id: string \| null) => void)` | Called with an item's id while it is hovered or focused, and with `null` when it no longer is. |
| `maxRows` | `number` | The most rows a horizontal legend wraps to. |
| `hiddenIds` | `readonly string[]` | Ids of the items that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |

**Parts**: `item`, `marker`, `label`, `value`, `more`, `skeleton`, `state`.

**Blocks**: `Legend.Root`, `Legend.Item`, `Legend.Marker`, `Legend.More`.

## LevelMeter

A strip of ticks with a marker that shows where a value sits on a scale.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-level-meter-band` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-level-meter-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-level-meter-boundary` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-level-meter-compare` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-level-meter-height` | `20px`; `14px`; `28px` |
| `--umbra-level-meter-length` | `none` |
| `--umbra-level-meter-marker` | `--umbra-color-fixed-accent-text` (#f77bf0) |
| `--umbra-level-meter-marker-width` | `3px` or `4px` |
| `--umbra-level-meter-pitch` | `5px` |
| `--umbra-level-meter-radius` | `--umbra-radius-control` (4px) |
| `--umbra-level-meter-tick` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-level-meter-tick-lit` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-level-meter-tick-width` | `2px` |
| `--umbra-level-meter-track` | `--umbra-color-base-surface1` (#0b0612) |

| Prop | Type | Purpose |
|---|---|---|
| `label` | `ReactNode` | The name of the meter, shown before it. |
| `minLabel` | `ReactNode` | Captions at the two ends of the scale. |
| `maxLabel` | `ReactNode` |  |
| `valueLabel` | `ReactNode` | Replaces the formatted value. Setting it shows the value. |
| `showValue` | `boolean` | Shows the value as text after the meter. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `LevelMeterValue \| null` | Where the marker sits. Leave it out to show only a `range`. |
| `aria-label` | `string` | Names a meter that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `MeterTone` | Colour of the marker, when no band or level sets it. |
| `loading` | `boolean` | Shows skeletons in place of the ticks and the value. |
| `orientation` | `"vertical" \| "horizontal"` |  |
| `size` | `"default" \| "small" \| "large"` |  |
| `emptyLabel` | `ReactNode` | Shown in place of the value text when there is no value, or the value names no level. |
| `min` | `number` |  |
| `max` | `number` |  |
| `thresholds` | `ThresholdList` | Colours the marker by the band of the value: an ascending list of `{ from, tone?, color?, label? }`, or plain numbers as boundaries on the value ramp. Where a band starts is drawn as a taller tick, and the band's `label` joins the value text. |
| `lowerIsBetter` | `boolean` | For a scale where low is good: mirrors the colours of the bands. The labels stay. |
| `formatValue` | `((value: number) => string)` | Text of a position on a numeric scale. A named scale uses the labels of its levels. |
| `noValueLabel` | `string` | What assistive technology and the tooltip say when there is no value and no range. |
| `tooltip` | `boolean` | `false` turns off the tooltip that shows the exact value on hover. |
| `steps` | `number` | Number of ticks on a numeric scale. |
| `levels` | `LevelMeterLevel[]` | A named scale: one tick per level, and the marker sits on a level. Replaces `min`, `max` and `steps`. |
| `range` | `[LevelMeterValue, LevelMeterValue]` | Draws a band from the first position to the second, for an estimate or an allowed span. |
| `compare` | `LevelMeterValue` | A second, smaller marker to compare the value with. |
| `compareLabel` | `string` | Names the comparison marker for assistive technology. |
| `rangeLabel` | `string` | Names the band for assistive technology. |
| `boxed` | `boolean` | Draws the box around the ticks. |
| `highlightChanges` | `boolean` | A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise. A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value is never counted up or down. |
| `increasedLabel` | `string` | What a screen reader hears with the sign of a value that rose or fell. |
| `decreasedLabel` | `string` |  |

**Parts**: `label`, `minLabel`, `maxLabel`, `strip`, `band`, `marker`, `compare`, `value`, `skeleton`.

**Blocks**: `LevelMeter.Root`, `LevelMeter.Label`, `LevelMeter.EndLabel`, `LevelMeter.Strip`, `LevelMeter.Band`, `LevelMeter.Marker`, `LevelMeter.Value`.

## LineChart

One or more series over categories, numbers or time, with a numeric or an ordinal y axis.

**Tokens**: each with its default. It also reads the tokens of [`Heatmap`](#heatmap), [`Legend`](#legend), [`Scatter`](#scatter).

| Token | Default |
|---|---|
| `--umbra-chart-annotation` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-annotation-dash` | `5 3` |
| `--umbra-chart-annotation-width` | `1.5px` |
| `--umbra-chart-area-opacity` | `0.22` |
| `--umbra-chart-axis` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-axis-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-edge-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-opacity` | `0.16` |
| `--umbra-chart-bar-radius` | `2px` |
| `--umbra-chart-center-font` | `--umbra-font-title` |
| `--umbra-chart-content-height` | `240px` |
| `--umbra-chart-dim-opacity` | `0.25` |
| `--umbra-chart-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-font` | `--umbra-font-label` |
| `--umbra-chart-gap` | `--umbra-space-3` (8px) |
| `--umbra-chart-grid` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-grid-dash` | `1 4` |
| `--umbra-chart-grid-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-label-halo` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-chart-line-width` | `2px` |
| `--umbra-chart-outline-width` | `1.5px` |
| `--umbra-chart-point-scale` | `1` |
| `--umbra-chart-ring-width` | `1.5px` |
| `--umbra-chart-tooltip-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-chart-tooltip-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-chart-tooltip-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-chart-tooltip-max-width` | `20rem` |
| `--umbra-chart-tooltip-radius` | `--umbra-radius-control` (4px) |
| `--umbra-chart-track` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-chart-track-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-track-border-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-value-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-series-marker-size` | `0.875rem` |

| Prop | Type | Purpose |
|---|---|---|
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name of the chart. Required unless `aria-labelledby` is set. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `hiddenIds` | `readonly string[]` | Ids of the series that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |
| `formatValue` | `((value: number) => string)` | Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. |
| `height` | `number \| "content" \| "fill"` | `fill` (default) takes the height of the parent, and falls back to the content's height in a parent that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content: the plot is `--umbra-chart-content-height` (240px) high. A number is a height in pixels. |
| `description` | `string` | What a screen reader hears after the name. Defaults to a generated summary of the data. |
| `labels` | `boolean` | Draws labels on the chart itself, so it can be read without the legend or the tooltip. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `series` (required) | `LineSeries[]` |  |
| `aria-labelledby` | `string` | Id of the element that names the chart, for example a card title. |
| `categories` | `string[]` | The order of a category x axis. Defaults to the order the names first appear in. |
| `annotations` | `ChartAnnotation[]` | Reference lines and bands on either axis. |
| `xTitle` | `string` |  |
| `yTitle` | `string` |  |
| `legend` | `string \| number \| bigint \| boolean \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| ReactPortal \| Promise<string \| number \| bigint \| boolean \| ReactPortal \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| null \| undefined> \| null` | The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it. By default it is shown below the chart when there is more than one series. |
| `onPointPress` | `((point: ChartPoint) => void)` | Called when a point is clicked, or activated with Enter or Space. |
| `allHiddenLabel` | `string` | Shown in place of the plot when the legend has switched every series off. |
| `pointsLabel` | `string` | Accessible name of the list of data points. |
| `legendLabel` | `string` | Accessible name of the legend. |
| `yLevels` | `string[]` | Makes the y axis ordinal: the named levels, from the bottom up. Points then give a level name as `y`. |
| `yDomain` | `[number, number]` | The range of a numeric y axis. Defaults to round numbers around the data. |
| `curve` | `LineCurve` | `step` holds each value until the next point. |
| `area` | `boolean` | Fills the area under each line; the y axis then starts at zero. |
| `points` | `boolean` | Draws a shape on every value. Points too dense to tell apart are left out. |
| `formatX` | `((x: LineX) => string)` | Formats an x value for the axis, the tooltip and screen readers. |

**Parts**: `legend`, `tooltip`, `skeleton`, `empty`, `error`.

**Blocks**: `LineChart.Root`, `LineChart.Grid`, `LineChart.Annotations`, `LineChart.Series`, `LineChart.Axes`.

## Link

A text link: inside a sentence, or on its own line as the way to a fuller view.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-link-color` | `--umbra-color-fixed-accent-text` (#f77bf0) |
| `--umbra-link-font` | `--umbra-font-label` |
| `--umbra-link-hover-lighten` | `30%` |
| `--umbra-link-neutral-color` | `currentColor` |
| `--umbra-link-radius` | `--umbra-radius-control` (4px) |
| `--umbra-link-underline-offset` | `3px` |

| Prop | Type | Purpose |
|---|---|---|
| `chevron` | `boolean` | Adds a trailing chevron: "See all ›". |
| `externalLabel` | `string` | What a screen reader hears after the text of an `external` link. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `href` | `string` | Where it goes. Without it the link is a button that calls `onPress`. |
| `onPress` | `(() => void)` |  |
| `external` | `boolean` | Opens in a new tab, with `rel="noopener noreferrer"`. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link. Defaults to a plain `<a>`. |
| `disabled` | `boolean` |  |
| `variant` | `"inline" \| "standalone"` | `inline` sits in a sentence and wraps with it. `standalone` is one line on its own ("See all"). |
| `tone` | `"neutral" \| "accent"` | `neutral` takes the colour of the text around it. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `label`, `externalIcon`, `chevron`.

**Blocks**: `Link.Root`, `Link.Label`, `Link.Icon`.

## List

A vertical list of rows that scrolls inside its slot, with optional groups, selection and row actions.

**Tokens**: each with its default. It also reads the tokens of [`GroupHeader`](#groupheader).

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-list-divider-color` | `--umbra-color-base-border-subtle` (#2e2440) |
| `--umbra-list-number-width` | `1.5em` |
| `--umbra-list-stripe-bg` | `color-mix(in srgb, var(--umbra-color-base-text-primary) var(--umbra-state-stripe-strength), transparent)` |

| Prop | Type | Purpose |
|---|---|---|
| `items` | `T[]` | The rows, as data. Use with `renderItem`; or pass `List.Item` children instead. |
| `groups` | `ListGroupData<T>[]` | Grouped rows, as data: each group's header props and its `items`. |
| `renderItem` | `((item: T, index: number) => ReactNode)` | Returns the `List.Item` of one row. |
| `children` | `ReactNode` | `List.Item` and `List.Group` elements. |
| `selectionMode` | `"none" \| "single" \| "multiple"` | `single` and `multiple` let the user select rows. |
| `selectedIds` | `ListId[]` | Controlled selection: the keys of the selected rows. |
| `defaultSelectedIds` | `ListId[]` |  |
| `onSelectionChange` | `((keys: ListId[]) => void)` |  |
| `selectionBehavior` | `"toggle" \| "replace"` | `replace`: a click selects only that row, a double click or Enter activates it, and selection follows the arrow keys. `toggle`: a click or Space toggles the row. Default: `replace` when `onAction` is set, otherwise `toggle`. |
| `disallowEmptySelection` | `boolean` | The user cannot deselect the last selected row. Default: on with `replace` (so a double click does not deselect), otherwise off. |
| `onAction` | `((key: ListId) => void)` | Called when a row is activated: Enter or a double click (a single click when nothing can be selected). |
| `dividers` | `boolean` | A line between rows. |
| `striped` | `boolean` | A faint fill on every other row. |
| `numbered` | `boolean` | Shows each row's position, for a ranking. |
| `itemVariant` | `"message" \| "default" \| "pair"` | Default `variant` of every `List.Item`, and the layout of the skeleton rows. |
| `itemSize` | `"compact" \| "default"` | Default `size` of every `List.Item`, and of the skeleton rows. |
| `stickyHeaders` | `boolean` | Group headers stick to the top while their group scrolls. |
| `skeletonRows` | `number` | Number of skeleton rows shown while `loading`. |
| `height` | `number \| "content" \| "fill"` | `fill` (default) takes the height of the parent, and falls back to the content's height in a parent that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content. A number is a height in pixels. |
| `onReachEnd` | `(() => void)` | Called when the list is scrolled to its end, for loading more. |
| `loadingMore` | `boolean` | Shows a skeleton row after the last row while more rows load. |
| `loadingMoreLabel` | `string` | What assistive technology hears for the `loadingMore` row. |
| `aria-label` | `string` | Accessible name of the list. Required unless `aria-labelledby` is set. |
| `aria-labelledby` | `string` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `id` | `string` | The `id` of the root element. |

**Parts**: `skeleton`, `state`, `loadingMore`.

**Blocks**: `List.Root`, `List.Item`, `List.Group`.

## ListItem

The content of one row of a list: a title with optional lines, and leading and trailing pieces.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-list-item-bg` | `transparent` |
| `--umbra-list-item-center-bg` | `color-mix(in oklab, #000 var(--umbra-state-press-darken-strong), transparent)` |
| `--umbra-list-item-color` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-list-item-focus-offset` | `calc(-1 * var(--umbra-state-focus-ring-width))` |
| `--umbra-list-item-gap` | `--umbra-space-4` (12px) |
| `--umbra-list-item-hover-bg` | `color-mix(in oklab, currentColor var(--umbra-state-hover-lighten), transparent)` |
| `--umbra-list-item-min-height` | `--umbra-density-list-row` (72px at the default density) or `calc(var(--umbra-density-control-height) + var(--umbra-space-2))` |
| `--umbra-list-item-padding-x` | `--umbra-density-card-padding` (16px at the default density) |
| `--umbra-list-item-padding-y` | `--umbra-space-3` (8px) or `--umbra-space-2` (4px) |
| `--umbra-list-item-read-color` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-list-item-secondary-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-list-item-selected-bg` | `color-mix(in oklab, var(--umbra-color-fixed-selected) 28%, transparent)` |
| `--umbra-list-item-selected-stripe` | `color-mix(in oklab, var(--umbra-color-fixed-selected), #fff 35%)` |
| `--umbra-list-item-stripe-width` | `3px` |
| `--umbra-list-item-title-font` | `--umbra-font-body` |
| `--umbra-list-item-unread-color` | `--umbra-color-base-text-primary` (#f5f3f8) |

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` | The main line. Truncates last. |
| `description` | `ReactNode` | A second line under the title. |
| `descriptionLines` | `number` | The most lines the description wraps to, for a row that holds a paragraph beside an icon or image. |
| `opposite` | `{ title: ReactNode; leading?: ReactNode; meta?: ReactNode; }` | The second side of a two-sided row: `title`, `leading` and `meta` are the first side, and these mirror them on the other side of `center`. Sets the `pair` variant. |
| `center` | `ReactNode` | What stands between the two sides of a `pair` row: a short text or an icon. |
| `overline` | `ReactNode` | A small line above the title, for example a sender. |
| `leading` | `ReactNode` | Leading node: an avatar or icon. |
| `meta` | `ReactNode` | Trailing text, for example a time or a value. |
| `trailing` | `ReactNode` | Trailing node: tags, a badge or actions. Hides first when the row is narrow. |
| `unreadLabel` | `string` | What assistive technology hears for the unread dot. |
| `accentLabel` | `string` | What assistive technology hears for the `accent` stripe, for example the category's name. |
| `href` | `string` | Makes the whole row a link. Inside a `List`, the list handles it. |
| `onPress` | `(() => void)` | Makes the whole row a button. Inside a `List`, the list handles it. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `accent` | `string` | A colour for an edge stripe that carries a category. Give `accentLabel` too, so it is not colour alone. |
| `variant` | `"message" \| "default" \| "pair"` | `message`: sender and tag on the first line, title and time on the second. `pair`: two sides that mirror each other around a centre (set by `opposite`). |
| `interactive` | `boolean` | Shows hover and press feedback. Set by `List`, and by `href` or `onPress`. |
| `size` | `"compact" \| "default"` | `compact` is one control high, for leaderboards and short lists. Otherwise the height follows the density level. |
| `selected` | `boolean` | Violet fill with an edge stripe. Inside a `List`, selection sets it. |
| `unread` | `boolean` | `true`: bold title and a dot. `false`: the title is dimmed as read. Leave unset where rows have no read state. |
| `disabled` | `boolean` |  |
| `highlightChanges` | `boolean` | A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise. A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value is never counted up or down. |
| `changeValue` | `unknown` | What is compared, when the content is not the value itself (a formatted text). Default: the content, when it is text or a number. |
| `increasedLabel` | `string` | What a screen reader hears with the sign of a value that rose or fell. |
| `decreasedLabel` | `string` |  |

**Parts**: `leading`, `overline`, `title`, `description`, `meta`, `opposite`, `center`, `unread`, `trailing`.

**Blocks**: `ListItem.Root`, `ListItem.Leading`, `ListItem.Content`, `ListItem.Overline`, `ListItem.Title`, `ListItem.Description`, `ListItem.End`, `ListItem.Side`, `ListItem.Center`, `ListItem.Meta`, `ListItem.Unread`, `ListItem.Trailing`.

## MediaCard

A card for one article or item: a picture, a title, a few quiet details, and its own link.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-media-card-bg` | `--umbra-context-card-tint` |
| `--umbra-media-card-border` | `--umbra-color-base-border-subtle` (#2e2440) |
| `--umbra-media-card-color` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-media-card-focus-offset` | `calc(-1 * var(--umbra-state-focus-ring-width))` |
| `--umbra-media-card-gap` | `--umbra-space-3` (8px) or `--umbra-space-2` (4px) |
| `--umbra-media-card-image-min-height` | `3rem` |
| `--umbra-media-card-image-ratio` | `16 / 9` |
| `--umbra-media-card-padding` | `--umbra-density-card-padding` (16px at the default density) |
| `--umbra-media-card-placeholder-bg` | `color-mix(in oklab, var(--umbra-context) 30%, var(--umbra-color-base-surface2))` |
| `--umbra-media-card-placeholder-fg` | `color-mix(in oklab, var(--umbra-context) 45%, var(--umbra-color-base-surface3))` |
| `--umbra-media-card-radius` | `--umbra-radius-card` (8px) |
| `--umbra-media-card-scrim` | `--umbra-color-base-scrim` (rgba(5, 2, 10, 0.72)) |
| `--umbra-media-card-secondary-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-media-card-selected-bg` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-media-card-selected-edge` | `color-mix(in oklab, var(--umbra-color-fixed-selected), #fff 35%)` |
| `--umbra-media-card-thumb-size` | `3.5rem` |
| `--umbra-media-card-title-font` | `--umbra-font-body` or `--umbra-font-title` |

| Prop | Type | Purpose |
|---|---|---|
| `variant` | `"compact" \| "hero"` | Default `compact`; `pair` when `opposite` is set. |
| `image` | `ReactNode` | The picture, as any node: an `<img>`, an `<svg>`, a chart. Wins over `src`. |
| `src` | `string` | The address of the picture. When there is none, or it fails to load, a drawn placeholder shows. |
| `alt` | `string` | What the picture shows. Leave empty for a picture that only decorates the title. |
| `title` | `ReactNode` | The headline. In a `pair` card, the title of the first side. |
| `headingLevel` | `4 \| 3 \| 2 \| 5 \| 6` |  |
| `titleLines` | `number` | The most lines the title wraps to. |
| `description` | `ReactNode` | A paragraph under the title. |
| `descriptionLines` | `number` | The most lines the description wraps to. |
| `category` | `ReactNode` | A category: text becomes a `Tag`, a node is drawn as it is. |
| `meta` | `ReactNode` | A quiet line: a time, a source. |
| `actions` | `ReactNode` | Controls of the card: they stay separate from the card's own link. They move into a menu when they do not fit. |
| `moreLabel` | `string` | Accessible name of that menu's button. |
| `side` | `Omit<MediaCardSide, "title">` | `pair`: the icon and the value of the first side, whose title is `title`. |
| `opposite` | `MediaCardSide` | `pair`: the second side. Sets the `pair` variant. |
| `center` | `ReactNode` | `pair`: what stands between the two sides. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Names a card that has no title. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `loading` | `boolean` | Marks the card busy for assistive technology. |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `selected` | `boolean` | The card is the chosen one of its set: the selected fill and an edge, and `aria-current`. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `imagePlacement` | `"above" \| "behind"` | `hero` only: the image above the text, or behind it under a scrim. |
| `href` | `string` | Makes the whole card a link. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link for `href`. Defaults to a plain `<a>`. |
| `onPress` | `(() => void)` | Makes the whole card a button. |

**Parts**: `image`, `category`, `title`, `description`, `meta`, `actions`, `pair`, `skeleton`.

**Blocks**: `MediaCard.Root`, `MediaCard.Image`, `MediaCard.Content`, `MediaCard.Title`, `MediaCard.Description`, `MediaCard.Footer`, `MediaCard.Meta`, `MediaCard.Category`, `MediaCard.Actions`, `MediaCard.Pair`.

## Menu

A list of actions or links that opens from a control. One tab stop; arrow keys, type-ahead, and submenus that open with the arrow keys.

**Tokens**: each with its default. It also reads the tokens of [`ScrollArea`](#scrollarea).

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-menu-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-menu-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-menu-item-danger-highlight-fg` | `color-mix(in oklab, var(--umbra-color-semantic-danger), #fff 22%)` |
| `--umbra-menu-item-height` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-menu-item-hover-bg` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-menu-item-radius` | `--umbra-radius-control` (4px) |
| `--umbra-menu-max-width` | `360px` |
| `--umbra-menu-min-width` | `180px` |
| `--umbra-menu-radius` | `--umbra-radius-card` (8px) |

| Prop | Type | Purpose |
|---|---|---|
| `items` | `MenuEntry[]` | The rows, as data. |
| `children` | `ReactNode` | The rows, as `Menu.Item`, `Menu.Section`, `Menu.Separator` and `Menu.Sub` blocks. |
| `trigger` | `ReactNode` | The control that opens the menu: an umbra-ui button, or a plain `<button>`. Leave it out to use `anchorRef`. |
| `anchorRef` | `RefObject<Element \| null>` | The element to open against, when there is no `trigger`. Use it with `open`. |
| `open` | `boolean` | Controlled state. |
| `defaultOpen` | `boolean` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `aria-label` | `string` | Accessible name. A menu with a `trigger` is named by it. |
| `onAction` | `((id: string) => void)` | Called with the id of the row the user chose. |
| `selectedIds` | `string[]` | The checked `checkbox` and `radio` rows, in every section and submenu. |
| `defaultSelectedIds` | `string[]` |  |
| `onSelectionChange` | `((ids: string[]) => void)` |  |
| `placement` | `OverlayPlacement` | Side of the anchor and alignment along it. It flips to the other side to stay in the window. |
| `offset` | `number` | Gap between the anchor and the menu, in pixels. |
| `matchAnchorWidth` | `boolean` | Makes the menu at least as wide as its anchor. |
| `maxHeight` | `number` | Tallest the menu may be, in pixels. It is never taller than the room in the window; the rows scroll. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link for rows with `href`. Defaults to a plain `<a>`. |
| `emptyLabel` | `string` | Shown when there are no rows. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` | On the menu's panel. |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `item`, `check`, `sectionHeader`.

**Blocks**: `Menu.Item`, `Menu.Section`, `Menu.Separator`, `Menu.Sub`, `Menu.Context`.

## Modal

A panel over a dimmed page, for a focused task. Focus stays inside it and the page behind is inert until it closes. Its body scrolls inside; the page never does.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-modal-backdrop-filter` | `none` |
| `--umbra-modal-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-modal-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-modal-duration` | `--umbra-motion-duration-slow` (240ms) |
| `--umbra-modal-margin` | `--umbra-density-page-margin` (32px at the default density) |
| `--umbra-modal-nav-width` | `--umbra-size-modal-nav` (240px) |
| `--umbra-modal-padding` | `--umbra-density-card-padding` (16px at the default density) |
| `--umbra-modal-radius` | `--umbra-radius-card` (8px) |
| `--umbra-modal-scrim` | `--umbra-color-base-scrim` (rgba(5, 2, 10, 0.72)) |
| `--umbra-modal-shadow` | `--umbra-elevation-overlay` (0 8px 24px rgba(0, 0, 0, 0.5)) |
| `--umbra-modal-width` | `var(--width)` |
| `--umbra-modal-z-index` | `--umbra-layer-modal` (1200) |

| Prop | Type | Purpose |
|---|---|---|
| `trigger` | `ReactNode` | A button that opens the modal. Leave out to control it with `open`. |
| `toolbar` | `ReactNode` | Tabs or filters that stay fixed under the header. |
| `nav` | `ReactNode` | Side navigation at the start: the panel becomes two columns. |
| `navLabel` | `string` | Text of the toggle that shows `nav` below the minimum window. |
| `footer` | `ReactNode` | Status and actions, fixed below the body. |
| `padding` | `"default" \| "none"` | `none` for an edge-to-edge body. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name, for a modal without a title. |
| `variant` | `ModalVariant` | `alertdialog` asks for a decision: no outside press, no close button. `drawer` slides in from an edge. |
| `open` | `boolean` | Controlled open state. |
| `defaultOpen` | `boolean` |  |
| `size` | `ModalSize` | Width. `full` fills the window minus a margin. A bottom drawer is always as wide as the window. |
| `headingLevel` | `4 \| 3 \| 1 \| 2 \| 5 \| 6` | Heading level of the title. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onRequestClose` | `(() => boolean \| void)` | Called before the modal closes, however it was asked to. Return `false` to keep it open (unsaved changes). |
| `side` | `"start" \| "end" \| "bottom"` | The edge a `drawer` is attached to. |
| `height` | `"auto" \| "fill"` | `auto`: as tall as the content, up to the window. `fill`: always the full available height. |
| `dismissOnEscape` | `boolean` |  |
| `dismissOnOutsidePress` | `boolean` | Default: true, and always false for an `alertdialog`. |
| `initialFocusRef` | `RefObject<HTMLElement \| null>` | Focused when the modal opens, instead of its first control. An element marked `data-autofocus` works too. |
| `icon` | `ReactNode` | Leading icon or image. |
| `title` | `ReactNode` |  |
| `closeLabel` | `string` | Accessible name of the close button. |
| `description` | `ReactNode` | A line under the title. It is also what a screen reader hears as the modal's description. |
| `hideClose` | `boolean` | Default: false, and true for an `alertdialog`. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `header`, `title`, `description`, `close`, `toolbar`, `nav`, `body`, `footer`.

**Blocks**: `Modal.Root`, `Modal.Trigger`, `Modal.Overlay`, `Modal.Content`, `Modal.Header`, `Modal.Title`, `Modal.Description`, `Modal.Toolbar`, `Modal.Nav`, `Modal.Body`, `Modal.Footer`, `Modal.Close`.

## Page

The content area under the bars: applies the outer margin and the context tint.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-page-gap` | `--umbra-density-gap` (20px at the default density) |
| `--umbra-page-margin` | `--umbra-density-page-margin` (32px at the default density) |

| Prop | Type | Purpose |
|---|---|---|
| `header` | `ReactNode` | A `PageHeader`, fixed above the content. |
| `footer` | `ReactNode` | An `ActionBar`, fixed below the content. |
| `loading` | `boolean` | Shows a skeleton in place of the content. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `children` | `ReactNode` | One `Columns`, `Stack` or `Card`. |
| `context` | `ContextTint` | Context tint for this page: a preset name or a colour. Defaults to the provider's. |
| `padding` | `"default" \| "none"` | `none` for edge-to-edge content. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `header`, `content`, `footer`.

**Blocks**: `Page.Root`, `Page.Header`, `Page.Content`, `Page.Footer`.

## PageHeader

The header of a page or of a detail pane: what it shows, facts about it, and its actions.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-page-header-bg` | `transparent`; `--umbra-context-card-tint-strong`; `--umbra-color-brand` (#2a2f8f) |
| `--umbra-page-header-border` | `--umbra-color-base-border-strong` (#47395e) or `color-mix(in oklab, var(--umbra-context) 30%, var(--umbra-color-base-border-subtle))` |
| `--umbra-page-header-fg` | `inherit`; `var(--umbra-color-on-brand, #fff)`; `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-page-header-media-size` | `56px` or `--umbra-density-control-height` (36px at the default density) |
| `--umbra-page-header-media-size-small` | `32px` |
| `--umbra-page-header-padding` | `var(--card-pad) var(--card-pad) 0`; `0px`; `--umbra-density-card-padding` (16px at the default density) |
| `--umbra-page-header-radius` | `--umbra-radius-card` (8px) |
| `--umbra-page-header-title-font` | `--umbra-font-display` or `--umbra-font-title` |
| `--umbra-page-header-title-min-width` | `4rem` |

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` |  |
| `subtitle` | `ReactNode` | A line under the title. |
| `overline` | `ReactNode` | A small line above the title, for example the kind of thing the page shows. |
| `media` | `ReactNode` | Leading avatar, entity icon or image. |
| `meta` | `ReactNode \| PageHeaderFact[]` | A row of facts: `{ label, value }` items, or any node. |
| `tags` | `ReactNode` | Tags or badges after the title. |
| `actions` | `ReactNode` | Trailing controls. They move into an overflow menu when they do not fit. |
| `moreLabel` | `string` | Accessible name of the overflow menu button. |
| `onBack` | `(() => void)` | Shows a back button before the title. |
| `backLabel` | `string` | Accessible name of the back button. |
| `breadcrumbs` | `PageHeaderCrumb[]` | The path to this page; the last item is the current page. |
| `breadcrumbsLabel` | `string` | Accessible name of the breadcrumb landmark. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs the app's router link into the breadcrumbs. Defaults to a plain `<a>`. |
| `tabs` | `ReactNode` | A tab list, placed along the bottom edge. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `"default" \| "tinted" \| "band"` | `tinted` is a panel in the context tint. `band` fills with the brand colour, or `bandColor`. |
| `size` | `"compact" \| "default"` | `compact` is for the header of a detail pane inside a card. |
| `bandColor` | `string` | Colour of the band (hex or `rgb()`); the text colour is chosen for contrast with it. |
| `headingLevel` | `4 \| 3 \| 1 \| 2 \| 5 \| 6` | Heading level of the title. |

**Parts**: `breadcrumbs`, `back`, `media`, `overline`, `title`, `subtitle`, `meta`, `actions`, `tabs`.

**Blocks**: `PageHeader.Root`, `PageHeader.Breadcrumbs`, `PageHeader.Bar`, `PageHeader.Content`, `PageHeader.Back`, `PageHeader.Media`, `PageHeader.Titles`, `PageHeader.Overline`, `PageHeader.Title`, `PageHeader.Subtitle`, `PageHeader.Meta`, `PageHeader.Actions`, `PageHeader.Tabs`.

## PieIndicator

A small disc of wedges that fills with a value: a level gauge for table cells, rows and lines of text.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-pie-indicator-fill` | `--umbra-color-fixed-accent-text` (#f77bf0) |
| `--umbra-pie-indicator-gap` | `--umbra-space-2` (4px) |
| `--umbra-pie-indicator-size` | `16px`; `12px`; `24px` |
| `--umbra-pie-indicator-track` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-pie-indicator-track-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-pie-indicator-wedge-gap` | `0.16` |

| Prop | Type | Purpose |
|---|---|---|
| `label` | `ReactNode` | The name of the indicator, shown after the disc. |
| `valueLabel` | `ReactNode` | Replaces the formatted value. Setting it shows the value. |
| `showValue` | `boolean` | Shows the value as text. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `number \| null` | The current value. `null` or nothing means there is no value: the disc is empty, and says so. |
| `aria-label` | `string` | Names an indicator that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `MeterTone` | Colour of the filled wedges. A matching threshold wins over it. |
| `variant` | `"segmented" \| "continuous"` | `segmented` fills whole wedges; `continuous` fills one sector to the exact value. |
| `loading` | `boolean` | Shows skeletons in place of the disc and the value. |
| `size` | `"default" \| "small" \| "large"` |  |
| `layout` | `"block" \| "inline"` | `inline` puts the disc, the label and the value on one line; `block` puts the disc above them. |
| `emptyLabel` | `ReactNode` | Shown in place of the value text when there is no value. |
| `min` | `number` |  |
| `max` | `number` |  |
| `thresholds` | `boolean \| ThresholdList` | Colours the fill by the band of the value: an ascending list of `{ from, tone?, color?, label? }`. `true` is thirds of the scale (danger, warning, success); plain numbers are boundaries on the value ramp. The filled amount shows the level without the colour, and the band's `label` joins the value text. |
| `lowerIsBetter` | `boolean` | For a scale where low is good: mirrors the colours of the bands. The labels stay. |
| `segments` | `number` | Number of wedges of the segmented disc. |
| `formatValue` | `((value: number, scale: PieIndicatorScale) => string)` | Text of a value. The default is a rounded percentage. |
| `noValueLabel` | `string` | What assistive technology and the tooltip say when there is no value. |
| `tooltip` | `boolean` | `false` turns off the tooltip that shows the exact value on hover. |
| `highlightChanges` | `boolean` | A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise. A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value is never counted up or down. |
| `increasedLabel` | `string` | What a screen reader hears with the sign of a value that rose or fell. |
| `decreasedLabel` | `string` |  |

**Parts**: `disc`, `label`, `value`, `skeleton`.

**Blocks**: `PieIndicator.Root`, `PieIndicator.Disc`, `PieIndicator.Label`, `PieIndicator.Value`.

## Planner

A month of days with a fixed number of slots each, and room beside every week for its controls.

**Tokens**: each with its default. It also reads the tokens of [`ScrollArea`](#scrollarea), [`WeekStrip`](#weekstrip).

| Token | Default |
|---|---|
| `--umbra-planner-aside-padding` | `--umbra-space-3` (8px) |
| `--umbra-planner-border-color` | `--umbra-color-base-border-subtle` (#2e2440) |
| `--umbra-planner-day-gap` | `--umbra-space-2` (4px) |
| `--umbra-planner-gap` | `--umbra-space-3` (8px) |
| `--umbra-planner-header-bg` | `var(--umbra-scroll-fade-color, var(--scroll-fade-color, var(--umbra-context-card-tint)))` |

| Prop | Type | Purpose |
|---|---|---|
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Names the grid, before the month: "Schedule, October 2026". |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `height` | `FillHeight` | `fill` (default) takes the height of the parent, and falls back to the content's height in a parent that has none. `content` is always as tall as the weeks. A number is a height in pixels. |
| `today` | `string` | The current day, as `'2026-10-11'`. Defaults to the day it is where the user is. |
| `month` | `string` | The month shown, as `'2026-10'`. Controlled. |
| `defaultMonth` | `string` | The month shown at first. Defaults to the month of `today`. |
| `onMonthChange` | `((month: IsoMonth) => void)` |  |
| `minMonth` | `string` | The first and the last month the user can go to. |
| `maxMonth` | `string` |  |
| `weekStartsOn` | `WeekStart` | The first day of the week, 0 (Sunday) to 6, where the provider's locale should not decide. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `onAction` | `((id: string) => void)` | Called with the id of an item when it is activated: a click, Enter or Space. |
| `items` | `readonly ScheduleItem[]` | The entries. Only those on the days shown are drawn. |
| `slotsPerDay` | `number` | The number of slots of each day. A slot without an item is drawn as a free one. |
| `selectedDate` | `string \| null` | The chosen day, as `'2026-10-11'`. Controlled; `null` is none. |
| `defaultSelectedDate` | `string \| null` |  |
| `onSelectedDateChange` | `((date: IsoDate) => void)` |  |
| `onDayAction` | `((date: IsoDate) => void)` | Called with the day when its header or one of its free slots is activated. |
| `renderWeek` | `((week: PlannerWeek) => ReactNode)` | The side column: what stands beside each week, such as its settings or "Copy" and "Clear" buttons. |
| `weekAsideWidth` | `number` | Width of the side column, in pixels. |
| `weekLabel` | `string` | Names the side column, the side cell of a week ("Week, Oct 11 – 17") and the button it collapses to. |
| `emptyWeekLabel` | `ReactNode` | Shown under the day headers of a week that has no items. |
| `freeLabel` | `string` | What assistive technology reads for a free slot. |
| `hiddenItemsLabel` | `((count: number) => string)` | Names the mark of a day with more items than `slotsPerDay`: "+2" beside its date, read as "2 more" and the items. |
| `weekdayFormat` | `"auto" \| WeekdayFormat` | The names of the weekdays above the grid. `auto` shortens them as the columns narrow. |
| `slotSize` | `"default" \| "small"` |  |
| `slotDisplay` | `"icon" \| "auto" \| "full"` | `auto` hides the labels of the slots, leaving their icons, when a day is too narrow for them. |
| `moreLabel` | `string` | Accessible name of that menu's button. |
| `previousLabel` | `string` |  |
| `nextLabel` | `string` |  |
| `todayLabel` | `string` |  |
| `monthLabel` | `string` | Accessible name of the list of months. |

**Parts**: `day`, `slot`, `placeholder`, `skeleton`, `weekdays`, `weekEmpty`, `state`, `toolbar`.

**Blocks**: `Planner.Root`, `Planner.Toolbar`, `Planner.Grid`, `Planner.Row`, `Planner.Cell`.

## Popover

An anchored panel without a backdrop: the page behind it stays usable. It keeps the density, context tint and tokens of the place it was opened from.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-popover-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-popover-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-popover-max-width` | `420px` or `720px` |
| `--umbra-popover-min-width` | `240px` or `480px` |
| `--umbra-popover-padding` | `--umbra-density-card-padding` (16px at the default density) |
| `--umbra-popover-radius` | `--umbra-radius-card` (8px) |
| `--umbra-popover-shadow` | `--umbra-elevation-overlay` (0 8px 24px rgba(0, 0, 0, 0.5)) |
| `--umbra-popover-title-font` | `--umbra-font-card-title` or `--umbra-font-title` |

| Prop | Type | Purpose |
|---|---|---|
| `trigger` | `ReactNode` | The control that opens it: an umbra-ui button, or a plain `<button>`. Leave it out to use `anchorRef`. |
| `toolbar` | `ReactNode` | Filters or tabs that stay fixed above the body. |
| `footer` | `ReactNode` | Status or actions fixed below the body. |
| `children` | `ReactNode \| ((close: () => void) => ReactNode)` | The body. A function receives `close`. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name, when there is no title. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `open` | `boolean` | Controlled state. |
| `defaultOpen` | `boolean` |  |
| `size` | `"default" \| "large"` | `large` is a wide panel with room for a toolbar and a footer. |
| `anchorRef` | `RefObject<Element \| null>` | The element to open against, when there is no `Popover.Trigger`. Use it with `open`. |
| `placement` | `OverlayPlacement` | Side of the anchor and alignment along it. It flips to the other side to stay in the window. |
| `offset` | `number` | Gap between the anchor and the panel, in pixels. |
| `matchAnchorWidth` | `boolean` | Gives the panel the width of its anchor. |
| `maxHeight` | `number` | Tallest the panel may be, in pixels. It is never taller than the room in the window; the body scrolls. |
| `arrow` | `boolean` | A small pointer towards the anchor. |
| `dismissOnBlur` | `boolean` | Closes when keyboard focus leaves the panel. Escape and a press outside always close it. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `subtitle` | `ReactNode` | Second line, in the body font. |
| `actions` | `ReactNode` | Trailing controls, for example the popover's main action. |
| `title` | `ReactNode` |  |
| `closeButton` | `boolean` | Shows a close button. |
| `closeLabel` | `string` | Accessible name of the close button. |
| `padding` | `"default" \| "none"` | `none` for edge-to-edge lists and tables. |

**Parts**: `header`, `toolbar`, `body`, `footer`.

**Blocks**: `Popover.Root`, `Popover.Trigger`, `Popover.Content`, `Popover.Header`, `Popover.Toolbar`, `Popover.Body`, `Popover.Footer`.

## PrimaryAction

The one primary action of the app, at the end of the `TopBar`. Its label follows the state of the app. It fills the height of the bar and shows its icon only when the bar runs out of room.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-primary-action-bg` | `--umbra-color-fixed-primary` (#db1065) |
| `--umbra-primary-action-bg-end` | `--umbra-color-fixed-primary-end` (#c2128a) |
| `--umbra-primary-action-caret-width` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-primary-action-fg` | `--umbra-color-fixed-on-primary` (#ffffff) |
| `--umbra-primary-action-min-height` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-primary-action-min-width` | `180px` |
| `--umbra-primary-action-padding-x` | `--umbra-space-6` (20px) |
| `--umbra-primary-action-radius` | `0` |

| Prop | Type | Purpose |
|---|---|---|
| `label` (required) | `string` | What the action does now. It changes with the state of the app ("Continue", "Review 3 items"). |
| `description` | `ReactNode` | A second, smaller line under the label. |
| `icon` | `ReactNode` | Shown at the end of the button, and alone when the button collapses. |
| `iconPosition` | `"start" \| "end"` | Puts the icon before the label. |
| `onPress` | `(() => void)` |  |
| `href` | `string` | Renders a link. |
| `loading` | `boolean` | Shows the spinner and blocks presses. The button stays focusable. |
| `loadingLabel` | `string` | What a screen reader hears while `loading`. |
| `disabled` | `boolean` |  |
| `shortcut` | `string` | Id of a shortcut in the provider's list: binds the key and shows the hint in the tooltip. |
| `badge` | `number` | A count beside the label, for example the items that wait for the user. |
| `attention` | `boolean` | Marks that the app needs the user before it can go on: a still marker, never a pulse. |
| `attentionLabel` | `string` | What a screen reader hears for the `attention` marker. |
| `menu` | `MenuEntry[]` | Alternative actions. They open from a caret at the end of the button. |
| `onMenuAction` | `((id: string) => void)` | Called with the id of the chosen alternative. |
| `menuLabel` | `string` | Accessible name of the caret that opens `menu`. |
| `collapsed` | `boolean` | Shows the icon only. Set by the `TopBar` when it runs out of room; the button also does it by itself. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `icon`, `label`, `description`, `badge`, `attention`, `spinner`, `menuTrigger`.

**Blocks**: none.

## PrimaryNav

The top-level sections of the app, inside the `TopBar`.

**Tokens**: each with its default. It also reads the tokens of [`SubNav`](#subnav).

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-nav-font` | `--umbra-font-nav` |
| `--umbra-nav-gap` | `--umbra-space-7` (24px) |
| `--umbra-nav-indicator-color` | `currentColor` |

| Prop | Type | Purpose |
|---|---|---|
| `items` | `NavItem[]` | The top-level sections. `items` inside an item makes a dropdown. |
| `parts` | `see Parts` | Replace or hide named pieces. An `item` function receives each item's props. |
| `value` | `string` | The active item. |
| `onChange` | `((id: string) => void)` | Called with the id of the item the user chose. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link. Defaults to a plain `<a>`. |
| `moreLabel` | `string` | Label of the overflow item. |
| `submenuLabel` | `((label: string) => string)` | Accessible name of the caret that opens an item's dropdown, from the item's label. |
| `aria-label` | `string` | Accessible name of the navigation landmark. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `indicator`, `more`, `item`.

**Blocks**: `PrimaryNav.Root`, `PrimaryNav.Item`, `PrimaryNav.Menu`.

## ProgressBar

A bar that fills with a value: progress of a task, or a measured level. Fills the width of its container.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-progress-bar-fill` | `--umbra-color-fixed-primary` (#db1065) or `--umbra-color-fixed-accent-text` (#f77bf0) |
| `--umbra-progress-bar-fill-end` | `var(--umbra-progress-bar-fill, var(--umbra-color-fixed-accent-text))` |
| `--umbra-progress-bar-hatch` | `color-mix(in oklab, var(--umbra-color-base-surface1) 75%, transparent)` |
| `--umbra-progress-bar-height` | `6px`; `4px`; `18px` |
| `--umbra-progress-bar-min-width` | `--umbra-space-7` (24px) |
| `--umbra-progress-bar-radius` | `--umbra-radius-pill` (999px) |
| `--umbra-progress-bar-segment-gap` | `--umbra-space-1` (2px) |
| `--umbra-progress-bar-target` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-progress-bar-target-width` | `2px` |
| `--umbra-progress-bar-track` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-progress-bar-track-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-progress-bar-travel-duration` | `--umbra-motion-duration-pulse` (1600ms) |

| Prop | Type | Purpose |
|---|---|---|
| `label` | `ReactNode` | The name of the bar, shown beside or above it. |
| `valueLabel` | `ReactNode` | Replaces the formatted value. Setting it shows the value. |
| `showValue` | `boolean` | Shows the value as text. |
| `valuePlacement` | `"outside" \| "inside"` | `inside` draws the value on the bar; it needs `size="thick"`, and hides when the bar is too short for it. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `indeterminate` | `boolean` | Progress of unknown length. Moves, or shows a static striped fill when motion is reduced. |
| `value` | `number \| null` | The current value. A stacked bar defaults to the sum of its parts. `null` or nothing means there is no value: the bar is empty, and says so. |
| `aria-label` | `string` | Names a bar that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `MeterTone` | Colour of the fill. A matching threshold wins over it. |
| `loading` | `boolean` | Shows skeletons in place of the bar and the value. |
| `size` | `"default" \| "thin" \| "thick"` |  |
| `layout` | `"block" \| "inline"` | `inline` puts the label, the bar and the value on one line, for table cells and rows. |
| `emptyLabel` | `ReactNode` | Shown in place of the value text when there is no value. |
| `min` | `number` |  |
| `max` | `number` |  |
| `kind` | `"progress" \| "meter"` | `progress` for a task that advances (`role="progressbar"`), `meter` for a measured level (`role="meter"`). |
| `thresholds` | `boolean \| ThresholdList` | Colours the fill by the band of the value: an ascending list of `{ from, tone?, color?, label? }`. `true` is thirds of the scale (danger, warning, success); plain numbers are boundaries on the value ramp. Each band also has a pattern, and its `label` joins the value text. |
| `lowerIsBetter` | `boolean` | For a scale where low is good: mirrors the colours and patterns of the bands. The labels stay. |
| `segments` | `number \| number[]` | Splits the bar: a number of equal segments, or the values where a segment ends. |
| `stack` | `ProgressBarStackItem[]` | Several coloured parts, one after another. Replaces the single fill. |
| `target` | `number` | Draws a tick at a goal value. |
| `targetLabel` | `string` | Names the target for assistive technology. |
| `formatValue` | `((value: number, scale: ProgressBarScale) => string)` | Text of a value. The default is a rounded percentage. |
| `noValueLabel` | `string` | What assistive technology and the tooltip say when there is no value. |
| `tooltip` | `boolean` | `false` turns off the tooltip that shows the exact value on hover. |
| `highlightChanges` | `boolean` | A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise. A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value is never counted up or down. |
| `increasedLabel` | `string` | What a screen reader hears with the sign of a value that rose or fell. |
| `decreasedLabel` | `string` |  |

**Parts**: `label`, `value`, `track`, `fill`, `target`, `skeleton`.

**Blocks**: `ProgressBar.Root`, `ProgressBar.Label`, `ProgressBar.Value`, `ProgressBar.Track`, `ProgressBar.Fill`, `ProgressBar.Target`.

## RadarChart

Compares one or more series across several axes that share a centre.

**Tokens**: each with its default. It also reads the tokens of [`Heatmap`](#heatmap), [`Legend`](#legend), [`Scatter`](#scatter).

| Token | Default |
|---|---|
| `--umbra-chart-annotation` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-annotation-dash` | `5 3` |
| `--umbra-chart-annotation-width` | `1.5px` |
| `--umbra-chart-area-opacity` | `0.22` |
| `--umbra-chart-axis` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-axis-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-edge-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-opacity` | `0.16` |
| `--umbra-chart-bar-radius` | `2px` |
| `--umbra-chart-center-font` | `--umbra-font-title` |
| `--umbra-chart-content-height` | `240px` |
| `--umbra-chart-dim-opacity` | `0.25` |
| `--umbra-chart-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-font` | `--umbra-font-label` |
| `--umbra-chart-gap` | `--umbra-space-3` (8px) |
| `--umbra-chart-grid` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-grid-dash` | `1 4` |
| `--umbra-chart-grid-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-label-halo` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-chart-line-width` | `2px` |
| `--umbra-chart-outline-width` | `1.5px` |
| `--umbra-chart-point-scale` | `1` |
| `--umbra-chart-ring-width` | `1.5px` |
| `--umbra-chart-tooltip-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-chart-tooltip-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-chart-tooltip-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-chart-tooltip-max-width` | `20rem` |
| `--umbra-chart-tooltip-radius` | `--umbra-radius-control` (4px) |
| `--umbra-chart-track` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-chart-track-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-track-border-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-value-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-series-marker-size` | `0.875rem` |

| Prop | Type | Purpose |
|---|---|---|
| `rings` | `number` | Number of grid rings, the outer one included. |
| `grid` | `"circle" \| "polygon"` | Shape of the grid rings. |
| `filled` | `boolean` | Fills the area of each series. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name of the chart. Required unless `aria-labelledby` is set. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `hiddenIds` | `readonly string[]` | Ids of the series that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |
| `max` | `number` | The value at the outer ring. Defaults to a round number above the largest value. |
| `formatValue` | `((value: number) => string)` | Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. |
| `height` | `number \| "content" \| "fill"` | `fill` (default) takes the height of the parent, and falls back to the content's height in a parent that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content: the plot is `--umbra-chart-content-height` (240px) high. A number is a height in pixels. |
| `description` | `string` | What a screen reader hears after the name. Defaults to a generated summary of the data. |
| `labels` | `boolean` | Draws labels on the chart itself, so it can be read without the legend or the tooltip. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `series` (required) | `RadarSeries[]` |  |
| `aria-labelledby` | `string` | Id of the element that names the chart, for example a card title. |
| `legend` | `string \| number \| bigint \| boolean \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| ReactPortal \| Promise<string \| number \| bigint \| boolean \| ReactPortal \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| null \| undefined> \| null` | The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it. By default it is shown below the chart when there is more than one series. |
| `onPointPress` | `((point: ChartPoint) => void)` | Called when a point is clicked, or activated with Enter or Space. |
| `allHiddenLabel` | `string` | Shown in place of the plot when the legend has switched every series off. |
| `pointsLabel` | `string` | Accessible name of the list of data points. |
| `legendLabel` | `string` | Accessible name of the legend. |
| `startAngle` | `number` | Where the first axis points, in degrees clockwise from 12 o'clock. |
| `axes` (required) | `RadarAxis[]` |  |

**Parts**: `legend`, `tooltip`, `skeleton`, `empty`, `error`.

**Blocks**: `RadarChart.Root`, `RadarChart.Grid`, `RadarChart.Series`, `RadarChart.AxisLabels`.

## Radio

One option of a `RadioGroup`.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-field-description-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-field-error-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-field-marker-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-option-group-gap` | `--umbra-space-3` (8px) |
| `--umbra-option-group-inline-gap` | `--umbra-space-6` (20px) |
| `--umbra-option-group-min-option-width` | `12em` |
| `--umbra-option-group-text-gap` | `--umbra-space-2` (4px) |
| `--umbra-radio-bg` | `transparent` |
| `--umbra-radio-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-radio-border-width` | `calc(var(--umbra-border-width) * 2)` |
| `--umbra-radio-card-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-radio-card-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-radio-card-description-lines` | `2` |
| `--umbra-radio-card-divider` | `color-mix(in oklab, currentColor 25%, transparent)` |
| `--umbra-radio-card-media-size` | `1.5em` |
| `--umbra-radio-card-min-height` | `calc(var(--umbra-density-control-height) + 2 * var(--pad))` |
| `--umbra-radio-card-padding` | `--umbra-space-4` (12px) |
| `--umbra-radio-card-radius` | `--umbra-radius-control` (4px) |
| `--umbra-radio-card-selected-bg` | `color-mix(in oklab, var(--fill) 38%, var(--umbra-color-base-surface1))` |
| `--umbra-radio-card-selected-border` | `var(--umbra-radio-selected-bg, var(--umbra-color-fixed-selected))` |
| `--umbra-radio-gap` | `--umbra-space-3` (8px) |
| `--umbra-radio-invalid-border` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-radio-mark-color` | `--umbra-color-fixed-on-selected` (#ffffff) |
| `--umbra-radio-selected-bg` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-radio-size` | `calc(var(--umbra-density-control-height) / 2)` |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label; the title of a `card` option. |
| `description` | `ReactNode` | A second line under the label. |
| `media` | `ReactNode` | An icon or a small image, shown by the `card` variant. It hides when the card is narrow. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` (required) | `string` | What the group's `value` is when this option is chosen. |
| `aria-label` | `string` | Accessible name of an option that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `disabled` | `boolean` |  |

**Parts**: `mark`, `media`, `label`, `description`.

**Blocks**: `Radio.Root`, `Radio.Mark`, `Radio.Media`, `Radio.Label`, `Radio.Description`.

## RadioGroup

A choice of exactly one option among a few, all visible at once.

**Tokens**: each with its default. It also reads the tokens of [`Radio`](#radio).

| Token | Default |
|---|---|
| `--umbra-field-description-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-field-error-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-field-marker-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-option-group-gap` | `--umbra-space-3` (8px) |
| `--umbra-option-group-inline-gap` | `--umbra-space-6` (20px) |
| `--umbra-option-group-min-option-width` | `12em` |
| `--umbra-option-group-text-gap` | `--umbra-space-2` (4px) |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The options. |
| `label` | `ReactNode` | The group's label. |
| `description` | `ReactNode` | A line under the label. |
| `error` | `ReactNode` | An error message under the options, shown with an icon. Setting it makes the group invalid. |
| `columns` | `number` | Lays the options in a grid of at most this many columns; columns drop as the group narrows. `card` options are always in a grid, of one column by default. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `invalid` | `boolean` |  |
| `value` | `string \| null` | Controlled: the `value` of the chosen option. |
| `onChange` | `((value: string) => void)` |  |
| `aria-label` | `string` | Accessible name of a group that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` |  |
| `variant` | `RadioVariant` | `default`: a dot and a label. `card`: a bordered tile with a title, a description and an icon. |
| `orientation` | `"vertical" \| "horizontal"` | The direction of the options, and of the arrow keys that move between them. |
| `disabled` | `boolean` |  |
| `readOnly` | `boolean` |  |
| `required` | `boolean` |  |
| `requiredLabel` | `string` | The text of the required marker after the group label. |
| `name` | `string` | Form field name. |
| `defaultValue` | `string` |  |

**Parts**: `label`, `description`, `options`, `error`.

**Blocks**: `RadioGroup.Root`, `RadioGroup.Label`, `RadioGroup.Description`, `RadioGroup.Options`, `RadioGroup.Error`.

## Scatter

Points by two values, in one or more series; a third value makes them bubbles.

**Tokens**: each with its default. It also reads the tokens of [`Heatmap`](#heatmap), [`Legend`](#legend).

| Token | Default |
|---|---|
| `--umbra-chart-annotation` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-annotation-dash` | `5 3` |
| `--umbra-chart-annotation-width` | `1.5px` |
| `--umbra-chart-area-opacity` | `0.22` |
| `--umbra-chart-axis` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-axis-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-edge-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-band-opacity` | `0.16` |
| `--umbra-chart-bar-radius` | `2px` |
| `--umbra-chart-center-font` | `--umbra-font-title` |
| `--umbra-chart-content-height` | `240px` |
| `--umbra-chart-dim-opacity` | `0.25` |
| `--umbra-chart-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-chart-font` | `--umbra-font-label` |
| `--umbra-chart-gap` | `--umbra-space-3` (8px) |
| `--umbra-chart-grid` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-grid-dash` | `1 4` |
| `--umbra-chart-grid-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-label-halo` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-chart-line-width` | `2px` |
| `--umbra-chart-outline-width` | `1.5px` |
| `--umbra-chart-point-scale` | `1` |
| `--umbra-chart-ring-width` | `1.5px` |
| `--umbra-chart-tooltip-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-chart-tooltip-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-chart-tooltip-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-chart-tooltip-max-width` | `20rem` |
| `--umbra-chart-tooltip-radius` | `--umbra-radius-control` (4px) |
| `--umbra-chart-track` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-chart-track-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-chart-track-border-width` | `--umbra-border-width` (1px) |
| `--umbra-chart-value-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-scatter-bubble-opacity` | `0.55` |
| `--umbra-series-marker-size` | `0.875rem` |

| Prop | Type | Purpose |
|---|---|---|
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name of the chart. Required unless `aria-labelledby` is set. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `hiddenIds` | `readonly string[]` | Ids of the series that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |
| `formatValue` | `((value: number) => string)` | Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. |
| `height` | `number \| "content" \| "fill"` | `fill` (default) takes the height of the parent, and falls back to the content's height in a parent that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content: the plot is `--umbra-chart-content-height` (240px) high. A number is a height in pixels. |
| `description` | `string` | What a screen reader hears after the name. Defaults to a generated summary of the data. |
| `labels` | `boolean` | Draws labels on the chart itself, so it can be read without the legend or the tooltip. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `onAction` | `((id: string) => void)` | Called with the id of a point that is clicked, or activated with Enter or Space. |
| `series` (required) | `ScatterSeries[]` |  |
| `aria-labelledby` | `string` | Id of the element that names the chart, for example a card title. |
| `annotations` | `ChartAnnotation[]` | Reference lines and bands on either axis. |
| `xTitle` | `string` |  |
| `yTitle` | `string` |  |
| `legend` | `string \| number \| bigint \| boolean \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| ReactPortal \| Promise<string \| number \| bigint \| boolean \| ReactPortal \| ReactElement<unknown, string \| JSXElementConstructor<any>> \| Iterable<ReactNode> \| null \| undefined> \| null` | The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it. By default it is shown below the chart when there is more than one series. |
| `onPointPress` | `((point: ChartPoint) => void)` | Called when a point is clicked, or activated with Enter or Space. |
| `allHiddenLabel` | `string` | Shown in place of the plot when the legend has switched every series off. |
| `pointsLabel` | `string` | Accessible name of the list of data points. |
| `legendLabel` | `string` | Accessible name of the legend. |
| `yDomain` | `[number, number]` | The range of the y axis. Defaults to round numbers around the data. |
| `formatX` | `((x: ScatterX) => string)` | Formats an x value for the axis, the tooltip and screen readers. |
| `axes` | `boolean` | `false` draws no axis lines, grid, tick labels or titles: the points take the whole plot, for a chart over a backdrop. |
| `xDomain` | `[number, number] \| [Date, Date]` | The range of the x axis. Defaults to round numbers around the data, or the first and last date. |
| `sizeDomain` | `[number, number]` | The `size` values that give the smallest and the largest bubble. Defaults to 0 and the largest size. |
| `sizeLabel` | `string` | Names the `size` value in the tooltip, for screen readers and in the data table. |
| `formatSize` | `((size: number) => string)` | Formats a `size` value. Defaults to the provider's locale. |

**Parts**: `backdrop`, `legend`, `tooltip`, `skeleton`, `empty`, `error`.

**Blocks**: `Scatter.Root`, `Scatter.Backdrop`, `Scatter.Grid`, `Scatter.Annotations`, `Scatter.Points`, `Scatter.Axes`, `Scatter.PointLabels`.

## ScheduleSlot

A coloured chip for one entry of a schedule: an icon and a label, coloured by its category.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-schedule-slot-bg` | `var(--fill)` |
| `--umbra-schedule-slot-border` | `var(--line)` |
| `--umbra-schedule-slot-fg` | `var(--ink)` |
| `--umbra-schedule-slot-font` | `--umbra-font-label` |
| `--umbra-schedule-slot-gap` | `--umbra-space-2` (4px) |
| `--umbra-schedule-slot-height` | `calc(var(--umbra-density-table-row) + 2px)` or `max(16px, calc(var(--umbra-density-table-row) - 6px))` |
| `--umbra-schedule-slot-padding-x` | `--umbra-space-3` (8px) or `--umbra-space-2` (4px) |
| `--umbra-schedule-slot-radius` | `--umbra-radius-control` (4px) |
| `--umbra-schedule-slot-selected-ring` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-schedule-slot-stripe` | `var(--tone)` |
| `--umbra-schedule-slot-stripe-width` | `3px` |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label. Without one (`null`, `undefined` or an empty text) the slot is `empty` and shows `emptyLabel`. |
| `emptyLabel` | `ReactNode` | Shown when there is no label. |
| `icon` | `ReactNode` | The category's icon: with the label, the cue that does not depend on colour. |
| `loading` | `boolean` | Shows a placeholder of the slot's size. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link. Defaults to a plain `<a>`. |
| `aria-label` | `string` | Accessible name, for a slot whose content is not text. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `href` | `string` | Makes the slot a link. |
| `tone` | `Tone` | What the colour means. |
| `variant` | `"empty" \| "filled" \| "outlined"` | `filled`: tinted, with a stripe. `outlined`: the border only. `empty`: dashed and quiet, for free or rest time. |
| `size` | `"default" \| "small"` | `small` is for a strip in a small card. Otherwise the height follows the density level. |
| `selected` | `boolean` | Marks the chosen slot with a ring. |
| `disabled` | `boolean` |  |
| `onPress` | `(() => void)` | Makes the slot a button. |
| `color` | `string` | A free colour (any CSS colour) for a category of the app. Replaces `tone`. |
| `fullWidth` | `boolean` | Fills the width of its container. Otherwise it is as wide as its content. |
| `selectedLabel` | `string` | What a screen reader hears after the label of a selected slot. |
| `series` | `ScheduleSlotSeries` | A colour of the series palette, by its number. Replaces `tone`; `color` replaces both. |
| `display` | `"icon" \| "auto" \| "full"` | `icon` shows the icon alone; the label stays the accessible name and becomes a tooltip. `auto` does that by itself when the day of a `WeekStrip` or `Planner` around it is too narrow for a label. A slot without an icon always keeps its label. |

**Parts**: `icon`, `label`, `skeleton`.

**Blocks**: `ScheduleSlot.Root`, `ScheduleSlot.Icon`, `ScheduleSlot.Label`.

## ScrollArea

A region that scrolls inside its slot. The only place scrolling happens.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-scroll-fade-color` | `--umbra-context-card-tint` |
| `--umbra-scroll-thumb` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-scroll-thumb-hover` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-scroll-thumb-size` | `--umbra-size-scroll-thumb` (4px) |

| Prop | Type | Purpose |
|---|---|---|
| `axis` | `"vertical" \| "horizontal" \| "both"` |  |
| `scrollbar` | `"auto" \| "hover"` | `hover` shows the thumb only while the pointer or focus is inside the area. |
| `fade` | `boolean` | A soft fade at an edge that has more content. |
| `onReachEnd` | `(() => void)` | Called when the end is reached, for loading more: the bottom (`vertical`, `both`) or the far edge (`horizontal`). Once each time the end is reached. It is also called when the content does not fill the area, since its end is then in view: once when the area mounts, and once more each time the content has grown and still fits. A first page that is too short can therefore load the next. |
| `aria-label` | `string` | Accessible name, used when the area itself has to be focusable to be scrolled by keyboard. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `ref` | `Ref<HTMLDivElement>` | The root element. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `fade`.

**Blocks**: none.

## SearchField

A field for searching: always an input, or an icon that opens into one. It can list suggestions and recent searches.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-field-description-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-field-error-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-field-marker-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-option-group-gap` | `--umbra-space-3` (8px) |
| `--umbra-option-group-inline-gap` | `--umbra-space-6` (20px) |
| `--umbra-option-group-min-option-width` | `12em` |
| `--umbra-option-group-text-gap` | `--umbra-space-2` (4px) |
| `--umbra-search-field-bg` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-search-field-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-search-field-expanded-width` | `240px` |
| `--umbra-search-field-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-search-field-height` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-search-field-icon-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-search-field-invalid-border` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-search-field-list-max-width` | `480px` |
| `--umbra-search-field-min-width` | `120px` |
| `--umbra-search-field-padding-x` | `--umbra-space-4` (12px) |
| `--umbra-search-field-placeholder` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-search-field-radius` | `--umbra-radius-control` (4px) |
| `--umbra-search-field-shortcut-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-search-field-width` | `100%` |

| Prop | Type | Purpose |
|---|---|---|
| `clearLabel` | `string` | Accessible name of the clear button. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `recent` | `string[]` | Earlier searches, shown in the list while the field is empty. |
| `invalid` | `boolean` | Shows the danger border and an error icon. |
| `value` | `string` | Controlled text. |
| `onChange` | `((text: string) => void)` | Called with the text as it changes, after `debounce` milliseconds without typing. |
| `aria-label` | `string` | Accessible name, when there is no `FormField` label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` |  |
| `loading` | `boolean` | Shows a spinner in place of the search icon, and skeleton rows in an empty list. |
| `size` | `"default" \| "small"` | `small` is for table cells and dense toolbars. Otherwise the height follows the density level. |
| `disabled` | `boolean` |  |
| `label` | `string` |  |
| `readOnly` | `boolean` | Focusable and selectable, but cannot be changed. |
| `required` | `boolean` |  |
| `name` | `string` | Form field name. |
| `defaultValue` | `string` |  |
| `placeholder` | `string` |  |
| `loadingLabel` | `string` | What a screen reader hears while `loading`. |
| `onSubmit` | `((text: string) => void)` | Called with the text when Enter is pressed, or a recent search is chosen. |
| `onClear` | `(() => void)` | Called when the field is emptied with its clear button or Escape. |
| `debounce` | `number` | Milliseconds `onChange` waits after the last keystroke. Submitting and clearing do not wait. |
| `shortcut` | `string` | A key that focuses the field, shown at its end while it is empty: the id of a shortcut in the provider's list, or the keys themselves (`/`, `Mod+F`). |
| `collapsible` | `boolean` | Shows only the search icon until it is pressed, focused or has text; it collapses again when empty and blurred. |
| `expandMode` | `"inline" \| "overlay"` | How a `collapsible` field opens. `overlay`: over the space beside it, so nothing around it moves. `inline`: it takes the space, and what is beside it moves. |
| `expandTo` | `"start" \| "end"` | The direction an `overlay` field grows in. `start` suits a field at the end of a bar. |
| `collapsedLabel` | `ReactNode` | Text beside the icon of a collapsed field. |
| `landmark` | `boolean` | Makes the field a `search` landmark, for the main search of a page. |
| `suggestions` | `SearchSuggestion[]` | Rows shown in a list under the field, as given: the app filters them. Pass `[]`, not nothing, while there are none. |
| `onSelect` | `((id: string) => void)` | Called with the id of the suggestion the user chose. Its text becomes the field's text. |
| `onRemoveRecent` | `((text: string) => void)` | Lets the user remove a recent search: a button on its row, or Shift+Delete. |
| `maxHeight` | `number` | Tallest the list may be, in pixels. It is never taller than the room in the window; the rows scroll. |
| `noResultsLabel` | `string` | Shown when there is text and no suggestion for it. |
| `recentLabel` | `string` | Heading of the recent searches. |
| `removeRecentLabel` | `string` | Tooltip of the button that removes a recent search. |

**Parts**: `icon`, `input`, `clear`, `shortcut`, `suggestions`, `suggestion`, `empty`.

**Blocks**: `SearchField.Root`, `SearchField.Icon`, `SearchField.Input`, `SearchField.Clear`, `SearchField.Shortcut`, `SearchField.Suggestions`.

## SectionTitle

A heading for one section of content inside a card or page, with optional controls on the same line.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-section-link-color` | `--umbra-color-fixed-accent-text` (#f77bf0) |
| `--umbra-section-rule-color` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-section-title-color` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-section-title-font` | `700 16px/1.25 var(--umbra-font-family-heading)`; `--umbra-font-label`; `--umbra-font-body` |
| `--umbra-section-title-min-width` | `4rem` |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The title. |
| `variant` | `"heading" \| "link" \| "rule"` | `link` is chosen automatically when `href` or `onOpen` is set. |
| `headingLevel` | `4 \| 3 \| 2 \| 5 \| 6` | Heading level. |
| `href` | `string` | Makes the title a link to a fuller view of the section. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link for `href`. Defaults to a plain `<a>`. |
| `onOpen` | `(() => void)` |  |
| `count` | `number` | A number shown after the title. |
| `actions` | `ReactNode` | Trailing controls. They move into an overflow menu when they do not fit. |
| `moreLabel` | `string` | Accessible name of the overflow menu button. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `title`, `count`, `actions`.

**Blocks**: none.

## SegmentedFilter

A row of joined segments that filters the content below it. One or several can be selected.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-segmented-filter-bg` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-segmented-filter-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-segmented-filter-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-segmented-filter-height` | `--umbra-density-control-height` (36px at the default density) or `calc(var(--umbra-density-table-row) - 2px)` |
| `--umbra-segmented-filter-min-item-width` | `4.5em` |
| `--umbra-segmented-filter-padding-x` | `--umbra-space-4` (12px) or `--umbra-space-3` (8px) |
| `--umbra-segmented-filter-radius` | `--umbra-radius-control` (4px) |
| `--umbra-segmented-filter-selected-bg` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-segmented-filter-selected-border` | `color-mix(in oklab, var(--selected), #fff 35%)` |
| `--umbra-segmented-filter-selected-fg` | `--umbra-color-fixed-on-selected` (#ffffff) |

| Prop | Type | Purpose |
|---|---|---|
| `all` | `boolean` | Adds a first segment that stands for "no filter". Choosing it clears the others. |
| `allLabel` | `string` | Label of the "All" segment. |
| `allCount` | `number` | Count of the "All" segment. |
| `size` | `"default" \| "small"` | `small` is for table cells and dense toolbars. Otherwise the height follows the density level. |
| `fullWidth` | `boolean` | Fills the width of its container with equal segments. |
| `disabled` | `boolean` |  |
| `moreLabel` | `string` | Accessible name of the button that opens the menu of segments that do not fit. |
| `aria-label` | `string` | Accessible name of the group. |
| `aria-labelledby` | `string` | Id of the element that names the group. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `selectionMode` | `"single" \| "multiple"` | `single`: one segment, like radio buttons. `multiple`: any number, like toggle buttons. |
| `value` | `string \| null` | The selected segment. `null` selects none, or the "All" segment when `all` is set. |
| `defaultValue` | `string \| null` |  |
| `onChange` | `((id: string \| null) => void) \| ((ids: string[]) => void)` | Called with the selected id (`null` for "All"), or with the list of ids in `multiple` mode. |
| `values` | `string[]` | The selected segments in `multiple` mode. An empty list selects the "All" segment when `all` is set. |
| `defaultValues` | `string[]` |  |
| `items` | `SegmentedFilterItem[]` | The segments. Leave out to pass `SegmentedFilter.Item` children instead. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `children` | `ReactNode` |  |

**Parts**: `icon`, `count`, `check`, `item`.

**Blocks**: `SegmentedFilter.Root`, `SegmentedFilter.Item`.

## Select

Chooses one option, or several with `multiple`, from a list that opens under a button.

**Tokens**: each with its default. It also reads the tokens of [`Menu`](#menu).

| Token | Default |
|---|---|
| `--umbra-field-description-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-field-error-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-field-marker-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-option-group-gap` | `--umbra-space-3` (8px) |
| `--umbra-option-group-inline-gap` | `--umbra-space-6` (20px) |
| `--umbra-option-group-min-option-width` | `12em` |
| `--umbra-option-group-text-gap` | `--umbra-space-2` (4px) |
| `--umbra-select-bg` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-select-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-select-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-select-ghost-bg` | `transparent` |
| `--umbra-select-height` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-select-icon-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-select-invalid-border` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-select-min-width` | `96px` |
| `--umbra-select-option-selected-bg` | `color-mix(in oklab, var(--umbra-color-fixed-selected) 28%, transparent)` |
| `--umbra-select-option-stripe-width` | `3px` |
| `--umbra-select-padding-x` | `--umbra-space-4` (12px) |
| `--umbra-select-placeholder` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-select-popover-max-width` | `480px` |
| `--umbra-select-radius` | `--umbra-radius-control` (4px) |
| `--umbra-select-swatch-size` | `0.75em` |
| `--umbra-select-width` | `auto` |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The choices as `Select.Option` and `Select.Section` blocks, in place of `options`. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `invalid` | `boolean` | Shows the danger border and an error icon. Put the message in the `error` of a `FormField`. |
| `value` | `string` | The id of the chosen option; `''` is none. Controlled. |
| `onChange` | `((id: string) => void)` | Called with the id of the chosen option, or `''` when the choice is cleared. |
| `aria-label` | `string` | Accessible name of a select that has no `FormField` label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` |  |
| `variant` | `"default" \| "ghost" \| "inCell"` | `ghost` has no border until hovered, for toolbars and headers. `inCell` fills a table cell and takes the `tone` or `color` of the chosen option as its fill. |
| `open` | `boolean` | Controlled state of the list. |
| `defaultOpen` | `boolean` |  |
| `size` | `"default" \| "small"` | `small` is for table cells and dense toolbars. Otherwise the height follows the density level. |
| `disabled` | `boolean` |  |
| `multiple` | `boolean` | Lets several options be chosen: use `values` and `onValuesChange`. Options show checkboxes. |
| `readOnly` | `boolean` | Focusable, but the choice cannot be changed and the list does not open. |
| `required` | `boolean` |  |
| `name` | `string` | Form field name: the chosen ids are sent with the form. |
| `defaultValue` | `string` |  |
| `placeholder` | `string` | Shown while nothing is chosen. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `options` | `SelectEntry[]` | The choices, as data. Or pass `Select.Option` and `Select.Section` blocks as children. |
| `values` | `string[]` | The ids of the chosen options of a `multiple` select. Controlled. |
| `defaultValues` | `string[]` |  |
| `onValuesChange` | `((ids: string[]) => void)` |  |
| `clearable` | `boolean` | Shows a button that removes the choice. |
| `clearLabel` | `string` | Accessible name of the clear button. |
| `fullWidth` | `boolean` | Fills the width of its slot. Otherwise it is as wide as its value. |
| `onSearchChange` | `((text: string) => void)` | Called with the text typed in the filter field of a `searchable` select, and with `''` when it closes. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there are no options: text, a node, or `{ title, description, icon, action }`. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `placement` | `OverlayPlacement` | Side of the trigger and alignment along it. It flips to the other side to stay in the window. |
| `offset` | `number` | Gap between the trigger and the list, in pixels. |
| `maxHeight` | `number` | Tallest the list may be, in pixels. It is never taller than the room in the window; the options scroll. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `searchable` | `boolean` | Adds a field above the options: typing in it filters them. |
| `searchPlaceholder` | `string` |  |
| `searchLabel` | `string` | Accessible name of the filter field. |
| `filter` | `SelectFilter` | Replaces the built-in filter (label or description contains the text). Pass `() => true` when the server filters. |
| `loadingLabel` | `string` | What a screen reader hears while `loading`. |
| `noResultsLabel` | `string` | Shown when the filter leaves no options. |
| `matchTriggerWidth` | `boolean` | Gives the list the width of the trigger. Otherwise it is at least that wide. |
| `renderOption` | `((option: SelectOption, state: { selected: boolean; }) => ReactNode)` | Replaces the content of an option row. The check mark stays. |
| `valueDescription` | `boolean` | Shows the chosen option's description as a second line; the trigger grows taller. |
| `selectedLabel` | `((count: number) => string)` | The text of a `multiple` select whose labels do not fit. |
| `renderValue` | `((selected: SelectOption[]) => ReactNode)` | Replaces the content shown for the chosen options. |

**Parts**: `trigger`, `value`, `icon`, `popover`, `option`, `check`, `empty`.

**Blocks**: `Select.Root`, `Select.Trigger`, `Select.Value`, `Select.Popover`, `Select.Option`, `Select.Section`.

## SequenceDots

A short ordered row of small marks, one per recent outcome: dots with a shape per tone, or thin bars by value.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-sequence-dots-bar-height` | `1rem`; `0.75rem`; `1.5rem` |
| `--umbra-sequence-dots-bar-width` | `0.3125rem`; `0.25rem`; `0.4375rem` |
| `--umbra-sequence-dots-empty-color` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-sequence-dots-focus-offset` | `calc(-1 * var(--umbra-state-focus-ring-width))` |
| `--umbra-sequence-dots-gap` | `--umbra-space-2` (4px) or `--umbra-space-1` (2px) |
| `--umbra-sequence-dots-size` | `0.625rem`; `0.5rem`; `0.875rem` |
| `--umbra-sequence-dots-target-size` | `1.5rem` |

| Prop | Type | Purpose |
|---|---|---|
| `items` | `readonly SequenceDotsItem[] \| null` | The sequence, oldest first. `null` or nothing means there is no value. |
| `max` | `number` | The most marks shown: the newest ones. Fewer are shown when they do not fit. |
| `range` | `readonly [number, number]` | `bars` only: the values of an empty and of a full bar. Default: 0 to the largest value. |
| `formatSummary` | `((items: readonly SequenceDotsItem[]) => string)` | The text assistive technology reads, from the items (all of them up to `max`, whatever fits). |
| `loading` | `boolean` | Shows a placeholder of the sequence's size. |
| `loadingLabel` | `string` | What assistive technology reads while loading, when there is no `aria-label`. |
| `emptyLabel` | `ReactNode` | Shown when there is no value. |
| `noValueLabel` | `string` | What assistive technology reads when there is no value. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | What assistive technology reads for the whole sequence. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `variant` | `"dots" \| "bars"` | `dots`: one small shape per item. `bars`: one thin bar per item, as tall as its `value`. |
| `size` | `"sm" \| "md" \| "lg"` | `sm` fits a table cell, `md` a list row, `lg` a header. |
| `onAction` | `((id: SequenceDotsId) => void)` | Makes each mark a button: one tab stop, arrow keys between the marks. |

**Parts**: `mark`, `skeleton`, `empty`.

**Blocks**: `SequenceDots.Root`, `SequenceDots.Mark`.

## ShortcutBar

The user's pinned shortcuts, at the end of the `SubNav`. One tab stop; arrow keys move between the chips. Chips that do not fit move into a "+N" menu.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-shortcut-bar-font` | `--umbra-font-label` |
| `--umbra-shortcut-bar-gap` | `--umbra-space-2` (4px) |
| `--umbra-shortcut-bar-item-bg` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-shortcut-bar-item-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-shortcut-bar-item-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-shortcut-bar-item-height` | `22px` |
| `--umbra-shortcut-bar-item-radius` | `--umbra-radius-control` (4px) |

| Prop | Type | Purpose |
|---|---|---|
| `items` | `ShortcutBarItem[]` | The shortcuts, as data. |
| `children` | `ReactNode` | The shortcuts, as `ShortcutBar.Item` blocks. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link for items with `href`. Defaults to a plain `<a>`. |
| `mode` | `"auto" \| "labels" \| "icons"` | `labels`: icon and label. `icons`: icons only, the label is the tooltip. `auto`: labels while they fit, then icons, when every item has one. |
| `moreLabel` | `((count: number) => string)` | The text of the overflow chip, from the number of items in its menu. |
| `moreName` | `((count: number) => string)` | Accessible name of the overflow chip and its menu, from the same number. |
| `onEdit` | `(() => void)` | Shows a button at the end for changing the shortcuts. |
| `editLabel` | `string` |  |
| `aria-label` | `string` | Accessible name of the toolbar. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `item`, `more`, `editIcon`.

**Blocks**: `ShortcutBar.Item`.

## ShortcutsSheet

The help overlay: every shortcut of the provider's registry that has a label, with its keys written for the platform, in groups, with a search. Opened by `?` and by the app. A `Modal`: focus stays inside, Escape closes it and focus returns to where it was.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-shortcuts-sheet-border` | `--umbra-color-base-border-subtle` (#2e2440) |
| `--umbra-shortcuts-sheet-column-gap` | `--umbra-space-7` (24px) |
| `--umbra-shortcuts-sheet-column-width` | `260px` |
| `--umbra-shortcuts-sheet-key-bg` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-shortcuts-sheet-row-height` | `--umbra-density-table-row` (26px at the default density) |
| `--umbra-shortcuts-sheet-section-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-shortcuts-sheet-section-font` | `--umbra-font-label` |

| Prop | Type | Purpose |
|---|---|---|
| `open` | `boolean` | Controlled state. |
| `defaultOpen` | `boolean` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `trigger` | `ReactNode` | A button that opens the sheet. Leave out to open it with the key, or with `open`. |
| `shortcut` | `string \| null` | Id of the shortcut that opens and closes the sheet. `null` binds none. |
| `defaultQuery` | `string` | The search text the sheet opens with: a help button can open it on one topic. |
| `extra` | `ShortcutsSheetSectionData[]` | Sections for keys that are not in the registry, listed after it. |
| `variant` | `"dialog" \| "drawer"` | `dialog`: a panel in the middle of the window. `drawer`: a sheet attached to an edge. |
| `side` | `"start" \| "end" \| "bottom"` | The edge a `drawer` is attached to. |
| `size` | `ModalSize` | Width, as for a `Modal`. |
| `height` | `"auto" \| "fill"` | `fill` keeps the full height while the list is filtered. |
| `title` | `ReactNode` |  |
| `description` | `ReactNode` | A line under the title. |
| `headingLevel` | `4 \| 3 \| 1 \| 2 \| 5` | Heading level of the title; the sections are one level below. |
| `searchLabel` | `string` | Accessible name and placeholder of the search field. |
| `searchPlaceholder` | `string` |  |
| `clearLabel` | `string` |  |
| `closeLabel` | `string` |  |
| `emptyLabel` | `string` | Shown when the search matches nothing. |
| `ungroupedLabel` | `string` | Heading of the app's shortcuts that have no `group`. |
| `reservedLabel` | `string` | Heading of the library's own shortcuts. |
| `orLabel` | `string` | The word between two alternatives of one line. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `header`, `search`, `section`, `item`, `empty`.

**Blocks**: `ShortcutsSheet.Columns`, `ShortcutsSheet.Section`, `ShortcutsSheet.Item`, `ShortcutsSheet.Keys`.

## Skeleton

A grey placeholder in the shape of content that is still loading. Hidden from assistive technology.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-skeleton-bg` | `--umbra-color-base-surface3` (#261b38) |
| `--umbra-skeleton-highlight` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-skeleton-radius` | `--umbra-radius-control` (4px) |

| Prop | Type | Purpose |
|---|---|---|
| `shape` | `"circle" \| "text" \| "block"` | `text` for lines of text, `block` for any rectangle, `circle` for avatars and icons. |
| `lines` | `number` | Number of lines, for `text`. The last line is shorter. |
| `width` | `string \| number` | Defaults to the width of the slot. |
| `height` | `string \| number` | Defaults to the height of the slot (`block`) or of the text (`text`). |
| `animation` | `"none" \| "pulse"` | `none` is forced when reduced motion is on. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: none.

**Blocks**: none.

## Slider

Chooses a number, or a range with two thumbs, by dragging along a track. The `scrubber` variant is a position on a timeline.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-slider-fill` | `--umbra-color-fixed-accent-text` (#f77bf0) |
| `--umbra-slider-hatch` | `color-mix(in oklab, var(--umbra-color-base-surface1) 75%, transparent)` |
| `--umbra-slider-length` | `100%` |
| `--umbra-slider-mark-width` | `4ch` |
| `--umbra-slider-output-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-slider-scrubber-thumb-size` | `14px` |
| `--umbra-slider-scrubber-track-height` | `2px` |
| `--umbra-slider-small-thumb-size` | `12px` |
| `--umbra-slider-small-track-height` | `3px` |
| `--umbra-slider-thumb-bg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-slider-thumb-border` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-slider-thumb-size` | `16px` |
| `--umbra-slider-tick-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-slider-track-bg` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-slider-track-height` | `4px` |
| `--umbra-slider-width` | `200px` |

| Prop | Type | Purpose |
|---|---|---|
| `showValue` | `boolean` | Shows the value as text beside the track. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `invalid` | `boolean` |  |
| `value` | `T` | Controlled value: a number, or `[from, to]` for a range with two thumbs. |
| `onChange` | `((value: T) => void)` | Called while the value changes. |
| `aria-label` | `string` | Accessible name, when no `FormField` names it. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` |  |
| `variant` | `"default" \| "scrubber"` | `scrubber`: a thin track with the value in a box before it, for a position on a timeline. |
| `orientation` | `"vertical" \| "horizontal"` |  |
| `size` | `"default" \| "small"` | `small` is for table cells and dense toolbars. |
| `disabled` | `boolean` |  |
| `min` | `number` |  |
| `max` | `number` |  |
| `thresholds` | `ThresholdList` | Colours the fill by the band the value is in, with the band's pattern and label. One thumb only. |
| `lowerIsBetter` | `boolean` | The scale is one where low is good: the looks of the bands are mirrored. |
| `formatValue` | `((value: number) => string)` | The text of a value: in the output, the bubble and for a screen reader. |
| `readOnly` | `boolean` | Focusable, but cannot be changed. |
| `name` | `string` | Form field name. A range sends two values under it. |
| `defaultValue` | `T` |  |
| `step` | `number` |  |
| `onChangeEnd` | `((value: T) => void)` | Called once when a drag or a key press ends. |
| `marks` | `readonly (number \| SliderMark)[]` | Ticks on the track: values, or values with a label. |
| `bubble` | `boolean` | Shows the value over the thumb while it is hovered, focused or dragged. |
| `startLabel` | `string` | The name of the first thumb of a range. |
| `endLabel` | `string` | The name of the second thumb of a range. |

**Parts**: `track`, `output`, `marks`.

**Blocks**: `Slider.Root`, `Slider.Track`, `Slider.Thumb`, `Slider.Output`, `Slider.Marks`.

## Slot

Gives `size`, `priority`, `minWidth`, `minHeight` and `label` to content that is not an umbra-ui component. The content fills the slot.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-layout-gap` | `--umbra-density-gap` (20px at the default density) |

| Prop | Type | Purpose |
|---|---|---|
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `id` | `string` | The `id` of the root element. |

**Parts**: none.

**Blocks**: none.

## Sparkline

A tiny chart with no axes: the shape of a run of values, for a table cell, a tile or a line of text.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-chart-info` | `--umbra-color-semantic-info` (#3d9be8) |
| `--umbra-chart-negative` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-chart-positive` | `--umbra-color-semantic-success` (#16b877) |
| `--umbra-chart-value` | `--umbra-color-series-1` (#4a94e8) |
| `--umbra-chart-warning` | `--umbra-color-semantic-warning` (#f2b23a) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-sparkline-area-opacity` | `0.22` |
| `--umbra-sparkline-color` | `--umbra-color-series-1` (#4a94e8) |
| `--umbra-sparkline-height` | `20px` |
| `--umbra-sparkline-line-width` | `1.5px` |
| `--umbra-sparkline-marker` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-sparkline-negative` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-sparkline-positive` | `--umbra-color-semantic-success` (#16b877) |
| `--umbra-sparkline-reference` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-sparkline-width` | `4rem` |

| Prop | Type | Purpose |
|---|---|---|
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Replaces the generated summary as the accessible name. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `"default" \| ThresholdTone` | Colour of the marks, by meaning. |
| `variant` | `"line" \| "bars" \| "area" \| "signed"` | `line` and `area` join the values; `bars` draws one bar per value from zero; `signed` draws equal bars above or below the middle by the sign of each value, for a run of outcomes. |
| `loading` | `boolean` | Shows a skeleton in place of the marks. |
| `interactive` | `boolean` | Makes the sparkline a tab stop that shows the nearest value in a tooltip on hover, focus and arrow keys. |
| `emptyLabel` | `ReactNode` | Shown in place of the marks when there is no value. |
| `color` | `string` | Any CSS colour. Wins over `tone`. |
| `thresholds` | `ThresholdList` | Colours each bar, and the last point of a line, by the band of its value: an ascending list of `{ from, tone?, color?, label? }`, or plain numbers as boundaries on the value ramp. The height of a bar already shows its value without colour; the band's `label` joins the value in the tooltip. |
| `lowerIsBetter` | `boolean` | For a scale where low is good: mirrors the colours of the bands. The labels stay. |
| `formatValue` | `((value: number) => string)` | Formats a value for the summary and the tooltip. Defaults to the provider's locale. |
| `noValueLabel` | `string` | What assistive technology hears when there is no value. |
| `labels` | `readonly string[]` | The name of each value (a month, a round), for the tooltip of an `interactive` sparkline. |
| `data` (required) | `readonly (number \| null \| undefined)[]` | The values, in order. `null` is a missing value: a gap in the line, no bar. |
| `curve` | `LineCurve` |  |
| `domain` | `[number, number]` | The range of the scale. Defaults to the lowest and highest value; bars include zero. |
| `reference` | `number \| [number, number]` | A reference line at one value, or a band between two. |
| `lastPoint` | `boolean` | Marks the last value with a dot. |
| `extremes` | `boolean` | Marks the lowest and the highest value with a dot. |
| `maxBarWidth` | `number` | The widest a bar gets, in pixels. Narrower when the values do not fit. |
| `formatSummary` | `((stats: SparklineStats, format: (value: number) => string) => string)` | The text a screen reader hears in place of the drawing. Defaults to an English sentence. |

**Parts**: `reference`, `marks`, `markers`, `skeleton`.

**Blocks**: `Sparkline.Root`, `Sparkline.Reference`, `Sparkline.Marks`, `Sparkline.Markers`.

## SplitButton

A main action with a caret beside it that opens a menu of related actions. One control to look at, two buttons to use: each is a tab stop.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-split-button-caret-width` | `max(24px, calc(var(--height) * 0.8))` |
| `--umbra-split-button-divider` | `color-mix(in oklab, var(--fg) 40%, transparent)` |

| Prop | Type | Purpose |
|---|---|---|
| `items` | `MenuEntry[]` | The related actions: the entries `Menu` takes (rows, sections, separators, submenus). |
| `onAction` | `((id: string) => void)` | Called with the id of the menu row the user chose. |
| `menuLabel` | `string` | The accessible name and tooltip of the caret button. |
| `menuPlacement` | `OverlayPlacement` |  |
| `open` | `boolean` | Controlled state of the menu. |
| `defaultOpen` | `boolean` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Names the pair, when the action's own text is not enough. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `variant` | `ButtonVariant` | The look of both halves: the variants of `Button`. |
| `size` | `"default" \| "small"` | `small` is for use inside table cells. Otherwise the height follows the density level. |
| `disabled` | `boolean` | Disables the action and the menu. |
| `fullWidth` | `boolean` |  |
| `children` | `ReactNode` | The label. |
| `href` | `string` | Renders a link that looks like a button. |
| `loading` | `boolean` | Shows the spinner and blocks presses of the action. The menu stays usable. |
| `onPress` | `(() => void)` |  |
| `type` | `"button" \| "submit" \| "reset"` |  |
| `loadingLabel` | `string` | What a screen reader hears while `loading`. |
| `shortcut` | `string` | Id of a shortcut in the provider's list: binds the key and shows the hint in the tooltip. |
| `iconStart` | `ReactNode` |  |

**Parts**: `action`, `menu`, `iconStart`, `label`, `caret`.

**Blocks**: `SplitButton.Root`, `SplitButton.Action`, `SplitButton.Menu`.

## Spotlight

Dims everything but one element and explains it in a callout beside it: a coach mark, or with `steps` a tour. Nothing but the callout can be used unless the target is `interactive`.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-spotlight-callout-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-spotlight-callout-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-spotlight-callout-padding` | `--umbra-density-card-padding` (16px at the default density) |
| `--umbra-spotlight-callout-radius` | `--umbra-radius-card` (8px) |
| `--umbra-spotlight-callout-width` | `320px` |
| `--umbra-spotlight-dim` | `--umbra-color-base-scrim` (rgba(5, 2, 10, 0.72)) |
| `--umbra-spotlight-duration` | `--umbra-motion-duration-slow` (240ms) |
| `--umbra-spotlight-radius` | `--umbra-radius-card` (8px) |
| `--umbra-spotlight-ring-color` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-spotlight-ring-width` | `calc(2 * var(--umbra-border-width))` |
| `--umbra-spotlight-title-font` | `--umbra-font-card-title` |
| `--umbra-spotlight-z-index` | `--umbra-layer-spotlight` (1250) |

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` |  |
| `children` | `ReactNode` | The text of the callout. |
| `actions` | `ReactNode` | Buttons in place of the built-in ones. |
| `steps` | `SpotlightStep[]` | A tour: one target, title and text per step, with Back, Next and Skip. |
| `step` | `number` | The step shown, from 0. Controlled. |
| `defaultStep` | `number` |  |
| `onStepChange` | `((step: number) => void)` |  |
| `onFinish` | `(() => void)` | Called when the last step, or a spotlight without steps, is ended with its button. |
| `headingLevel` | `4 \| 3 \| 1 \| 2 \| 5 \| 6` | Heading level of the title. |
| `nextLabel` | `string` |  |
| `previousLabel` | `string` |  |
| `skipLabel` | `string` |  |
| `doneLabel` | `string` | The button of the last step, and of a spotlight without steps. |
| `progressLabel` | `((current: number, total: number) => string)` | The text that says where the tour is: "2 of 5". |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `open` | `boolean` | Controlled state. |
| `defaultOpen` | `boolean` |  |
| `interactive` | `boolean` | Whether the target can be used. By default nothing but the callout can: the target is shown, not offered. With `true` the target takes presses and keys, and what it opens is above the dim. |
| `target` | `SpotlightTarget` | The element to light. |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `padding` | `number` | Space between the target and the ring, in pixels. |
| `dismissable` | `boolean` | Escape and a press on the dim close the spotlight. |
| `radius` | `string \| number` | Corner radius of the cut-out: pixels or any CSS length. Defaults to the card radius. |
| `aria-label` | `string` | Accessible name, when there is no title. |
| `placement` | `OverlayPlacement` | Side of the target and alignment along it. It flips to the other side to stay in the window. |
| `offset` | `number` | Gap between the ring and the callout, in pixels. |

**Parts**: `title`, `body`, `progress`, `actions`.

**Blocks**: `Spotlight.Root`, `Spotlight.Callout`, `Spotlight.Title`, `Spotlight.Body`, `Spotlight.Footer`.

## Stack

Shares its height among its children.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-layout-gap` | `--umbra-density-gap` (20px at the default density) |

| Prop | Type | Purpose |
|---|---|---|
| `gap` | `0 \| 4 \| 3 \| 1 \| 2 \| 5 \| 6 \| 7 \| 8 \| 9` | Overrides the gap, which otherwise follows the density level. |
| `overflow` | `"keep" \| "collapse"` | `collapse` shrinks the lowest-priority cards to their headers when they cannot all fit. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `id` | `string` | The `id` of the root element. |

**Parts**: none.

**Blocks**: none.

## StarRating

A rating out of a number of stars. With `readOnly` it is a picture of any value, halves and other fractions included; otherwise a control with the semantics of a radio group.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-star-rating-color` | `--umbra-color-semantic-warning` (#f2b23a) |
| `--umbra-star-rating-empty-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-star-rating-gap` | `2px`; `1px`; `3px` |
| `--umbra-star-rating-large-size` | `24px` |
| `--umbra-star-rating-size` | `18px` |
| `--umbra-star-rating-small-size` | `14px` |

| Prop | Type | Purpose |
|---|---|---|
| `showValue` | `boolean` | Shows the value as a number after the stars. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `invalid` | `boolean` |  |
| `value` | `number \| null` | Controlled value, from 0 to `max`. `null` is no rating. Display mode draws any fraction. |
| `onChange` | `((value: number \| null) => void)` | Called with the chosen value, or `null` when a `clearable` rating is cleared. |
| `aria-label` | `string` | Accessible name, when no `FormField` names it. In display mode the value's text is added. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` |  |
| `icon` | `ReactNode` | Replaces the star, full and empty: any node. The full one is filled with the colour. |
| `loading` | `boolean` | Shows placeholders in the final layout. |
| `size` | `StarRatingSize` | `small` is for table cells, `large` for a header. |
| `disabled` | `boolean` |  |
| `emptyLabel` | `string` | Shown in display mode when there is no value. |
| `max` | `number` | How many stars. |
| `formatValue` | `((value: number, max: number) => string)` | The text of a value: the name of the picture in display mode, and of each choice. |
| `noValueLabel` | `string` | What a screen reader hears in display mode when there is no value. |
| `readOnly` | `boolean` | Display mode: a picture of the value with a text name, not a control. For tables and lists. |
| `required` | `boolean` |  |
| `name` | `string` | Form field name. The value is sent as a number; no rating sends nothing. |
| `defaultValue` | `number \| null` |  |
| `clearable` | `boolean` | Adds "no rating" as a choice: the first stop of the arrow keys, and a press on the chosen star. |
| `clearLabel` | `string` | The name of the "no rating" choice. |
| `step` | `1 \| 0.5` | What a user can choose: whole stars, or halves. |
| `emptyIcon` | `ReactNode` | Replaces the empty star alone. |

**Parts**: `stars`, `star`, `value`.

**Blocks**: `StarRating.Root`, `StarRating.Stars`, `StarRating.Star`, `StarRating.Value`.

## StatusIndicator

A status as a dot or an icon with a label, or as a coloured label.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-status-indicator-color` | `var(--tone)` |
| `--umbra-status-indicator-gap` | `--umbra-space-2` (4px) |
| `--umbra-status-indicator-pulse-duration` | `--umbra-motion-duration-pulse` (1600ms) |
| `--umbra-status-indicator-size` | `0.625em` |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label. Without one, give `aria-label`. |
| `icon` | `ReactNode` | Replaces the icon of the `icon` variant. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Names an indicator that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `pulse` | `boolean` | Draws attention with a slow pulse around the dot. With reduced motion the dot stays still. |
| `variant` | `"icon" \| "dot" \| "label"` | `dot`: a small shape. `icon`: the status icon. `label`: no mark, the label itself is coloured. |
| `status` | `Status` |  |
| `color` | `string` | A custom colour (any CSS colour). Replaces the colour of `status`; the shape stays. |

**Parts**: `indicator`, `label`.

**Blocks**: `StatusIndicator.Root`, `StatusIndicator.Indicator`, `StatusIndicator.Label`.

## StatValue

A large value with its label, and optional unit, trend, caption and meter.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-stat-value-caption-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-stat-value-fg` | `--umbra-color-base-text-primary` (#f5f3f8); `--umbra-color-fixed-accent-text` (#f77bf0); `--umbra-color-semantic-success` (#16b877); `--umbra-color-semantic-warning` (#f2b23a); `--umbra-color-semantic-danger` (#f0455a); `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-stat-value-font` | `--umbra-font-title`; `--umbra-font-display`; `700 40px/1.1 var(--umbra-font-family-body)` |
| `--umbra-stat-value-font-small` | `700 var(--umbra-density-body-size) / 1.375 var(--umbra-font-family-body)`; `--umbra-font-title`; `--umbra-font-display` |
| `--umbra-stat-value-gap` | `--umbra-space-2` (4px) |
| `--umbra-stat-value-label-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-stat-value-unit-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |

| Prop | Type | Purpose |
|---|---|---|
| `value` | `ReactNode` | The value. It never hides. `null`, `undefined` or an empty text shows `emptyLabel`, without unit or trend. |
| `emptyLabel` | `ReactNode` | Shown when there is no value. |
| `label` | `ReactNode` | What the value is. |
| `icon` | `ReactNode` | Shown before the label. |
| `unit` | `ReactNode` | Shown after the value, smaller. |
| `caption` | `ReactNode` | A secondary line under the value. |
| `trend` | `ReactNode` | A node after the value that shows its direction, for example a `TrendArrow`. |
| `meter` | `ReactNode` | A node under the caption that shows the value as a share, for example a `ProgressBar`. |
| `loading` | `boolean` | Shows skeletons in place of the value, caption and meter. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name, for a stat without a label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `StatValueTone` | Colour of the value. A tone that carries meaning needs a second cue: a `trend`, an icon or the label. |
| `align` | `"start" \| "center" \| "end"` |  |
| `size` | `"md" \| "lg" \| "xl"` | Size of the value: `md` is the title font, `lg` the display font, `xl` larger still. |
| `highlightChanges` | `boolean` | A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise. A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value is never counted up or down. |
| `changeValue` | `unknown` | What is compared, when the content is not the value itself (a formatted text). Default: the content, when it is text or a number. |
| `increasedLabel` | `string` | What a screen reader hears with the sign of a value that rose or fell. |
| `decreasedLabel` | `string` |  |

**Parts**: `icon`, `label`, `value`, `unit`, `trend`, `caption`, `meter`, `skeleton`.

**Blocks**: `StatValue.Root`, `StatValue.Label`, `StatValue.Figure`, `StatValue.Value`, `StatValue.Unit`, `StatValue.Trend`, `StatValue.Caption`, `StatValue.Meter`.

## Stepper

Previous and next around one value, with a row of segments for the position. It walks through a list of options (`options`), or through numbers (`min`, `max`, `step`).

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-stepper-button-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-stepper-height` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-stepper-indicator-gap` | `3px` |
| `--umbra-stepper-radius` | `--umbra-radius-control` (4px) |
| `--umbra-stepper-segment-color` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-stepper-segment-current-color` | `--umbra-color-fixed-accent-text` (#f77bf0) |
| `--umbra-stepper-segment-width` | `12px` |
| `--umbra-stepper-value-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-stepper-width` | `200px` |

| Prop | Type | Purpose |
|---|---|---|
| `parts` | `see Parts` | Replace or hide named pieces. |
| `invalid` | `boolean` |  |
| `value` | `T \| null` | Controlled value: an option's `id`, or a number. `null` is no value. |
| `onChange` | `((value: T) => void)` |  |
| `aria-label` | `string` | Accessible name, when no `FormField` names it. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` |  |
| `size` | `"default" \| "small"` | `small` is for table cells and dense toolbars. |
| `disabled` | `boolean` |  |
| `wrap` | `boolean` | After the last comes the first, and the other way. Defaults to on for options and off for numbers. |
| `emptyLabel` | `string` | Shown while there is no value. |
| `min` | `number` | Numeric mode: the lowest value. |
| `max` | `number` | Numeric mode: the highest value. |
| `formatValue` | `((value: number) => string)` | Numeric mode: the text of a value. |
| `readOnly` | `boolean` | Focusable, but cannot be changed. |
| `required` | `boolean` |  |
| `name` | `string` | Form field name: the option's `id` or the number is sent. |
| `defaultValue` | `T \| null` |  |
| `options` | `readonly StepperOption[]` | Options mode: the choices, in order. The value is the `id` of one. Leave it out for numeric mode. |
| `step` | `number` | Numeric mode: the distance between two values. |
| `showIndicator` | `boolean` | The row of segments that shows the position. Defaults to shown for up to 12 positions. |
| `previousLabel` | `string` |  |
| `nextLabel` | `string` |  |

**Parts**: `previous`, `value`, `next`, `indicator`.

**Blocks**: `Stepper.Root`, `Stepper.Previous`, `Stepper.Value`, `Stepper.Next`, `Stepper.Indicator`.

## SubNav

The second bar: the pages of the current section, and room for shortcuts at the end.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-nav-font` | `--umbra-font-nav` |
| `--umbra-nav-gap` | `--umbra-space-7` (24px) |
| `--umbra-nav-indicator-color` | `currentColor` |
| `--umbra-subnav-bg` | `color-mix(in oklab, var(--umbra-color-brand) 35%, #05020a)` |
| `--umbra-subnav-end-gap` | `--umbra-space-2` (4px) |
| `--umbra-subnav-gap` | `--umbra-space-5` (16px) |
| `--umbra-subnav-height` | `--umbra-size-sub-nav-height` (32px) |
| `--umbra-subnav-indicator-color` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-subnav-padding-x` | `--umbra-density-page-margin` (32px at the default density) |

| Prop | Type | Purpose |
|---|---|---|
| `start` | `ReactNode` | A slot before the label, for an `EntitySwitcher`. It stays when the label hides. |
| `label` | `ReactNode` | The section name. |
| `items` | `NavItem[]` | The pages of the section. Same shape as `PrimaryNav`. |
| `end` | `ReactNode` | Free slot at the end, normally a `ShortcutBar`. Its content is never clipped. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `string` | The active item. |
| `onChange` | `((id: string) => void)` | Called with the id of the item the user chose. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link. Defaults to a plain `<a>`. |
| `moreLabel` | `string` | Label of the overflow item. |
| `submenuLabel` | `((label: string) => string)` | Accessible name of the caret that opens an item's dropdown, from the item's label. |
| `aria-label` | `string` | Accessible name of the navigation landmark. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `indicator`, `more`, `start`, `label`, `item`, `end`.

**Blocks**: `SubNav.Root`, `SubNav.Start`, `SubNav.Label`, `SubNav.Item`, `SubNav.Menu`, `SubNav.End`.

## SummaryTile

A compact tile that sums up one thing: an icon, a title and one value. The whole tile can be a link or a button.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-summary-tile-bg` | `--umbra-context-card-tint` |
| `--umbra-summary-tile-border` | `--umbra-color-base-border-subtle` (#2e2440) |
| `--umbra-summary-tile-caption-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-summary-tile-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-summary-tile-icon-bg` | `--umbra-color-base-surface3` (#261b38) or `color-mix(in oklab, var(--fg) 18%, transparent)` |
| `--umbra-summary-tile-icon-size` | `calc(var(--umbra-density-control-height) + var(--umbra-space-3))` |
| `--umbra-summary-tile-min-height` | `--umbra-density-list-row` (72px at the default density) |
| `--umbra-summary-tile-min-width` | `160px` |
| `--umbra-summary-tile-padding` | `--umbra-space-4` (12px) or `--umbra-space-3` (8px) |
| `--umbra-summary-tile-radius` | `--umbra-radius-card` (8px) |
| `--umbra-summary-tile-selected-bg` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-summary-tile-selected-fg` | `--umbra-color-fixed-on-selected` (#ffffff) |

| Prop | Type | Purpose |
|---|---|---|
| `icon` | `ReactNode` | Shown in a block at the start of the tile. |
| `title` | `ReactNode` | What the tile is about. |
| `value` | `ReactNode` | The one value the tile shows. `null`, `undefined` or an empty text shows `emptyLabel`, without the trend. |
| `emptyLabel` | `ReactNode` | Shown when there is no value. |
| `caption` | `ReactNode` | A secondary line under the value. |
| `trend` | `ReactNode` | A node after the value that shows its direction, for example a `TrendArrow`. |
| `loading` | `boolean` | Shows skeletons in place of the value and caption. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name, when the content does not name the tile. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `href` | `string` | Makes the whole tile one link. |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `selected` | `boolean` | Marks the tile as the current one: a link gets `aria-current`, a button `aria-pressed`. |
| `disabled` | `boolean` |  |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `onPress` | `(() => void)` | Makes the whole tile one button. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `highlightChanges` | `boolean` | A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise. A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value is never counted up or down. |
| `changeValue` | `unknown` | What is compared, when the content is not the value itself (a formatted text). Default: the content, when it is text or a number. |
| `increasedLabel` | `string` | What a screen reader hears with the sign of a value that rose or fell. |
| `decreasedLabel` | `string` |  |

**Parts**: `icon`, `title`, `value`, `trend`, `caption`, `skeleton`.

**Blocks**: `SummaryTile.Root`, `SummaryTile.Icon`, `SummaryTile.Content`, `SummaryTile.Title`, `SummaryTile.Figure`, `SummaryTile.Value`, `SummaryTile.Trend`, `SummaryTile.Caption`.

## Tabs

Switches between views of the same content area. The panel fills the rest of the slot.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-tabs-bg` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-tabs-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-tabs-fg` | `--umbra-color-base-text-secondary` (#b3adbf) or `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-tabs-gap` | `--umbra-space-4` (12px) |
| `--umbra-tabs-height` | `--umbra-density-control-height` (36px at the default density) or `calc(var(--umbra-density-table-row) - 2px)` |
| `--umbra-tabs-indicator-color` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-tabs-padding-x` | `--umbra-space-4` (12px) or `--umbra-space-3` (8px) |
| `--umbra-tabs-pill-radius` | `--umbra-radius-pill` (999px) |
| `--umbra-tabs-radius` | `--umbra-radius-control` (4px) |
| `--umbra-tabs-selected-bg` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-tabs-selected-fg` | `--umbra-color-fixed-on-selected` (#ffffff) |
| `--umbra-tabs-underline-selected-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-tabs-vertical-max-width` | `40%` |

| Prop | Type | Purpose |
|---|---|---|
| `items` | `TabsItem[]` | The tabs and their panels. Leave out to compose `Tabs.List`, `Tabs.Tab` and `Tabs.Panel` yourself. |
| `aria-label` | `string` | Accessible name of the tab list. |
| `end` | `ReactNode` | Shown after the tabs, for example an "add" button. |
| `moreLabel` | `string` | Accessible name of the button that opens the menu of tabs that do not fit. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `string \| null` | The selected tab. |
| `defaultValue` | `string \| null` |  |
| `onChange` | `((id: string) => void)` | Called with the id of the tab the user selected. |
| `variant` | `TabsVariant` | `underline`: text with a bar. `pill`: separate rounded buttons. `button-group`: joined buttons. |
| `orientation` | `"vertical" \| "horizontal"` | `vertical` puts the tab list beside the panel. |
| `tabSize` | `"default" \| "small"` | `small` is for dense areas. Otherwise the height follows the density level. |
| `fullWidth` | `boolean` | The tabs share the width of the list. |
| `activation` | `"automatic" \| "manual"` | `automatic`: arrow keys select. `manual`: arrow keys move focus, and Enter or Space selects. |
| `keepMounted` | `boolean` | Keeps the panels that are not selected mounted and hidden, so they keep their state. |
| `onClose` | `((id: string) => void)` | Makes tabs closable: called with the id of the tab whose close button (or Delete key) was used. |
| `closeLabel` | `string` | First word of the close button's name: "Close Orders". |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `id` | `string` | The `id` of the root element. |

**Parts**: `indicator`, `icon`, `count`, `close`, `list`, `tab`, `panel`.

**Blocks**: `Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`.

## Tag

A small label chip: a category, a status code or a value with an icon.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-tag-bg` | `var(--fill)` |
| `--umbra-tag-border` | `var(--line)` |
| `--umbra-tag-fg` | `var(--ink)` |
| `--umbra-tag-focus-color` | `var(--on-tone)` |
| `--umbra-tag-font` | `--umbra-font-label` |
| `--umbra-tag-gap` | `--umbra-space-2` (4px) |
| `--umbra-tag-padding` | `1px calc(var(--umbra-space-2) + var(--umbra-space-1))` or `0 var(--umbra-space-2)` |
| `--umbra-tag-radius` | `--umbra-radius-control` (4px) |
| `--umbra-tag-stripe-width` | `--umbra-space-2` (4px) |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label. Without one (`null`, `undefined` or an empty text) the tag shows `emptyLabel`. |
| `emptyLabel` | `ReactNode` | Shown when there is no label. |
| `icon` | `ReactNode` | A leading icon, avatar or flag. |
| `onRemove` | `(() => void)` | Shows a remove button. |
| `removeLabel` | `string` | Accessible name of the remove button; a text label is added to it ("Remove Region 2"). |
| `loading` | `boolean` | Shows a placeholder of the tag's size. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `Tone` | What the colour means. |
| `variant` | `"subtle" \| "solid" \| "outline"` | `outline`: coloured border. `subtle`: tinted fill. `solid`: filled, for short status codes. |
| `size` | `"default" \| "small"` | `small` is for use inside table cells. |
| `color` | `string` | A custom colour (any CSS colour). Replaces `tone`. |
| `stripe` | `(string & {}) \| Tone` | A second colour on the trailing edge: a tone name or any CSS colour. |
| `stripeLabel` | `string` | What the stripe means: read by screen readers, and shown in a tooltip on hover and on keyboard focus. |

**Parts**: `icon`, `label`, `remove`, `skeleton`.

**Blocks**: `Tag.Root`, `Tag.Icon`, `Tag.Label`, `Tag.Remove`.

## TextField

A box for typing one line of text, or several with `multiline`.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-field-description-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-field-error-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-field-marker-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-icon-size` | `1.25em` |
| `--umbra-option-group-gap` | `--umbra-space-3` (8px) |
| `--umbra-option-group-inline-gap` | `--umbra-space-6` (20px) |
| `--umbra-option-group-min-option-width` | `12em` |
| `--umbra-option-group-text-gap` | `--umbra-space-2` (4px) |
| `--umbra-text-field-affix-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-text-field-bg` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-text-field-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-text-field-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-text-field-height` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-text-field-invalid-border` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-text-field-min-width` | `96px` |
| `--umbra-text-field-padding-x` | `--umbra-space-4` (12px) |
| `--umbra-text-field-placeholder` | `--umbra-color-base-text-muted` (#948da2) |
| `--umbra-text-field-radius` | `--umbra-radius-control` (4px) |
| `--umbra-text-field-width` | `100%` |

| Prop | Type | Purpose |
|---|---|---|
| `prefix` | `ReactNode` | Text or an icon before the text. |
| `suffix` | `ReactNode` | Text, an icon or a small control after the text. |
| `clearable` | `boolean` | Shows a button that empties the field while it holds text. |
| `clearLabel` | `string` | Accessible name of the clear button. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `invalid` | `boolean` | Shows the danger border and an error icon. Put the message in the `error` of a `FormField`. |
| `value` | `string` | Controlled text. |
| `onChange` | `((value: string) => void)` |  |
| `aria-label` | `string` | Accessible name of a field that has no `FormField` label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` |  |
| `size` | `"default" \| "small"` | `small` is for use inside table cells. Otherwise the height follows the density level. |
| `disabled` | `boolean` |  |
| `rows` | `number` | Visible lines of a `multiline` field. |
| `readOnly` | `boolean` | Focusable and selectable, but cannot be changed. |
| `required` | `boolean` |  |
| `name` | `string` | Form field name. |
| `defaultValue` | `string` |  |
| `multiline` | `boolean` | Several lines: a text area of `rows` lines. |
| `type` | `"number" \| "text" \| "password" \| "email" \| "url"` |  |
| `placeholder` | `string` |  |
| `autoComplete` | `string` | The browser's autofill hint, for example `email` or `off`. |
| `maxLength` | `number` |  |

**Parts**: `prefix`, `input`, `invalidIcon`, `clear`, `suffix`.

**Blocks**: `TextField.Root`, `TextField.Prefix`, `TextField.Input`, `TextField.InvalidIcon`, `TextField.Clear`, `TextField.Suffix`.

## Toggle

A switch for a setting that takes effect at once: on or off.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-field-description-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-field-error-color` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-field-marker-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-option-group-gap` | `--umbra-space-3` (8px) |
| `--umbra-option-group-inline-gap` | `--umbra-space-6` (20px) |
| `--umbra-option-group-min-option-width` | `12em` |
| `--umbra-option-group-text-gap` | `--umbra-space-2` (4px) |
| `--umbra-toggle-bg` | `--umbra-color-base-surface1` (#0b0612) |
| `--umbra-toggle-border` | `--umbra-color-base-border-control` (#7a6e91) |
| `--umbra-toggle-gap` | `--umbra-space-3` (8px) |
| `--umbra-toggle-height` | `calc(var(--umbra-density-control-height) / 2 + 4px)` |
| `--umbra-toggle-mark-color` | `var(--umbra-toggle-selected-bg, var(--umbra-color-fixed-selected))` |
| `--umbra-toggle-radius` | `--umbra-radius-pill` (999px) |
| `--umbra-toggle-selected-bg` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-toggle-selected-thumb-bg` | `--umbra-color-fixed-on-selected` (#ffffff) |
| `--umbra-toggle-small-height` | `calc(var(--umbra-density-table-row) / 2 + 5px)` |
| `--umbra-toggle-thumb-bg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-toggle-thumb-inset` | `2px` |
| `--umbra-toggle-width` | `calc(var(--height) * 1.8)` |

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label. |
| `description` | `ReactNode` | A second line under the label. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `string` | The form value when on. |
| `onChange` | `((checked: boolean) => void)` |  |
| `aria-label` | `string` | Accessible name of a toggle that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` |  |
| `size` | `"default" \| "small"` | `small` is for use inside table cells and dense toolbars. Otherwise the size follows the density level. |
| `disabled` | `boolean` |  |
| `checked` | `boolean` | Controlled state. |
| `defaultChecked` | `boolean` |  |
| `readOnly` | `boolean` | Focusable, but cannot be changed. |
| `name` | `string` | Form field name. |
| `labelPosition` | `"start" \| "end"` | The side of the switch the label is on. |

**Parts**: `track`, `label`, `description`.

**Blocks**: `Toggle.Root`, `Toggle.Track`, `Toggle.Label`, `Toggle.Description`.

## Tooltip

A short description of a control, shown on hover and on keyboard focus. Text only: it never holds anything the user could interact with.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-tooltip-bg` | `--umbra-color-base-surface2` (#1b1329) |
| `--umbra-tooltip-border` | `--umbra-color-base-border-strong` (#47395e) |
| `--umbra-tooltip-fg` | `--umbra-color-base-text-primary` (#f5f3f8) |
| `--umbra-tooltip-max-width` | `320px` |
| `--umbra-tooltip-radius` | `--umbra-radius-control` (4px) |

| Prop | Type | Purpose |
|---|---|---|
| `children` (required) | `ReactNode` | The control the tooltip describes: any umbra-ui control, or a plain focusable element. |
| `content` | `ReactNode` | The text. Nothing is shown when it is empty (and there is no `title` or `shortcut`). |
| `title` | `ReactNode` | A heading above the text, for a rich tooltip. |
| `shortcut` | `string` | Id of a shortcut in the provider's list: its keys are shown as a hint. |
| `placement` | `OverlayPlacement` |  |
| `delay` | `number` | Milliseconds before it shows on hover. Keyboard focus shows it at once. |
| `closeDelay` | `number` | Milliseconds it stays after the pointer has left the control: time to move the pointer onto the tooltip, which stays while the pointer is over it. |
| `offset` | `number` | Gap between the control and the tooltip, in pixels. |
| `open` | `boolean` | Controlled state. |
| `defaultOpen` | `boolean` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `disabled` | `boolean` | Never shows. |
| `wrap` | `boolean` | Puts the control in a focusable wrapper that carries the tooltip, so it also shows for a control that takes no pointer or focus events. Defaults to the control's own `disabled` prop. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` | On the tooltip itself. |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `title`, `body`, `hint`.

**Blocks**: none.

## TopBar

The brand-coloured bar at the top: where the user is, the main sections, and the one primary action.

**Tokens**: each with its default. It also reads the tokens of [`SubNav`](#subnav).

| Token | Default |
|---|---|
| `--umbra-focus-color` | `--umbra-color-fixed-focus-ring` (#ffb3f5) |
| `--umbra-focus-offset` | `2px` |
| `--umbra-nav-font` | `--umbra-font-nav` |
| `--umbra-nav-gap` | `--umbra-space-7` (24px) |
| `--umbra-nav-indicator-color` | `currentColor` |
| `--umbra-topbar-action-gap` | `--umbra-space-2` (4px) |
| `--umbra-topbar-action-size` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-topbar-bg` | `--umbra-color-brand` (#2a2f8f) |
| `--umbra-topbar-fg` | `var(--umbra-color-on-brand, #fff)` |
| `--umbra-topbar-gap` | `--umbra-space-6` (20px) |
| `--umbra-topbar-height` | `--umbra-size-top-bar-height` (60px) |
| `--umbra-topbar-logo-size` | `40px` |
| `--umbra-topbar-padding-x` | `--umbra-space-4` (12px) |

| Prop | Type | Purpose |
|---|---|---|
| `logo` | `ReactNode` | App or entity mark. |
| `nav` | `ReactNode` | A `PrimaryNav`. |
| `actions` | `ReactNode` | `IconButton`s. They collapse into one menu when space is short. |
| `context` | `ReactNode` | A `ContextBlock`. The first thing to give way when space is short. |
| `primaryAction` | `ReactNode` | The one primary action of the app: a `PrimaryAction`. Any other node is shown as it is. |
| `history` | `ReactNode` | `true` shows `HistoryButtons` that use the browser history; a node replaces them. |
| `commandPalette` | `ReactNode` | A `CommandPalette`. Shows the search trigger, which opens it (also by the `Mod+K` shortcut). |
| `onSearch` | `(() => void)` | For an app with its own search: shows the search trigger and is called when it is used (also by `Mod+K`). |
| `searchLabel` | `string` | Accessible names of the built-in buttons. |
| `backLabel` | `string` |  |
| `forwardLabel` | `string` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `brand` | `string` | Overrides the brand colour for this bar only. Text on it is computed for contrast. |
| `moreLabel` | `string` | Accessible name of the menu that holds the actions when they do not fit. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: `start`, `logo`, `nav`, `actions`, `search`, `context`, `primaryAction`.

**Blocks**: `TopBar.Root`, `TopBar.Start`, `TopBar.Logo`, `TopBar.Nav`, `TopBar.End`, `TopBar.Actions`, `TopBar.Search`, `TopBar.Context`, `TopBar.PrimaryAction`.

## TrendArrow

The direction of a change: up, down or flat.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-trend-arrow-bad` | `--umbra-color-semantic-danger` (#f0455a) |
| `--umbra-trend-arrow-gap` | `--umbra-space-1` (2px) |
| `--umbra-trend-arrow-good` | `--umbra-color-semantic-success` (#16b877) |
| `--umbra-trend-arrow-neutral` | `--umbra-color-base-text-muted` (#948da2) |

| Prop | Type | Purpose |
|---|---|---|
| `positive` | `"up" \| "down"` | Which direction is good: it gets the success colour, the other the danger colour. `flat` is neutral. |
| `value` | `ReactNode` | Text after the arrow, for example the size of the change. |
| `icon` | `ReactNode` | Replaces the arrow. Keep a different shape per direction: the shape is the cue that is not colour. |
| `label` | `string` | What a screen reader hears for the direction. Defaults to the label of the direction below. |
| `upLabel` | `string` |  |
| `downLabel` | `string` |  |
| `flatLabel` | `string` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `tone` | `TrendTone` | The colour of the arrow. |
| `direction` (required) | `TrendDirection` |  |

**Parts**: `icon`, `value`.

**Blocks**: `TrendArrow.Root`, `TrendArrow.Icon`, `TrendArrow.Value`.

## UmbraProvider

Wraps the app once. Supplies the theme, density, icon map and shortcut registry to every component.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-icon-size` | `1.25em` |

| Prop | Type | Purpose |
|---|---|---|
| `icons` | `Partial<IconMap>` | Overrides built-in icons by name. |
| `shortcuts` | `Shortcut[]` | The app's key bindings. |
| `reducedMotion` | `"system" \| "always" \| "never"` | `system` follows the operating system setting. |
| `locale` | `string` | Locale for number and date formatting and text direction. Defaults to the browser's. |
| `brand` | `string` | Brand colour, used by the TopBar. Text on it is computed for contrast. Hex or `rgb()`. |
| `context` | `ContextTint` | Context tint for the page background and tinted cards. |
| `density` | `"compact" \| "default" \| "spacious"` | Spacing, row heights and text sizes. |
| `tokens` | `Partial<Record<(string & {}) \| TokenName, string \| number \| undefined>>` | Overrides individual tokens for this subtree. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: none.

**Blocks**: none.

## UmbraScope

The same `context`, `density`, `brand` and `tokens` as the provider, for one subtree.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-icon-size` | `1.25em` |

| Prop | Type | Purpose |
|---|---|---|
| `brand` | `string` | Brand colour, used by the TopBar. Text on it is computed for contrast. Hex or `rgb()`. |
| `context` | `ContextTint` | Context tint for the page background and tinted cards. |
| `density` | `"compact" \| "default" \| "spacious"` | Spacing, row heights and text sizes. |
| `tokens` | `Partial<Record<(string & {}) \| TokenName, string \| number \| undefined>>` | Overrides individual tokens for this subtree. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `id` | `string` | The `id` of the root element. |

**Parts**: none.

**Blocks**: none.

## ValuePill

A value coloured by where it falls on a five-step ramp.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-value-pill-bg` | `var(--fill)` |
| `--umbra-value-pill-fg` | `var(--ink)` |
| `--umbra-value-pill-font` | `--umbra-font-label` or `--umbra-font-body` |
| `--umbra-value-pill-min-width` | `3em`; `2.6em`; `2.2em` |
| `--umbra-value-pill-padding` | `1px var(--umbra-space-3)`; `0 var(--umbra-space-2)`; `var(--umbra-space-1) var(--umbra-space-4)` |
| `--umbra-value-pill-radius` | `--umbra-radius-pill` (999px) or `--umbra-radius-control` (4px) |

| Prop | Type | Purpose |
|---|---|---|
| `value` (required) | `number \| null` | The value. `null` or `undefined` shows `emptyLabel` in a neutral pill. |
| `thresholds` | `ThresholdList` | Colours the pill by the band of the value, in place of `min` and `max`. Plain numbers are boundaries spread on the value ramp (four give the five steps); a list of `{ from, tone?, color?, label? }` sets each band's colour, and its `label` is read with the value. A value below the first band is neutral. |
| `formatValue` | `((value: number) => ReactNode)` | Turns the value into what is shown: `(v) => v.toFixed(2)`, or a grade letter. |
| `showLevel` | `boolean` | Adds a small bar marker of the level, for readers who cannot tell the colours apart. |
| `levelLabel` | `((level: number, steps: number) => string)` | What a screen reader hears for the marker. |
| `emptyLabel` | `ReactNode` | Shown when there is no value. |
| `loading` | `boolean` | Shows a placeholder of the pill's size. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `size` | `"default" \| "small" \| "large"` | `small` is for use inside table cells. |
| `shape` | `"square" \| "circle" \| "pill"` | `square` for values in dense rows, `circle` for grades of one or two characters. |
| `min` | `number` | The bottom and top of the scale, split into five equal bands. |
| `max` | `number` |  |
| `lowerIsBetter` | `boolean` | For a scale where low is good: the low end gets the top of the ramp. |
| `highlightChanges` | `boolean` | A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise. A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value is never counted up or down. |
| `increasedLabel` | `string` | What a screen reader hears with the sign of a value that rose or fell. |
| `decreasedLabel` | `string` |  |

**Parts**: `value`, `level`, `skeleton`.

**Blocks**: `ValuePill.Root`, `ValuePill.Value`, `ValuePill.Level`.

## VerticalNav

Side navigation for a modal, a settings screen or one column of a page.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-icon-size` | `1.25em` |
| `--umbra-vertical-nav-bg` | `transparent` |
| `--umbra-vertical-nav-current-bg` | `--umbra-color-fixed-selected` (#6a1fd6) |
| `--umbra-vertical-nav-current-fg` | `--umbra-color-fixed-on-selected` (#ffffff) |
| `--umbra-vertical-nav-fg` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-vertical-nav-gap` | `--umbra-space-1` (2px) |
| `--umbra-vertical-nav-padding` | `--umbra-space-3` (8px) |
| `--umbra-vertical-nav-radius` | `--umbra-radius-control` (4px) |
| `--umbra-vertical-nav-rail-below` | `160px` |
| `--umbra-vertical-nav-rail-width` | `calc(var(--row) + 2 * var(--pad))` |
| `--umbra-vertical-nav-row-height` | `--umbra-density-control-height` (36px at the default density) |
| `--umbra-vertical-nav-stripe-width` | `3px` |
| `--umbra-vertical-nav-width` | `240px` |

| Prop | Type | Purpose |
|---|---|---|
| `items` | `(VerticalNavItem \| VerticalNavSection)[]` | The entries: items, groups (an item with `items`) and sections (`{ type: 'section', label, items }`). |
| `header` | `ReactNode` | Fixed above the list, for example a title or a search field. |
| `footer` | `ReactNode` | Fixed below the list. |
| `collapsible` | `boolean` | Shows the button that lets the user switch to the icon rail and back. |
| `parts` | `see Parts` | Replace or hide named pieces. `item` applies to every item, also inside groups and sections. |
| `value` | `string` | The current item. |
| `onChange` | `((id: string) => void)` | Called with the id of the item the user chose. |
| `renderLink` | `((props: LinkRenderProps) => ReactNode)` | Plugs in the app's router link. Defaults to a plain `<a>`. |
| `aria-label` | `string` | Accessible name of the navigation landmark. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `collapsed` | `boolean` | Icon-only rail (controlled). Each label stays as the accessible name of its item. |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `expandedIds` | `string[]` | The open groups (controlled). |
| `defaultExpandedIds` | `string[]` |  |
| `onExpandedChange` | `((ids: string[]) => void)` |  |
| `defaultCollapsed` | `boolean` |  |
| `onCollapsedChange` | `((collapsed: boolean) => void)` |  |
| `collapseLabel` | `string` | Accessible names of the button, by what a press does. |
| `expandLabel` | `string` |  |

**Parts**: `header`, `item`, `footer`, `toggle`.

**Blocks**: `VerticalNav.Root`, `VerticalNav.Header`, `VerticalNav.List`, `VerticalNav.Section`, `VerticalNav.Group`, `VerticalNav.Item`, `VerticalNav.Footer`, `VerticalNav.Toggle`.

## WeekStrip

Seven days side by side, each with its slots: a week at a glance, small enough for a card.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-week-strip-gap` | `--umbra-space-2` (4px) |
| `--umbra-week-strip-hidden-items-color` | `--umbra-color-base-text-secondary` (#b3adbf) |
| `--umbra-week-strip-today-bg` | `color-mix(in oklab, var(--umbra-color-fixed-primary) 14%, transparent)` |

| Prop | Type | Purpose |
|---|---|---|
| `items` | `readonly ScheduleItem[]` | The entries. Those outside the seven days are left out. |
| `startDate` | `string` | The first of the seven days, as `'2026-10-05'`. Wins over `date`. |
| `date` | `string` | A day of the week to show: the strip starts on the first day of its week. Defaults to `today`. |
| `today` | `string` | The current day. Defaults to the day it is where the user is. |
| `weekStartsOn` | `WeekStart` | The first day of the week, 0 (Sunday) to 6, where the provider's locale should not decide. |
| `slotsPerDay` | `number` | The number of slots of each day. Defaults to the most any of the days has, and at least one. |
| `dayHeader` | `"both" \| "date" \| "weekday"` | What heads each day: the weekday and the number, or one of them. |
| `weekdayFormat` | `"auto" \| WeekdayFormat` | `auto`: the long name where it fits, then the short and the narrow one as the strip narrows. |
| `slotSize` | `"default" \| "small"` |  |
| `slotDisplay` | `"icon" \| "auto" \| "full"` | `auto` hides the labels of the slots, leaving their icons, when a day is too narrow for them. |
| `selectedDate` | `string \| null` | The chosen day. Controlled; `null` is none. |
| `defaultSelectedDate` | `string \| null` |  |
| `onSelectedDateChange` | `((date: IsoDate) => void)` |  |
| `onAction` | `((id: string) => void)` | Called with the id of an item when it is activated: a click, Enter or Space. |
| `onDayAction` | `((date: IsoDate) => void)` | Called with the day when its header or one of its free slots is activated. |
| `freeLabel` | `string` | What assistive technology reads for a free slot. |
| `hiddenItemsLabel` | `((count: number) => string)` | Names the mark of a day with more items than `slotsPerDay`: "+2" beside its date, read as "2 more" and the items. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |
| `aria-label` | `string` | Accessible name of the grid. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `aria-labelledby` | `string` |  |

**Parts**: `day`, `slot`, `placeholder`, `skeleton`, `state`.

**Blocks**: `WeekStrip.Root`, `WeekStrip.Row`, `WeekStrip.Cell`.

## WidgetBoard

A packed board of collapsible cards of different heights. It scrolls inside itself.

**Tokens**: each with its default.

| Token | Default |
|---|---|
| `--umbra-layout-gap` | `--umbra-density-gap` (20px at the default density) |
| `--umbra-widget-board-gap` | `--umbra-density-gap` (20px at the default density) |
| `--umbra-widget-board-min-column-width` | `280px` |
| `--umbra-widget-board-toolbar-gap` | `--umbra-space-3` (8px) |

| Prop | Type | Purpose |
|---|---|---|
| `skeletonItems` | `number` | Number of placeholder cards shown while `loading`. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `children` | `ReactNode` | `WidgetBoard.Widget` and `WidgetBoard.Item` elements. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `id` | `string` | The `id` of the root element. |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | The width the child needs. When the children of a `Columns` cannot all have theirs, the `Columns` shows one child at a time, with tabs, as it does below the minimum window. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `onCollapsedChange` | `((ids: WidgetBoardId[]) => void)` |  |
| `height` | `FillHeight` | `fill` (default) takes the slot and scrolls inside; `content` is as tall as the widgets; or pixels. |
| `collapsedIds` | `string[]` | Controlled: the ids of the collapsed widgets. |
| `defaultCollapsedIds` | `string[]` |  |
| `aria-label` | `string` | Accessible name of the list of widgets. |
| `columns` | `number` | A fixed number of columns. Wins over `minColumnWidth`. |
| `minColumnWidth` | `number` | The board has as many columns as fit at this width or more, in pixels. |
| `collapseAllLabel` | `string` |  |
| `expandAllLabel` | `string` |  |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `empty` | `ReactNode \| DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |

**Parts**: `toolbar`, `collapseAll`, `skeleton`.

**Blocks**: `WidgetBoard.Root`, `WidgetBoard.Toolbar`, `WidgetBoard.CollapseAll`, `WidgetBoard.Grid`, `WidgetBoard.Item`, `WidgetBoard.Widget`.
