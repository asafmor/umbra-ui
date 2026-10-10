# Customisation tables

Generated from the source by `npm run docs:tables`. Do not edit.

Every component is customised through the same four layers: tokens, props, parts and blocks.
A token is a CSS variable: set it in CSS on any ancestor, or through the `tokens` prop of
`UmbraProvider` or `UmbraScope` (without the `--umbra-` prefix). Every component also accepts
`className` and `style` on its root.

## AppShell

The outermost frame: exactly the size of the window, never scrolls, bars above one `Page`.

**Tokens**: `--umbra-shell-bg`, `--umbra-shell-bg-end`, `--umbra-shell-pattern-opacity`.

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

**Parts**: `topBar`, `subNav`, `main`, `background`.

**Blocks**: `AppShell.Root`, `AppShell.Background`, `AppShell.Bars`, `AppShell.Main`.

## Avatar

A person or entity: its image, or its initials, or a silhouette.

**Tokens**: `--umbra-avatar-bg`, `--umbra-avatar-fallback-fg`, `--umbra-avatar-fg`, `--umbra-avatar-group-border`, `--umbra-avatar-group-overlap`, `--umbra-avatar-radius`, `--umbra-avatar-ring`, `--umbra-avatar-size`, `--umbra-avatar-status-size`.

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
| `size` | `AvatarSize` | Fixed size. Without it the avatar is as tall as a control, so it follows the density level. |
| `shape` | `AvatarShape` |  |
| `ring` | `string \| boolean` | A ring around the avatar: `true` for the accent colour, or any CSS colour. |

**Parts**: `image`, `initials`, `fallback`, `status`.

**Blocks**: `Avatar.Root`, `Avatar.Image`, `Avatar.Initials`, `Avatar.Fallback`, `Avatar.Status`.

## AvatarGroup

A row of overlapping avatars. Those that do not fit are counted in a "+N" at the end.

**Tokens**: `--umbra-avatar-bg`, `--umbra-avatar-fallback-fg`, `--umbra-avatar-fg`, `--umbra-avatar-group-border`, `--umbra-avatar-group-overlap`, `--umbra-avatar-radius`, `--umbra-avatar-ring`, `--umbra-avatar-size`, `--umbra-avatar-status-size`.

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
| `size` | `AvatarSize` | Size and shape of every avatar in the group. |
| `shape` | `AvatarShape` |  |

**Parts**: `overflow`.

**Blocks**: `AvatarGroup.Root`, `AvatarGroup.Overflow`.

## Banner

A message band inside a card or page: a notice, a warning, or an insight about the data beside it.

**Tokens**: `--umbra-banner-accent-color`, `--umbra-banner-bg`, `--umbra-banner-border`, `--umbra-banner-danger-color`, `--umbra-banner-fg`, `--umbra-banner-icon-color`, `--umbra-banner-info-color`, `--umbra-banner-neutral-color`, `--umbra-banner-padding-x`, `--umbra-banner-padding-y`, `--umbra-banner-radius`, `--umbra-banner-row-height`, `--umbra-banner-solid-fg`, `--umbra-banner-stripe-width`, `--umbra-banner-subtle-strength`, `--umbra-banner-success-color`, `--umbra-banner-warning-color`, `--umbra-icon-size`.

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
| `tone` | `BannerTone` | What the message is. Each tone has its own colour and its own default icon. |
| `variant` | `BannerVariant` | `subtle`: tinted fill. `solid`: filled with the tone colour. `outline`: border only. |
| `emphasis` | `"default" \| "insight"` | `insight` adds a stripe on the leading edge, for a finding or recommendation about the data beside it. |
| `live` | `"polite" \| "assertive" \| "off"` | How a screen reader announces the banner when it appears. `polite` is a `status`, `assertive` an `alert`, `off` is not announced. Defaults to `assertive` for the `danger` tone and `polite` otherwise. |
| `open` | `boolean` | Controlled visibility. Set it to `false` in `onDismiss`. |
| `defaultOpen` | `boolean` |  |
| `onDismiss` | `(() => void)` | Called when the dismiss button is pressed. |

**Parts**: `icon`, `title`, `description`, `actions`, `dismiss`.

**Blocks**: `Banner.Root`, `Banner.Icon`, `Banner.Content`, `Banner.Title`, `Banner.Description`, `Banner.Actions`, `Banner.Dismiss`.

## Button

Triggers an action. Text, with an optional icon.

**Tokens**: `--umbra-button-accent-bg`, `--umbra-button-accent-border`, `--umbra-button-accent-fg`, `--umbra-button-danger-bg`, `--umbra-button-danger-border`, `--umbra-button-danger-fg`, `--umbra-button-ghost-bg`, `--umbra-button-ghost-border`, `--umbra-button-ghost-fg`, `--umbra-button-height`, `--umbra-button-neutral-bg`, `--umbra-button-neutral-border`, `--umbra-button-neutral-fg`, `--umbra-button-padding-x`, `--umbra-button-primary-bg`, `--umbra-button-primary-border`, `--umbra-button-primary-fg`, `--umbra-button-radius`, `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-icon-button-size`.

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
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |

**Parts**: `iconStart`, `label`, `iconEnd`, `spinner`.

**Blocks**: none.

## Card

The container for one unit of content on a page. Fills the slot its parent gives it and scrolls its own body when the content is taller.

**Tokens**: `--umbra-card-bg`, `--umbra-card-border`, `--umbra-card-header-bg`, `--umbra-card-header-fg`, `--umbra-card-header-height`, `--umbra-card-min-height`, `--umbra-card-padding`, `--umbra-card-radius`, `--umbra-card-title-font`, `--umbra-focus-color`.

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` | Header title. The header is shown when it is set. |
| `loading` | `boolean` | Shows the body skeleton. |
| `empty` | `ReactNode` | Shown in place of the body when set (and not loading or in error). |
| `error` | `ReactNode` | Shown in place of the body when set. Put a retry action inside it. |
| `parts` | `see Parts` | Replace or hide named pieces. `toolbar` and `footer` are empty unless given, as `Card.Toolbar` and `Card.Footer`. |
| `tone` | `"default" \| "tinted" \| "neutral"` | `tinted` takes more of the context tint; `neutral` ignores it. |
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
| `minWidth` | `number` | Reserved: `Columns` has no rule that uses it yet, so it has no effect. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `moreLabel` | `string` | Accessible name of the overflow menu button. |
| `icon` | `ReactNode` | Leading icon or image. |
| `subtitle` | `ReactNode` | Second line, in the body font. |
| `actions` | `ReactNode` | Trailing controls. They move into an overflow menu when they do not fit. |
| `href` | `string` | Makes the title a link. |
| `onOpen` | `(() => void)` |  |

**Parts**: `header`, `title`, `actions`, `toolbar`, `body`, `footer`, `skeleton`.

**Blocks**: `Card.Root`, `Card.Header`, `Card.Title`, `Card.Actions`, `Card.Toolbar`, `Card.Body`, `Card.Footer`.

## Columns

Shares its width among its children. Below the minimum window it shows one child at a time.

**Tokens**: `--umbra-layout-gap`.

| Prop | Type | Purpose |
|---|---|---|
| `gap` | `0 \| 4 \| 3 \| 1 \| 2 \| 5 \| 6 \| 7 \| 8 \| 9` | Overrides the gap, which otherwise follows the density level. |
| `narrow` | `"tabs" \| "keep"` | Below the minimum window: `tabs` shows one child at a time, `keep` keeps the columns. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `tabsLabel` | `string` | Accessible name of the tab strip. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | Reserved: `Columns` has no rule that uses it yet, so it has no effect. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |

**Parts**: `tabs`.

**Blocks**: none.

## EmptyState

Says that a region has nothing to show, or failed to load, and what to do about it.

**Tokens**: `--umbra-empty-state-color`, `--umbra-empty-state-error-color`, `--umbra-empty-state-gap`, `--umbra-empty-state-icon-color`, `--umbra-empty-state-icon-size`, `--umbra-empty-state-max-width`, `--umbra-empty-state-padding`, `--umbra-empty-state-title-color`, `--umbra-empty-state-title-font`.

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` | The short statement: "No orders". |
| `description` | `ReactNode` | One or two sentences that explain the state or say what to do. |
| `icon` | `ReactNode` | Decorative icon. Hides first when space is short. |
| `action` | `ReactNode` | A control that resolves the state, for example a `Button`. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `tone` | `"neutral" \| "error"` | `error` marks a failure: danger-coloured icon and title. |
| `variant` | `"block" \| "inline"` | `block` is centred in its slot; `inline` is one line of text. |
| `role` | `"alert" \| "status"` | `alert` announces the content when it appears (for an error); `status` announces it politely. |

**Parts**: `icon`, `title`, `description`, `action`.

**Blocks**: `EmptyState.Root`, `EmptyState.Icon`, `EmptyState.Title`, `EmptyState.Description`, `EmptyState.Action`.

## EntityIcon

A small mark for an entity (a logo, a flag, a category glyph), with an optional name next to it.

**Tokens**: `--umbra-entity-icon-bg`, `--umbra-entity-icon-fg`, `--umbra-entity-icon-gap`, `--umbra-entity-icon-radius`, `--umbra-entity-icon-size`.

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
| `size` | `EntityIconSize` | Fixed size of the mark. Without it the mark follows the size of the text around it. |
| `shape` | `EntityIconShape` |  |

**Parts**: `mark`, `label`.

**Blocks**: `EntityIcon.Root`, `EntityIcon.Mark`, `EntityIcon.Label`.

## GroupHeader

A header row for one group of rows inside a list or table.

**Tokens**: `--umbra-group-header-bg`, `--umbra-group-header-color`, `--umbra-group-header-font`, `--umbra-group-header-height`, `--umbra-group-header-padding-x`.

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` | The group's name. |
| `icon` | `ReactNode` | Leading icon. |
| `count` | `number` | Number of rows in the group, shown after the title. |
| `meta` | `ReactNode` | Trailing text, for example a total. Hides when the header is too narrow. |
| `actions` | `ReactNode` | Trailing controls. |
| `level` | `4 \| 3 \| 2 \| 5 \| 6` | Heading level of the title. |
| `collapsible` | `boolean` | Adds a caret button that collapses the group. The app (or `List`) hides the rows. |
| `collapsed` | `boolean` | Controlled collapse state. |
| `defaultCollapsed` | `boolean` |  |
| `onCollapsedChange` | `((collapsed: boolean) => void)` |  |
| `collapseLabel` | `string` | Accessible names of the caret. With a text `title`, the title is added: "Collapse Today". |
| `expandLabel` | `string` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `variant` | `"plain" \| "strip"` | `strip` is a full-width band (a date above its messages); `plain` has no fill (a label above a few rows). |
| `sticky` | `boolean` | Sticks to the top of the scroll area while its group scrolls. The header and its rows must share a parent element. |

**Parts**: `toggle`, `icon`, `title`, `count`, `meta`, `actions`.

**Blocks**: `GroupHeader.Root`, `GroupHeader.Toggle`, `GroupHeader.Title`, `GroupHeader.Count`, `GroupHeader.Meta`, `GroupHeader.Actions`.

## IconButton

A button that shows only an icon. Inside an overflow menu it becomes a row with its icon and label.

**Tokens**: `--umbra-button-accent-bg`, `--umbra-button-accent-border`, `--umbra-button-accent-fg`, `--umbra-button-danger-bg`, `--umbra-button-danger-border`, `--umbra-button-danger-fg`, `--umbra-button-ghost-bg`, `--umbra-button-ghost-border`, `--umbra-button-ghost-fg`, `--umbra-button-height`, `--umbra-button-neutral-bg`, `--umbra-button-neutral-border`, `--umbra-button-neutral-fg`, `--umbra-button-padding-x`, `--umbra-button-primary-bg`, `--umbra-button-primary-border`, `--umbra-button-primary-fg`, `--umbra-button-radius`, `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-icon-button-size`.

| Prop | Type | Purpose |
|---|---|---|
| `icon` (required) | `ReactNode` |  |
| `label` (required) | `string` | Required. The accessible name and the tooltip text. |
| `variant` | `ButtonVariant` |  |
| `shape` | `"square" \| "circle"` |  |
| `pressed` | `boolean` | Makes it a toggle (for example a star). |
| `onPressedChange` | `((pressed: boolean) => void)` |  |
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

**Parts**: `icon`, `badge`, `tooltip`.

**Blocks**: none.

## KeyValue

One label with its value. Use it inside a `KeyValueList`, or on its own.

**Tokens**: `--umbra-key-value-divider`, `--umbra-key-value-gap`, `--umbra-key-value-hint-fg`, `--umbra-key-value-label-fg`, `--umbra-key-value-label-width`, `--umbra-key-value-min-column`, `--umbra-key-value-padding-x`, `--umbra-key-value-row-height`, `--umbra-key-value-stripe`, `--umbra-key-value-value-fg`, `--umbra-key-value-value-font`.

| Prop | Type | Purpose |
|---|---|---|
| `label` | `ReactNode` | What the value is. |
| `value` | `ReactNode` | The value. `children` is used when it is not set. |
| `children` | `ReactNode` |  |
| `icon` | `ReactNode` | Shown before the label. |
| `hint` | `ReactNode` | A secondary line: under the label when inline, under the value when stacked. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `orientation` | `Orientation` | `inline`: label and value side by side. `stacked`: the label above the value. |
| `align` | `Align` | Where the value sits. Default: `end` when inline, `start` when stacked. |
| `wrap` | `boolean` | Lets a long value wrap onto more lines. Without it the value is cut with an ellipsis. |

**Parts**: `icon`, `label`, `value`, `hint`.

**Blocks**: `KeyValue.Root`, `KeyValue.Label`, `KeyValue.Value`, `KeyValue.Hint`.

## KeyValueList

A group of labels with their values, in rows, columns or a grid.

**Tokens**: `--umbra-key-value-divider`, `--umbra-key-value-gap`, `--umbra-key-value-hint-fg`, `--umbra-key-value-label-fg`, `--umbra-key-value-label-width`, `--umbra-key-value-min-column`, `--umbra-key-value-padding-x`, `--umbra-key-value-row-height`, `--umbra-key-value-stripe`, `--umbra-key-value-value-fg`, `--umbra-key-value-value-font`.

| Prop | Type | Purpose |
|---|---|---|
| `items` | `KeyValueItem[]` | The rows as data. Use this or `children`. |
| `children` | `ReactNode` | The rows as `KeyValue` elements. |
| `loading` | `boolean` | Shows skeleton rows in the final layout. |
| `skeletonRows` | `number` | Number of skeleton rows. |
| `empty` | `ReactNode` | Shown when there are no items. |
| `error` | `ReactNode` | Shown in place of the items when set. Put a retry action inside it. |
| `parts` | `see Parts` | Replace or hide named pieces. `item` receives the props of each row built from `items`. |
| `aria-label` | `string` | Names the list for assistive technology. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `orientation` | `Orientation` | Orientation of every item. Default: `inline` in rows, `stacked` in columns and in the grid. |
| `align` | `Align` | Where every value sits. |
| `wrap` | `boolean` | Lets long values wrap instead of being cut. |
| `layout` | `"columns" \| "rows" \| "grid"` | `rows`: one row per item, sharing one label column. `columns`: side by side. `grid`: in `columns` columns. |
| `columns` | `number` | Most columns of the `grid` layout. Fewer are used when the list is narrow. |
| `striped` | `boolean` | Shades every other row (`rows` layout). |
| `dividers` | `boolean` | Draws a line between items (`rows` and `columns` layouts). |
| `labelWidth` | `string \| number` | Width of the shared label column in the `rows` layout: pixels or any CSS length. Default: as wide as the longest label, at most 60%. |

**Parts**: `item`, `skeleton`, `empty`, `error`.

**Blocks**: `KeyValueList.Root`, `KeyValueList.Item`.

## Legend

The key for a chart or any colour-coded data: one marker and label per series.

**Tokens**: `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-legend-fg`, `--umbra-legend-font`, `--umbra-legend-gap`, `--umbra-legend-item-radius`, `--umbra-legend-row-gap`, `--umbra-legend-row-height`, `--umbra-legend-value-fg`, `--umbra-series-marker-size`.

| Prop | Type | Purpose |
|---|---|---|
| `items` (required) | `LegendItem[]` |  |
| `marker` | `SeriesMarkerKind` | The marker of every item that does not set its own. Patterns (`stripes`, `dots`) do not depend on colour. |
| `loading` | `boolean` | Shows placeholder items while the data loads. |
| `loadingCount` | `number` | Number of placeholder items while `loading`. |
| `moreLabel` | `((count: number) => string)` | Text of the button that stands for the items that did not fit. |
| `allLabel` | `string` | Accessible name of the popover with the full list. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name of the legend. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `orientation` | `"vertical" \| "horizontal"` |  |
| `align` | `"start" \| "center" \| "end"` | Where the items sit along the legend. A vertical legend with values always fills its width. |
| `interactive` | `boolean` | Makes each item a toggle button that switches its series on and off. |
| `onHighlight` | `((id: string \| null) => void)` | Called with an item's id while it is hovered or focused, and with `null` when it no longer is. |
| `maxRows` | `number` | The most rows a horizontal legend wraps to. |
| `hiddenIds` | `readonly string[]` | Ids of the items that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |

**Parts**: `item`, `marker`, `label`, `value`, `more`, `skeleton`.

**Blocks**: `Legend.Root`, `Legend.Item`, `Legend.Marker`, `Legend.More`.

## List

A vertical list of rows that scrolls inside its slot, with optional groups, selection and row actions.

**Tokens**: `--umbra-focus-color`, `--umbra-list-divider-color`, `--umbra-list-number-width`, `--umbra-list-stripe-bg`.

| Prop | Type | Purpose |
|---|---|---|
| `items` | `T[]` | The rows, as data. Use with `renderItem`; or pass `List.Item` children instead. |
| `groups` | `ListGroupData<T>[]` | Grouped rows, as data: each group's header props and its `items`. |
| `renderItem` | `((item: T, index: number) => ReactNode)` | Returns the `List.Item` of one row. |
| `children` | `ReactNode` | `List.Item` and `List.Group` elements. |
| `selectionMode` | `"none" \| "single" \| "multiple"` | `single` and `multiple` let the user select rows. |
| `selectedKeys` | `ListKey[]` | Controlled selection: the keys of the selected rows. |
| `defaultSelectedKeys` | `ListKey[]` |  |
| `onSelectionChange` | `((keys: ListKey[]) => void)` |  |
| `selectionBehavior` | `"toggle" \| "replace"` | `replace`: a click selects only that row, a double click or Enter activates it, and selection follows the arrow keys. `toggle`: a click or Space toggles the row. Default: `replace` when `onAction` is set, otherwise `toggle`. |
| `disallowEmptySelection` | `boolean` | The user cannot deselect the last selected row. Default: on with `replace` (so a double click does not deselect), otherwise off. |
| `onAction` | `((key: ListKey) => void)` | Called when a row is activated: Enter or a double click (a single click when nothing can be selected). |
| `dividers` | `boolean` | A line between rows. |
| `striped` | `boolean` | A faint fill on every other row. |
| `numbered` | `boolean` | Shows each row's position, for a ranking. |
| `itemVariant` | `"default" \| "message"` | Default `variant` of every `List.Item`, and the layout of the skeleton rows. |
| `itemSize` | `"compact" \| "default"` | Default `size` of every `List.Item`, and of the skeleton rows. |
| `stickyHeaders` | `boolean` | Group headers stick to the top while their group scrolls. |
| `skeletonRows` | `number` | Number of skeleton rows shown while `loading`. |
| `onReachEnd` | `(() => void)` | Called when the list is scrolled to its end, for loading more. |
| `loadingMore` | `boolean` | Shows a skeleton row after the last row while more rows load. |
| `loadingMoreLabel` | `string` | What assistive technology hears for the `loadingMore` row. |
| `aria-label` | `string` | Accessible name of the list. Required unless `aria-labelledby` is set. |
| `aria-labelledby` | `string` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `loading` | `boolean` | Shows skeletons in the final layout and marks the component busy. |
| `empty` | `ReactNode \| import("../internal/dataState").DataStateContent` | Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. |
| `error` | `ReactNode \| import("../internal/dataState").DataStateContent` | Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` | Label of the retry button. |

**Parts**: `skeleton`, `state`, `loadingMore`.

**Blocks**: `List.Root`, `List.Item`, `List.Group`.

## ListItem

The content of one row of a list: a title with optional lines, and leading and trailing pieces.

**Tokens**: `--umbra-focus-color`, `--umbra-list-item-bg`, `--umbra-list-item-color`, `--umbra-list-item-gap`, `--umbra-list-item-hover-bg`, `--umbra-list-item-min-height`, `--umbra-list-item-padding-x`, `--umbra-list-item-padding-y`, `--umbra-list-item-read-color`, `--umbra-list-item-secondary-color`, `--umbra-list-item-selected-bg`, `--umbra-list-item-selected-stripe`, `--umbra-list-item-stripe-width`, `--umbra-list-item-title-font`, `--umbra-list-item-unread-color`.

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` | The main line. Truncates last. |
| `description` | `ReactNode` | A second line under the title. |
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
| `accent` | `string` | A colour for an edge stripe that carries a category. Give `accentLabel` too, so it is not colour alone. |
| `variant` | `"default" \| "message"` | `message`: sender and tag on the first line, title and time on the second. |
| `interactive` | `boolean` | Shows hover and press feedback. Set by `List`, and by `href` or `onPress`. |
| `size` | `"compact" \| "default"` | `compact` is one control high, for leaderboards and short lists. Otherwise the height follows the density level. |
| `selected` | `boolean` | Violet fill with an edge stripe. Inside a `List`, selection sets it. |
| `unread` | `boolean` | `true`: bold title and a dot. `false`: the title is dimmed as read. Leave unset where rows have no read state. |
| `disabled` | `boolean` |  |

**Parts**: `leading`, `overline`, `title`, `description`, `meta`, `unread`, `trailing`.

**Blocks**: `ListItem.Root`, `ListItem.Leading`, `ListItem.Content`, `ListItem.Overline`, `ListItem.Title`, `ListItem.Description`, `ListItem.End`, `ListItem.Meta`, `ListItem.Unread`, `ListItem.Trailing`.

## Page

The content area under the bars: applies the outer margin and the context tint.

**Tokens**: `--umbra-page-gap`, `--umbra-page-margin`.

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

**Parts**: `header`, `content`, `footer`.

**Blocks**: `Page.Root`, `Page.Header`, `Page.Content`, `Page.Footer`.

## PrimaryNav

The top-level sections of the app, inside the `TopBar`.

**Tokens**: `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-nav-font`, `--umbra-nav-gap`, `--umbra-nav-indicator-color`, `--umbra-subnav-indicator-color`.

| Prop | Type | Purpose |
|---|---|---|
| `items` | `NavItem[]` | The top-level sections. `items` inside an item makes a dropdown. |
| `parts` | `see Parts` | Replace or hide named pieces. An `item` function receives each item's props. |
| `value` | `string` | The active item. |
| `onChange` | `((id: string) => void)` | Called with the id of the item the user chose. |
| `renderLink` | `((props: import("./nav").NavLinkProps) => ReactNode)` | Plugs in the app's router link. Defaults to a plain `<a>`. |
| `moreLabel` | `string` | Label of the overflow item. |
| `aria-label` | `string` | Accessible name of the navigation landmark. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |

**Parts**: `indicator`, `more`, `item`.

**Blocks**: `PrimaryNav.Root`, `PrimaryNav.Item`, `PrimaryNav.Menu`.

## ScrollArea

A region that scrolls inside its slot. The only place scrolling happens.

**Tokens**: `--umbra-scroll-fade-color`, `--umbra-scroll-thumb`, `--umbra-scroll-thumb-hover`, `--umbra-scroll-thumb-size`.

| Prop | Type | Purpose |
|---|---|---|
| `axis` | `"vertical" \| "horizontal" \| "both"` |  |
| `scrollbar` | `"auto" \| "hover"` | `hover` shows the thumb only while the pointer or focus is inside the area. |
| `fade` | `boolean` | A soft fade at an edge that has more content. |
| `onReachEnd` | `(() => void)` | Called when the end is reached, for loading more. |
| `label` | `string` | Accessible name, used when the area itself has to be focusable to be scrolled by keyboard. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |

**Parts**: `fade`.

**Blocks**: none.

## SectionTitle

A heading for one section of content inside a card or page, with optional controls on the same line.

**Tokens**: `--umbra-section-link-color`, `--umbra-section-rule-color`, `--umbra-section-title-color`, `--umbra-section-title-font`.

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The title. |
| `variant` | `"heading" \| "link" \| "rule"` | `link` is chosen automatically when `href` or `onOpen` is set. |
| `level` | `4 \| 3 \| 2 \| 5 \| 6` | Heading level. |
| `href` | `string` | Makes the title a link to a fuller view of the section. |
| `onOpen` | `(() => void)` |  |
| `count` | `number` | A number shown after the title. |
| `actions` | `ReactNode` | Trailing controls. They move into an overflow menu when they do not fit. |
| `moreLabel` | `string` | Accessible name of the overflow menu button. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |

**Parts**: `title`, `count`, `actions`.

**Blocks**: none.

## Skeleton

A grey placeholder in the shape of content that is still loading. Hidden from assistive technology.

**Tokens**: `--umbra-skeleton-bg`, `--umbra-skeleton-highlight`, `--umbra-skeleton-radius`.

| Prop | Type | Purpose |
|---|---|---|
| `shape` | `"circle" \| "text" \| "block"` | `text` for lines of text, `block` for any rectangle, `circle` for avatars and icons. |
| `lines` | `number` | Number of lines, for `text`. The last line is shorter. |
| `width` | `string \| number` | Defaults to the width of the slot. |
| `height` | `string \| number` | Defaults to the height of the slot (`block`) or of the text (`text`). |
| `animation` | `"none" \| "pulse"` | `none` is forced when reduced motion is on. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |

**Parts**: none.

**Blocks**: none.

## Slot

Gives `size`, `priority`, `minWidth`, `minHeight` and `label` to content that is not an umbra-ui component. The content fills the slot.

**Tokens**: `--umbra-layout-gap`.

| Prop | Type | Purpose |
|---|---|---|
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | Reserved: `Columns` has no rule that uses it yet, so it has no effect. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |

**Parts**: none.

**Blocks**: none.

## Stack

Shares its height among its children.

**Tokens**: `--umbra-layout-gap`.

| Prop | Type | Purpose |
|---|---|---|
| `gap` | `0 \| 4 \| 3 \| 1 \| 2 \| 5 \| 6 \| 7 \| 8 \| 9` | Overrides the gap, which otherwise follows the density level. |
| `overflow` | `"keep" \| "collapse"` | `collapse` shrinks the lowest-priority cards to their headers when they cannot all fit. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | Reserved: `Columns` has no rule that uses it yet, so it has no effect. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |

**Parts**: none.

**Blocks**: none.

## StatValue

A large value with its label, and optional unit, trend, caption and meter.

**Tokens**: `--umbra-stat-value-caption-fg`, `--umbra-stat-value-fg`, `--umbra-stat-value-font`, `--umbra-stat-value-font-small`, `--umbra-stat-value-gap`, `--umbra-stat-value-label-fg`, `--umbra-stat-value-unit-fg`.

| Prop | Type | Purpose |
|---|---|---|
| `value` | `ReactNode` | The value. It never hides. |
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
| `tone` | `StatValueTone` | Colour of the value. A tone that carries meaning needs a second cue: a `trend`, an icon or the label. |
| `align` | `"start" \| "center" \| "end"` |  |
| `size` | `"md" \| "lg" \| "xl"` | Size of the value: `md` is the title font, `lg` the display font, `xl` larger still. |

**Parts**: `icon`, `label`, `value`, `unit`, `trend`, `caption`, `meter`, `skeleton`.

**Blocks**: `StatValue.Root`, `StatValue.Label`, `StatValue.Figure`, `StatValue.Value`, `StatValue.Unit`, `StatValue.Trend`, `StatValue.Caption`, `StatValue.Meter`.

## SubNav

The second bar: the pages of the current section, and room for shortcuts at the end.

**Tokens**: `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-nav-font`, `--umbra-nav-gap`, `--umbra-nav-indicator-color`, `--umbra-subnav-bg`, `--umbra-subnav-height`, `--umbra-subnav-indicator-color`.

| Prop | Type | Purpose |
|---|---|---|
| `label` | `ReactNode` | The section name. |
| `items` | `NavItem[]` | The pages of the section. Same shape as `PrimaryNav`. |
| `end` | `ReactNode` | Free slot at the end, normally a `ShortcutBar`. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `string` | The active item. |
| `onChange` | `((id: string) => void)` | Called with the id of the item the user chose. |
| `renderLink` | `((props: import("./nav").NavLinkProps) => ReactNode)` | Plugs in the app's router link. Defaults to a plain `<a>`. |
| `moreLabel` | `string` | Label of the overflow item. |
| `aria-label` | `string` | Accessible name of the navigation landmark. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |

**Parts**: `indicator`, `more`, `label`, `item`, `end`.

**Blocks**: `SubNav.Root`, `SubNav.Label`, `SubNav.Item`, `SubNav.Menu`, `SubNav.End`.

## SummaryTile

A compact tile that sums up one thing: an icon, a title and one value. The whole tile can be a link or a button.

**Tokens**: `--umbra-focus-color`, `--umbra-summary-tile-bg`, `--umbra-summary-tile-border`, `--umbra-summary-tile-caption-fg`, `--umbra-summary-tile-fg`, `--umbra-summary-tile-icon-bg`, `--umbra-summary-tile-icon-size`, `--umbra-summary-tile-min-height`, `--umbra-summary-tile-min-width`, `--umbra-summary-tile-padding`, `--umbra-summary-tile-radius`, `--umbra-summary-tile-selected-bg`, `--umbra-summary-tile-selected-fg`.

| Prop | Type | Purpose |
|---|---|---|
| `icon` | `ReactNode` | Shown in a block at the start of the tile. |
| `title` | `ReactNode` | What the tile is about. |
| `value` | `ReactNode` | The one value the tile shows. |
| `caption` | `ReactNode` | A secondary line under the value. |
| `trend` | `ReactNode` | A node after the value that shows its direction, for example a `TrendArrow`. |
| `loading` | `boolean` | Shows skeletons in place of the value and caption. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Accessible name, when the content does not name the tile. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `href` | `string` | Makes the whole tile one link. |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `selected` | `boolean` | Marks the tile as the current one: a link gets `aria-current`, a button `aria-pressed`. |
| `disabled` | `boolean` |  |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `onPress` | `(() => void)` | Makes the whole tile one button. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | Reserved: `Columns` has no rule that uses it yet, so it has no effect. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |

**Parts**: `icon`, `title`, `value`, `trend`, `caption`, `skeleton`.

**Blocks**: `SummaryTile.Root`, `SummaryTile.Icon`, `SummaryTile.Content`, `SummaryTile.Title`, `SummaryTile.Figure`, `SummaryTile.Value`, `SummaryTile.Trend`, `SummaryTile.Caption`.

## TopBar

The brand-coloured bar at the top: where the user is, the main sections, and the one primary action.

**Tokens**: `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-nav-font`, `--umbra-nav-gap`, `--umbra-nav-indicator-color`, `--umbra-subnav-indicator-color`, `--umbra-topbar-bg`, `--umbra-topbar-fg`, `--umbra-topbar-height`.

| Prop | Type | Purpose |
|---|---|---|
| `logo` | `ReactNode` | App or entity mark. |
| `nav` | `ReactNode` | A `PrimaryNav`. |
| `actions` | `ReactNode` | `IconButton`s. They collapse into one menu when space is short. |
| `context` | `ReactNode` | A two-line status block. Hides first when space is short. |
| `primaryAction` | `ReactNode` | The one primary action of the app. Give the button `collapseTo="icon"` so it can shrink to its icon. |
| `history` | `ReactNode` | `true` shows back and forward buttons that use the browser history; a node replaces them. |
| `onSearch` | `(() => void)` | Shows the search trigger and is called when it is used (also by the `Mod+K` shortcut). |
| `searchLabel` | `string` | Accessible names of the built-in buttons. |
| `backLabel` | `string` |  |
| `forwardLabel` | `string` |  |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `brand` | `string` | Overrides the brand colour for this bar only. Text on it is computed for contrast. |
| `moreLabel` | `string` | Accessible name of the menu that holds the actions when they do not fit. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |

**Parts**: `start`, `logo`, `nav`, `actions`, `context`, `primaryAction`.

**Blocks**: `TopBar.Root`, `TopBar.Start`, `TopBar.Nav`, `TopBar.Actions`, `TopBar.End`.

## UmbraProvider

Wraps the app once. Supplies the theme, density, icon map and shortcut registry to every component.

**Tokens**: `--umbra-icon-size`.

| Prop | Type | Purpose |
|---|---|---|
| `icons` | `Partial<IconMap>` | Overrides built-in icons by name. |
| `shortcuts` | `Shortcut[]` | The app's key bindings. |
| `reducedMotion` | `"system" \| "always" \| "never"` | `system` follows the operating system setting. |
| `locale` | `string` | Locale for number and date formatting and text direction. Defaults to the browser's. |
| `brand` | `string` | Brand colour, used by the TopBar. Text on it is computed for contrast. Hex or `rgb()`. |
| `context` | `ContextTint` | Context tint for the page background and tinted cards. |
| `density` | `"compact" \| "default" \| "spacious"` | Spacing, row heights and text sizes. |
| `tokens` | `Partial<Record<(string & {}) \| TokenName, string \| number>>` | Overrides individual tokens for this subtree. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |

**Parts**: none.

**Blocks**: none.

## UmbraScope

The same `context`, `density`, `brand` and `tokens` as the provider, for one subtree.

**Tokens**: `--umbra-icon-size`.

| Prop | Type | Purpose |
|---|---|---|
| `brand` | `string` | Brand colour, used by the TopBar. Text on it is computed for contrast. Hex or `rgb()`. |
| `context` | `ContextTint` | Context tint for the page background and tinted cards. |
| `density` | `"compact" \| "default" \| "spacious"` | Spacing, row heights and text sizes. |
| `tokens` | `Partial<Record<(string & {}) \| TokenName, string \| number>>` | Overrides individual tokens for this subtree. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `children` | `ReactNode` |  |

**Parts**: none.

**Blocks**: none.
