# Customisation tables

Generated from the source by `npm run docs:tables`. Do not edit.

Every component is customised through the same four layers: tokens, props, parts and blocks.
A token is a CSS variable: set it in CSS on any ancestor, or through the `tokens` prop of
`UmbraProvider` or `UmbraScope` (without the `--umbra-` prefix). Every component also accepts
`className` and `style` on its root.

## Accordion

A stack of sections that open and close. It fills its slot; an open panel scrolls inside when space is short.

**Tokens**: `--umbra-accordion-border`, `--umbra-accordion-gap`, `--umbra-accordion-header-height`, `--umbra-accordion-padding`, `--umbra-accordion-title-font`, `--umbra-card-bg`, `--umbra-card-border`, `--umbra-card-padding`, `--umbra-card-radius`, `--umbra-card-title-font`, `--umbra-focus-color`, `--umbra-scroll-thumb`.

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
| `minWidth` | `number` | Reserved: `Columns` has no rule that uses it yet, so it has no effect. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
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

**Tokens**: `--umbra-action-bar-bg`, `--umbra-action-bar-border`, `--umbra-action-bar-danger-color`, `--umbra-action-bar-gap`, `--umbra-action-bar-info-color`, `--umbra-action-bar-neutral-color`, `--umbra-action-bar-offset`, `--umbra-action-bar-padding-x`, `--umbra-action-bar-padding-y`, `--umbra-action-bar-radius`, `--umbra-action-bar-success-color`, `--umbra-action-bar-warning-color`, `--umbra-icon-size`.

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
| `variant` | `"inline" \| "floating"` | `inline`: in the flow, at the bottom of a page, card or modal. `floating`: over the bottom of its container. |
| `emphasis` | `"default" \| "strong"` | `strong` fills the bar with the tone, for a status the user has to act on. |
| `open` | `boolean` | Shows a `floating` bar. Its container needs `position: relative`. |
| `align` | `"start" \| "center" \| "end"` | Where the actions sit. The status is always at the start. |

**Parts**: `status`, `clear`, `tertiary`, `actions`.

**Blocks**: `ActionBar.Root`, `ActionBar.Status`, `ActionBar.Actions`, `ActionBar.Group`, `ActionBar.Action`, `ActionBar.Clear`.

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

## Badge

A count or a dot, alone or on the corner of another element.

**Tokens**: `--umbra-badge-bg`, `--umbra-badge-dot-size`, `--umbra-badge-fg`, `--umbra-badge-font`, `--umbra-badge-offset`, `--umbra-badge-radius`, `--umbra-badge-size`.

| Prop | Type | Purpose |
|---|---|---|
| `count` | `number` | The number to show. |
| `dot` | `boolean` | Shows a dot instead of a number. |
| `max` | `number` | Counts above this show as "99+". |
| `showZero` | `boolean` | Shows the badge when `count` is 0. |
| `label` | `string \| ((count: number) => string)` | What a screen reader hears: a string, or a function of the count (`(n) => n + ' unread'`). By default the full count is read, also above `max`. A dot is silent without it. |
| `children` | `ReactNode` | The element the badge sits on the corner of. Without it the badge stands alone. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `tone` | `Tone` | What the colour means. `accent` is the fixed violet. |
| `color` | `string` | A custom colour (any CSS colour). Replaces `tone`. |

**Parts**: `indicator`.

**Blocks**: `Badge.Root`, `Badge.Indicator`.

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

## BarChart

Compares values across categories: grouped, stacked or diverging around zero, upright or sideways.

**Tokens**: `--umbra-chart-annotation`, `--umbra-chart-annotation-width`, `--umbra-chart-area-opacity`, `--umbra-chart-axis`, `--umbra-chart-axis-width`, `--umbra-chart-band-opacity`, `--umbra-chart-bar-radius`, `--umbra-chart-center-font`, `--umbra-chart-dim-opacity`, `--umbra-chart-fg`, `--umbra-chart-font`, `--umbra-chart-gap`, `--umbra-chart-grid`, `--umbra-chart-grid-dash`, `--umbra-chart-grid-width`, `--umbra-chart-line-width`, `--umbra-chart-point-scale`, `--umbra-chart-tooltip-bg`, `--umbra-chart-tooltip-border`, `--umbra-chart-tooltip-fg`, `--umbra-chart-tooltip-radius`, `--umbra-chart-track`, `--umbra-chart-value-fg`, `--umbra-focus-color`, `--umbra-legend-row-height`.

| Prop | Type | Purpose |
|---|---|---|
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |
| `variant` | `"stacked" \| "grouped" \| "diverging"` | `grouped`: the series side by side. `stacked`: on top of each other. `diverging`: every second series is drawn on the other side of zero, with all values shown as positive. |
| `orientation` | `"vertical" \| "horizontal"` | `horizontal` puts the categories on the left and draws the bars sideways. |
| `loading` | `boolean` | Shows a placeholder in the chart's shape. |
| `hiddenIds` | `readonly string[]` | Ids of the series that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |
| `error` | `ReactNode` | When set, shown in place of the chart. |
| `label` | `string` | Accessible name of the chart. Required unless `aria-labelledby` is set. |
| `thresholds` | `BarThreshold[]` | Colours bars by value. Each threshold also has a fill, so the steps differ without colour. |
| `formatValue` | `((value: number) => string)` | Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. |
| `categories` (required) | `string[]` |  |
| `series` (required) | `BarSeries[]` |  |
| `colorBy` | `"series" \| "sign"` | `sign` colours bars by the sign of their value; negative bars are also striped. |
| `valueDomain` | `[number, number]` | The range of the value axis. Defaults to round numbers around the data, with zero. |
| `annotations` | `ChartAnnotation[]` | Reference lines and bands on the value axis. |
| `xTitle` | `string` | Title of the horizontal axis. |
| `yTitle` | `string` | Title of the vertical axis. |
| `aria-labelledby` | `string` | Id of the element that names the chart, for example a card title. |
| `description` | `string` | What a screen reader hears after the name. Defaults to a generated summary of the data. |
| `legend` | `string \| number \| bigint \| boolean \| import("react").ReactElement<unknown, string \| import("react").JSXElementConstructor<any>> \| Iterable<ReactNode> \| import("react").ReactPortal \| Promise<string \| number \| bigint \| boolean \| import("react").ReactPortal \| import("react").ReactElement<unknown, string \| import("react").JSXElementConstructor<any>> \| Iterable<ReactNode> \| null \| undefined> \| null` | The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it. By default it is shown below the chart when there is more than one series. |
| `labels` | `boolean` | Draws labels on the chart itself, so it can be read without the legend or the tooltip. |
| `onPointPress` | `((point: import(".").ChartPoint) => void)` | Called when a point is clicked, or activated with Enter or Space. |
| `empty` | `ReactNode` | Shown when there is no data. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` |  |
| `pointsLabel` | `string` | Accessible name of the list of data points. |
| `legendLabel` | `string` | Accessible name of the legend. |

**Parts**: `legend`, `tooltip`, `skeleton`, `empty`, `error`.

**Blocks**: `BarChart.Root`, `BarChart.Grid`, `BarChart.Annotations`, `BarChart.Bars`, `BarChart.Axes`, `BarChart.ValueLabels`.

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

## Checkbox

A box that is checked or not: one yes-or-no choice, or one of several in a `CheckboxGroup`.

**Tokens**: `--umbra-checkbox-bg`, `--umbra-checkbox-border`, `--umbra-checkbox-border-width`, `--umbra-checkbox-gap`, `--umbra-checkbox-invalid-border`, `--umbra-checkbox-mark-color`, `--umbra-checkbox-radius`, `--umbra-checkbox-selected-bg`, `--umbra-checkbox-size`, `--umbra-checkbox-small-size`, `--umbra-field-description-color`, `--umbra-field-error-color`, `--umbra-field-marker-color`, `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-option-group-gap`, `--umbra-option-group-inline-gap`, `--umbra-option-group-min-option-width`, `--umbra-option-group-text-gap`.

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label. |
| `description` | `ReactNode` | A second line under the label. |
| `error` | `ReactNode` | An error message under the checkbox, shown with an icon. Setting it makes the checkbox invalid. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `string` | The form value when checked; inside a `CheckboxGroup`, the entry in the group's `value`. |
| `onChange` | `((checked: boolean) => void)` |  |
| `aria-label` | `string` | Accessible name of a checkbox that has no visible label. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |
| `size` | `"default" \| "small"` | `small` is for use inside table cells. Otherwise the size follows the density level. |
| `disabled` | `boolean` |  |
| `indeterminate` | `boolean` | Shows the "some, not all" mark, whatever `checked` is. |
| `checked` | `boolean` | Controlled state. |
| `defaultChecked` | `boolean` |  |
| `readOnly` | `boolean` | Focusable, but cannot be changed. |
| `invalid` | `boolean` |  |
| `required` | `boolean` |  |
| `requiredLabel` | `string` | The text of the required marker after the label. |
| `name` | `string` | Form field name. |
| `id` | `string` |  |

**Parts**: `box`, `label`, `description`, `error`.

**Blocks**: `Checkbox.Root`, `Checkbox.Box`, `Checkbox.Label`, `Checkbox.Description`, `Checkbox.Error`.

## CheckboxGroup

Several checkboxes that answer one question, with a shared label, description and error.

**Tokens**: `--umbra-checkbox-bg`, `--umbra-checkbox-border`, `--umbra-checkbox-border-width`, `--umbra-checkbox-gap`, `--umbra-checkbox-invalid-border`, `--umbra-checkbox-mark-color`, `--umbra-checkbox-radius`, `--umbra-checkbox-selected-bg`, `--umbra-checkbox-size`, `--umbra-checkbox-small-size`, `--umbra-field-description-color`, `--umbra-field-error-color`, `--umbra-field-marker-color`, `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-option-group-gap`, `--umbra-option-group-inline-gap`, `--umbra-option-group-min-option-width`, `--umbra-option-group-text-gap`.

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The checkboxes. |
| `label` | `ReactNode` | The group's label. |
| `description` | `ReactNode` | A line under the label. |
| `error` | `ReactNode` | An error message under the checkboxes, shown with an icon. Setting it makes the group invalid. |
| `columns` | `number` | Lays the checkboxes in a grid of at most this many columns; columns drop as the group narrows. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `string[]` | Controlled: the `value` of every checked checkbox. |
| `onChange` | `((value: string[]) => void)` |  |
| `aria-label` | `string` | Accessible name of a group that has no visible label. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |
| `orientation` | `"vertical" \| "horizontal"` | `horizontal` puts the checkboxes on one line, wrapping when they do not fit. |
| `disabled` | `boolean` |  |
| `readOnly` | `boolean` |  |
| `invalid` | `boolean` |  |
| `required` | `boolean` | At least one checkbox must be checked. |
| `requiredLabel` | `string` | The text of the required marker after the group label. |
| `name` | `string` | Form field name of every checkbox in the group. |
| `id` | `string` |  |
| `defaultValue` | `string[]` |  |

**Parts**: `label`, `description`, `options`, `error`.

**Blocks**: `CheckboxGroup.Root`, `CheckboxGroup.Label`, `CheckboxGroup.Description`, `CheckboxGroup.Options`, `CheckboxGroup.Error`.

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

## DonutChart

A ring that shows one value against a total, or how a total splits into segments.

**Tokens**: `--umbra-chart-annotation`, `--umbra-chart-annotation-width`, `--umbra-chart-area-opacity`, `--umbra-chart-axis`, `--umbra-chart-axis-width`, `--umbra-chart-band-opacity`, `--umbra-chart-bar-radius`, `--umbra-chart-center-font`, `--umbra-chart-dim-opacity`, `--umbra-chart-fg`, `--umbra-chart-font`, `--umbra-chart-gap`, `--umbra-chart-grid`, `--umbra-chart-grid-dash`, `--umbra-chart-grid-width`, `--umbra-chart-line-width`, `--umbra-chart-point-scale`, `--umbra-chart-tooltip-bg`, `--umbra-chart-tooltip-border`, `--umbra-chart-tooltip-fg`, `--umbra-chart-tooltip-radius`, `--umbra-chart-track`, `--umbra-chart-value-fg`, `--umbra-focus-color`, `--umbra-legend-row-height`.

| Prop | Type | Purpose |
|---|---|---|
| `centerValue` | `ReactNode` | The large line in the middle. In the single-value form it defaults to the percentage; `null` hides it. |
| `centerLabel` | `ReactNode` | The caption under it. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `number` | The single-value form: one value against `max`. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |
| `tone` | `DonutTone` | Colour of the single value. The number in the centre is the cue that does not depend on colour. |
| `loading` | `boolean` | Shows a placeholder in the chart's shape. |
| `hiddenIds` | `readonly string[]` | Ids of the series that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |
| `error` | `ReactNode` | When set, shown in place of the chart. |
| `label` | `string` | Accessible name of the chart. Required unless `aria-labelledby` is set. |
| `color` | `string` | Any CSS colour for the single value; wins over `tone`. |
| `max` | `number` | What a full ring stands for, in the single-value form. |
| `thresholds` | `{ from: number; tone: DonutTone; }[]` | Picks the tone from the value: the last entry whose `from` the value reaches. |
| `formatValue` | `((value: number) => string)` | Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. |
| `aria-labelledby` | `string` | Id of the element that names the chart, for example a card title. |
| `description` | `string` | What a screen reader hears after the name. Defaults to a generated summary of the data. |
| `legend` | `string \| number \| bigint \| boolean \| import("react").ReactElement<unknown, string \| import("react").JSXElementConstructor<any>> \| Iterable<ReactNode> \| import("react").ReactPortal \| Promise<string \| number \| bigint \| boolean \| import("react").ReactPortal \| import("react").ReactElement<unknown, string \| import("react").JSXElementConstructor<any>> \| Iterable<ReactNode> \| null \| undefined> \| null` | The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it. By default it is shown below the chart when there is more than one series. |
| `labels` | `boolean` | Draws labels on the chart itself, so it can be read without the legend or the tooltip. |
| `onPointPress` | `((point: import(".").ChartPoint) => void)` | Called when a point is clicked, or activated with Enter or Space. |
| `empty` | `ReactNode` | Shown when there is no data. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` |  |
| `pointsLabel` | `string` | Accessible name of the list of data points. |
| `legendLabel` | `string` | Accessible name of the legend. |
| `data` | `DonutSegment[]` | The segment form: several values that share the ring. |
| `thickness` | `number` | Width of the ring in pixels. By default a fifth of the radius. |
| `startAngle` | `number` | Where the ring starts, in degrees clockwise from 12 o'clock. |
| `sweep` | `number` | Degrees the ring covers. Less than 360 leaves it open, as a gauge. |
| `roundedCaps` | `boolean` | Rounds the ends of the value. On by default in the single-value form. |
| `gap` | `number` | Degrees left empty between segments. |

**Parts**: `legend`, `tooltip`, `skeleton`, `empty`, `error`, `center`.

**Blocks**: `DonutChart.Root`, `DonutChart.Track`, `DonutChart.Segments`, `DonutChart.Labels`, `DonutChart.Center`.

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

## FormField

Pairs a label, a description and an error message with one control: a row of a form or settings list.

**Tokens**: `--umbra-field-description-color`, `--umbra-field-error-color`, `--umbra-field-marker-color`, `--umbra-form-field-bg`, `--umbra-form-field-control-gap`, `--umbra-form-field-control-max-width`, `--umbra-form-field-gap`, `--umbra-form-field-padding-x`, `--umbra-form-field-padding-y`, `--umbra-form-field-radius`, `--umbra-option-group-gap`, `--umbra-option-group-inline-gap`, `--umbra-option-group-min-option-width`, `--umbra-option-group-text-gap`.

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode \| ((control: FormFieldControlProps) => ReactNode)` | The control: an umbra-ui input, or a function for a plain form element. |
| `label` | `ReactNode` | The label. A click on it focuses or toggles the control. |
| `description` | `ReactNode` | A line that explains the setting. |
| `error` | `ReactNode` | An error message, shown with an icon. Setting it makes the control invalid. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |
| `disabled` | `boolean` | Disables the control. |
| `layout` | `"inline" \| "stacked" \| "row"` | `row`: label and description at the start, control at the end, as in a settings list. `stacked`: label above the control. `inline`: label and control on one line, the description and error under the control. `row` and `inline` stack when the field is narrow. |
| `labelWidth` | `string \| number` | The width of the label column of a `row` or `inline` field: a number of pixels, or any CSS width. |
| `invalid` | `boolean` | Marks the control invalid. Set by itself when the field has an error. |
| `required` | `boolean` | Marks the control required and shows the required marker. |
| `requiredLabel` | `string` | The text of the required marker. |
| `id` | `string` | The id of the control. Generated when not set. |
| `surface` | `boolean` | Gives the field its own raised surface and padding, as the rows of a settings list have. |
| `optional` | `boolean` | Shows the optional marker. |
| `optionalLabel` | `string` | The text of the optional marker. |

**Parts**: `label`, `description`, `control`, `error`.

**Blocks**: `FormField.Root`, `FormField.Label`, `FormField.Description`, `FormField.Control`, `FormField.Error`.

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

A button that shows only an icon. Inside an overflow menu it becomes a menu item with its icon and label.

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

## LevelMeter

A strip of ticks with a marker that shows where a value sits on a scale.

**Tokens**: `--umbra-level-meter-band`, `--umbra-level-meter-border`, `--umbra-level-meter-compare`, `--umbra-level-meter-height`, `--umbra-level-meter-length`, `--umbra-level-meter-marker`, `--umbra-level-meter-marker-width`, `--umbra-level-meter-pitch`, `--umbra-level-meter-radius`, `--umbra-level-meter-tick`, `--umbra-level-meter-tick-lit`, `--umbra-level-meter-tick-width`, `--umbra-level-meter-track`.

| Prop | Type | Purpose |
|---|---|---|
| `label` | `ReactNode` | The name of the meter, shown before it. |
| `minLabel` | `ReactNode` | Captions at the two ends of the scale. |
| `maxLabel` | `ReactNode` |  |
| `valueLabel` | `ReactNode` | Replaces the formatted value. Setting it shows the value. |
| `showValue` | `boolean` | Shows the value as text after the meter. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `LevelMeterValue` | Where the marker sits. Leave it out to show only a `range`. |
| `aria-label` | `string` | Names a meter that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `tone` | `MeterTone` | Colour of the marker, when no zone or level sets it. |
| `orientation` | `"vertical" \| "horizontal"` |  |
| `loading` | `boolean` | Shows skeletons in place of the ticks and the value. |
| `size` | `"default" \| "small" \| "large"` |  |
| `min` | `number` |  |
| `max` | `number` |  |
| `formatValue` | `((value: number) => string)` | Text of a position on a numeric scale. A named scale uses the labels of its levels. |
| `steps` | `number` | Number of ticks on a numeric scale. |
| `levels` | `LevelMeterLevel[]` | A named scale: one tick per level, and the marker sits on a level. Replaces `min`, `max` and `steps`. |
| `range` | `[LevelMeterValue, LevelMeterValue]` | Draws a band from the first position to the second, for an estimate or an allowed span. |
| `compare` | `LevelMeterValue` | A second, smaller marker to compare the value with. |
| `compareLabel` | `string` | Names the comparison marker for assistive technology. |
| `rangeLabel` | `string` | Names the band for assistive technology. |
| `zones` | `Zone[]` | Colours the marker by the zone it is in. Zone edges are drawn as taller ticks, and the zone's label is read out. |
| `boxed` | `boolean` | Draws the box around the ticks. |

**Parts**: `label`, `minLabel`, `maxLabel`, `strip`, `band`, `marker`, `compare`, `value`, `skeleton`.

**Blocks**: `LevelMeter.Root`, `LevelMeter.Label`, `LevelMeter.EndLabel`, `LevelMeter.Strip`, `LevelMeter.Band`, `LevelMeter.Marker`, `LevelMeter.Value`.

## LineChart

One or more series over categories, numbers or time, with a numeric or an ordinal y axis.

**Tokens**: `--umbra-chart-annotation`, `--umbra-chart-annotation-width`, `--umbra-chart-area-opacity`, `--umbra-chart-axis`, `--umbra-chart-axis-width`, `--umbra-chart-band-opacity`, `--umbra-chart-bar-radius`, `--umbra-chart-center-font`, `--umbra-chart-dim-opacity`, `--umbra-chart-fg`, `--umbra-chart-font`, `--umbra-chart-gap`, `--umbra-chart-grid`, `--umbra-chart-grid-dash`, `--umbra-chart-grid-width`, `--umbra-chart-line-width`, `--umbra-chart-point-scale`, `--umbra-chart-tooltip-bg`, `--umbra-chart-tooltip-border`, `--umbra-chart-tooltip-fg`, `--umbra-chart-tooltip-radius`, `--umbra-chart-track`, `--umbra-chart-value-fg`, `--umbra-focus-color`, `--umbra-legend-row-height`.

| Prop | Type | Purpose |
|---|---|---|
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |
| `loading` | `boolean` | Shows a placeholder in the chart's shape. |
| `hiddenIds` | `readonly string[]` | Ids of the series that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |
| `error` | `ReactNode` | When set, shown in place of the chart. |
| `label` | `string` | Accessible name of the chart. Required unless `aria-labelledby` is set. |
| `formatValue` | `((value: number) => string)` | Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. |
| `categories` | `string[]` | The order of a category x axis. Defaults to the order the names first appear in. |
| `series` (required) | `LineSeries[]` |  |
| `annotations` | `ChartAnnotation[]` | Reference lines and bands on either axis. |
| `xTitle` | `string` |  |
| `yTitle` | `string` |  |
| `aria-labelledby` | `string` | Id of the element that names the chart, for example a card title. |
| `description` | `string` | What a screen reader hears after the name. Defaults to a generated summary of the data. |
| `legend` | `string \| number \| bigint \| boolean \| import("react").ReactElement<unknown, string \| import("react").JSXElementConstructor<any>> \| Iterable<ReactNode> \| import("react").ReactPortal \| Promise<string \| number \| bigint \| boolean \| import("react").ReactPortal \| import("react").ReactElement<unknown, string \| import("react").JSXElementConstructor<any>> \| Iterable<ReactNode> \| null \| undefined> \| null` | The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it. By default it is shown below the chart when there is more than one series. |
| `labels` | `boolean` | Draws labels on the chart itself, so it can be read without the legend or the tooltip. |
| `onPointPress` | `((point: import(".").ChartPoint) => void)` | Called when a point is clicked, or activated with Enter or Space. |
| `empty` | `ReactNode` | Shown when there is no data. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` |  |
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

**Tokens**: `--umbra-link-color`, `--umbra-link-font`, `--umbra-link-neutral-color`, `--umbra-link-underline-offset`.

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

**Parts**: `label`, `externalIcon`, `chevron`.

**Blocks**: `Link.Root`, `Link.Label`, `Link.Icon`.

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

## Menu

A list of actions or links that opens from a control. One tab stop; arrow keys, type-ahead, and submenus that open with the arrow keys.

**Tokens**: `--umbra-focus-color`, `--umbra-menu-bg`, `--umbra-menu-border`, `--umbra-menu-item-height`, `--umbra-menu-item-hover-bg`, `--umbra-menu-item-radius`, `--umbra-menu-max-width`, `--umbra-menu-min-width`, `--umbra-menu-radius`, `--umbra-scroll-thumb`, `--umbra-scroll-thumb-size`.

| Prop | Type | Purpose |
|---|---|---|
| `items` | `MenuEntry[]` | The rows, as data. |
| `children` | `ReactNode` | The rows, as `Menu.Item`, `Menu.Section`, `Menu.Separator` and `Menu.Sub` blocks. |
| `trigger` | `ReactNode` | The control that opens the menu: an umbra-ui button, or a plain `<button>`. Leave it out to use `anchorRef`. |
| `anchorRef` | `RefObject<Element \| null>` | The element to open against, when there is no `trigger`. Use it with `open`. |
| `open` | `boolean` | Controlled state. |
| `defaultOpen` | `boolean` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `label` | `string` | Accessible name. A menu with a `trigger` is named by it. |
| `onAction` | `((id: string) => void)` | Called with the id of the row the user chose. |
| `selectedIds` | `string[]` | The checked `checkbox` and `radio` rows, in every section and submenu. |
| `defaultSelectedIds` | `string[]` |  |
| `onSelectionChange` | `((ids: string[]) => void)` |  |
| `placement` | `OverlayPlacement` | Side of the anchor and alignment along it. It flips to the other side to stay in the window. |
| `offset` | `number` | Gap between the anchor and the menu, in pixels. |
| `matchAnchorWidth` | `boolean` | Makes the menu at least as wide as its anchor. |
| `maxHeight` | `number` | Tallest the menu may be, in pixels. It is never taller than the room in the window; the rows scroll. |
| `renderLink` | `((props: MenuLinkProps) => ReactNode)` | Plugs in the app's router link for rows with `href`. Defaults to a plain `<a>`. |
| `emptyLabel` | `string` | Shown when there are no rows. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` | On the menu's panel. |
| `style` | `CSSProperties` |  |

**Parts**: `item`, `check`, `sectionHeader`.

**Blocks**: `Menu.Item`, `Menu.Section`, `Menu.Separator`, `Menu.Sub`, `Menu.Context`.

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

## PageHeader

The header of a page or of a detail pane: what it shows, facts about it, and its actions.

**Tokens**: `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-nav-font`, `--umbra-nav-gap`, `--umbra-nav-indicator-color`, `--umbra-page-header-bg`, `--umbra-page-header-border`, `--umbra-page-header-fg`, `--umbra-page-header-media-size`, `--umbra-page-header-media-size-small`, `--umbra-page-header-padding`, `--umbra-page-header-radius`, `--umbra-page-header-title-font`, `--umbra-subnav-indicator-color`.

| Prop | Type | Purpose |
|---|---|---|
| `title` | `ReactNode` |  |
| `subtitle` | `ReactNode` | A line under the title. |
| `overline` | `ReactNode` | A small line above the title, for example the kind of thing the page shows. |
| `media` | `ReactNode` | Leading avatar, entity icon or image. |
| `meta` | `ReactNode \| PageHeaderFact[]` | A row of facts: `{ label, value }` items, or any node. |
| `tags` | `ReactNode` | Tags or badges after the title. |
| `actions` | `ReactNode` | Trailing controls. |
| `onBack` | `(() => void)` | Shows a back button before the title. |
| `backLabel` | `string` | Accessible name of the back button. |
| `breadcrumbs` | `PageHeaderCrumb[]` | The path to this page; the last item is the current page. |
| `breadcrumbsLabel` | `string` | Accessible name of the breadcrumb landmark. |
| `renderLink` | `((props: NavLinkProps) => ReactNode)` | Plugs the app's router link into the breadcrumbs. Defaults to a plain `<a>`. |
| `tabs` | `ReactNode` | A tab list, placed along the bottom edge. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `tone` | `"default" \| "tinted" \| "band"` | `tinted` is a panel in the context tint. `band` fills with the brand colour, or `bandColor`. |
| `size` | `"compact" \| "default"` | `compact` is for the header of a detail pane inside a card. |
| `bandColor` | `string` | Colour of the band (hex or `rgb()`); the text colour is chosen for contrast with it. |
| `headingLevel` | `4 \| 3 \| 1 \| 2 \| 5 \| 6` | Heading level of the title. |

**Parts**: `breadcrumbs`, `back`, `media`, `overline`, `title`, `subtitle`, `meta`, `actions`, `tabs`.

**Blocks**: `PageHeader.Root`, `PageHeader.Breadcrumbs`, `PageHeader.Bar`, `PageHeader.Content`, `PageHeader.Back`, `PageHeader.Media`, `PageHeader.Titles`, `PageHeader.Overline`, `PageHeader.Title`, `PageHeader.Subtitle`, `PageHeader.Meta`, `PageHeader.Actions`, `PageHeader.Tabs`.

## Popover

An anchored panel without a backdrop: the page behind it stays usable. It keeps the density, context tint and tokens of the place it was opened from.

**Tokens**: `--umbra-focus-color`, `--umbra-popover-bg`, `--umbra-popover-border`, `--umbra-popover-max-width`, `--umbra-popover-min-width`, `--umbra-popover-padding`, `--umbra-popover-radius`, `--umbra-popover-shadow`, `--umbra-popover-title-font`.

| Prop | Type | Purpose |
|---|---|---|
| `trigger` | `ReactNode` | The control that opens it: an umbra-ui button, or a plain `<button>`. Leave it out to use `anchorRef`. |
| `toolbar` | `ReactNode` | Filters or tabs that stay fixed above the body. |
| `footer` | `ReactNode` | Status or actions fixed below the body. |
| `children` | `ReactNode \| ((close: () => void) => ReactNode)` | The body. A function receives `close`. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `open` | `boolean` | Controlled state. |
| `defaultOpen` | `boolean` |  |
| `size` | `"default" \| "large"` | `large` is a wide panel with room for a toolbar and a footer. |
| `label` | `string` | Accessible name, when there is no title. |
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
| `submenuLabel` | `((label: string) => string)` | Accessible name of the caret that opens an item's dropdown, from the item's label. |
| `aria-label` | `string` | Accessible name of the navigation landmark. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |

**Parts**: `indicator`, `more`, `item`.

**Blocks**: `PrimaryNav.Root`, `PrimaryNav.Item`, `PrimaryNav.Menu`.

## ProgressBar

A bar that fills with a value: progress of a task, or a measured level. Fills the width of its container.

**Tokens**: `--umbra-progress-bar-fill`, `--umbra-progress-bar-fill-end`, `--umbra-progress-bar-height`, `--umbra-progress-bar-min-width`, `--umbra-progress-bar-radius`, `--umbra-progress-bar-segment-gap`, `--umbra-progress-bar-target`, `--umbra-progress-bar-target-width`, `--umbra-progress-bar-track`.

| Prop | Type | Purpose |
|---|---|---|
| `label` | `ReactNode` | The name of the bar, shown beside or above it. |
| `valueLabel` | `ReactNode` | Replaces the formatted value. Setting it shows the value. |
| `showValue` | `boolean` | Shows the value as text. |
| `valuePlacement` | `"outside" \| "inside"` | `inside` draws the value on the bar; it needs `size="thick"`, and hides when the bar is too short for it. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `number` | The current value. A stacked bar defaults to the sum of its parts. |
| `aria-label` | `string` | Names a bar that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `tone` | `MeterTone` | Colour of the fill. A matching threshold wins over it. |
| `loading` | `boolean` | Shows skeletons in place of the bar and the value. |
| `size` | `"default" \| "thin" \| "thick"` |  |
| `layout` | `"block" \| "inline"` | `inline` puts the label, the bar and the value on one line, for table cells and rows. |
| `min` | `number` |  |
| `max` | `number` |  |
| `kind` | `"progress" \| "meter"` | `progress` for a task that advances (`role="progressbar"`), `meter` for a measured level (`role="meter"`). |
| `indeterminate` | `boolean` | Progress of unknown length. Moves, or shows a static striped fill when motion is reduced. |
| `thresholds` | `boolean \| Threshold[]` | Colours the fill by its level. `true` is thirds of the scale: danger, warning, success. Each band also has a pattern. |
| `invert` | `boolean` | Reverses the tones of the thresholds, for a scale where low is good. |
| `segments` | `number \| number[]` | Splits the bar: a number of equal segments, or the values where a segment ends. |
| `stack` | `ProgressBarStackItem[]` | Several coloured parts, one after another. Replaces the single fill. |
| `target` | `number` | Draws a tick at a goal value. |
| `targetLabel` | `string` | Names the target for assistive technology. |
| `formatValue` | `((value: number, scale: ProgressBarScale) => string)` | Text of a value. The default is a rounded percentage. |

**Parts**: `label`, `value`, `track`, `fill`, `target`, `skeleton`.

**Blocks**: `ProgressBar.Root`, `ProgressBar.Label`, `ProgressBar.Value`, `ProgressBar.Track`, `ProgressBar.Fill`, `ProgressBar.Target`.

## RadarChart

Compares one or more series across several axes that share a centre.

**Tokens**: `--umbra-chart-annotation`, `--umbra-chart-annotation-width`, `--umbra-chart-area-opacity`, `--umbra-chart-axis`, `--umbra-chart-axis-width`, `--umbra-chart-band-opacity`, `--umbra-chart-bar-radius`, `--umbra-chart-center-font`, `--umbra-chart-dim-opacity`, `--umbra-chart-fg`, `--umbra-chart-font`, `--umbra-chart-gap`, `--umbra-chart-grid`, `--umbra-chart-grid-dash`, `--umbra-chart-grid-width`, `--umbra-chart-line-width`, `--umbra-chart-point-scale`, `--umbra-chart-tooltip-bg`, `--umbra-chart-tooltip-border`, `--umbra-chart-tooltip-fg`, `--umbra-chart-tooltip-radius`, `--umbra-chart-track`, `--umbra-chart-value-fg`, `--umbra-focus-color`, `--umbra-legend-row-height`.

| Prop | Type | Purpose |
|---|---|---|
| `rings` | `number` | Number of grid rings, the outer one included. |
| `grid` | `"circle" \| "polygon"` | Shape of the grid rings. |
| `filled` | `boolean` | Fills the area of each series. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |
| `loading` | `boolean` | Shows a placeholder in the chart's shape. |
| `hiddenIds` | `readonly string[]` | Ids of the series that are switched off (controlled). |
| `defaultHiddenIds` | `readonly string[]` |  |
| `onHiddenChange` | `((hiddenIds: string[]) => void)` |  |
| `error` | `ReactNode` | When set, shown in place of the chart. |
| `label` | `string` | Accessible name of the chart. Required unless `aria-labelledby` is set. |
| `max` | `number` | The value at the outer ring. Defaults to a round number above the largest value. |
| `formatValue` | `((value: number) => string)` | Formats a value for labels, the tooltip and screen readers. Defaults to the provider's locale. |
| `series` (required) | `RadarSeries[]` |  |
| `aria-labelledby` | `string` | Id of the element that names the chart, for example a card title. |
| `description` | `string` | What a screen reader hears after the name. Defaults to a generated summary of the data. |
| `legend` | `string \| number \| bigint \| boolean \| import("react").ReactElement<unknown, string \| import("react").JSXElementConstructor<any>> \| Iterable<ReactNode> \| import("react").ReactPortal \| Promise<string \| number \| bigint \| boolean \| import("react").ReactPortal \| import("react").ReactElement<unknown, string \| import("react").JSXElementConstructor<any>> \| Iterable<ReactNode> \| null \| undefined> \| null` | The legend: `true` or a placement shows the built-in one, `false` hides it, and a node replaces it. By default it is shown below the chart when there is more than one series. |
| `labels` | `boolean` | Draws labels on the chart itself, so it can be read without the legend or the tooltip. |
| `onPointPress` | `((point: import(".").ChartPoint) => void)` | Called when a point is clicked, or activated with Enter or Space. |
| `empty` | `ReactNode` | Shown when there is no data. |
| `onRetry` | `(() => void)` | Adds a retry button to the error state. |
| `retryLabel` | `string` |  |
| `pointsLabel` | `string` | Accessible name of the list of data points. |
| `legendLabel` | `string` | Accessible name of the legend. |
| `startAngle` | `number` | Where the first axis points, in degrees clockwise from 12 o'clock. |
| `axes` (required) | `RadarAxis[]` |  |

**Parts**: `legend`, `tooltip`, `skeleton`, `empty`, `error`.

**Blocks**: `RadarChart.Root`, `RadarChart.Grid`, `RadarChart.Series`, `RadarChart.AxisLabels`.

## Radio

One option of a `RadioGroup`.

**Tokens**: `--umbra-field-description-color`, `--umbra-field-error-color`, `--umbra-field-marker-color`, `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-option-group-gap`, `--umbra-option-group-inline-gap`, `--umbra-option-group-min-option-width`, `--umbra-option-group-text-gap`, `--umbra-radio-bg`, `--umbra-radio-border`, `--umbra-radio-border-width`, `--umbra-radio-card-bg`, `--umbra-radio-card-border`, `--umbra-radio-card-description-lines`, `--umbra-radio-card-divider`, `--umbra-radio-card-media-size`, `--umbra-radio-card-min-height`, `--umbra-radio-card-padding`, `--umbra-radio-card-radius`, `--umbra-radio-card-selected-bg`, `--umbra-radio-card-selected-border`, `--umbra-radio-gap`, `--umbra-radio-invalid-border`, `--umbra-radio-mark-color`, `--umbra-radio-selected-bg`, `--umbra-radio-size`.

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label; the title of a `card` option. |
| `description` | `ReactNode` | A second line under the label. |
| `media` | `ReactNode` | An icon or a small image, shown by the `card` variant. It hides when the card is narrow. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` (required) | `string` | What the group's `value` is when this option is chosen. |
| `aria-label` | `string` | Accessible name of an option that has no visible label. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |
| `disabled` | `boolean` |  |

**Parts**: `mark`, `media`, `label`, `description`.

**Blocks**: `Radio.Root`, `Radio.Mark`, `Radio.Media`, `Radio.Label`, `Radio.Description`.

## RadioGroup

A choice of exactly one option among a few, all visible at once.

**Tokens**: `--umbra-field-description-color`, `--umbra-field-error-color`, `--umbra-field-marker-color`, `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-option-group-gap`, `--umbra-option-group-inline-gap`, `--umbra-option-group-min-option-width`, `--umbra-option-group-text-gap`, `--umbra-radio-bg`, `--umbra-radio-border`, `--umbra-radio-border-width`, `--umbra-radio-card-bg`, `--umbra-radio-card-border`, `--umbra-radio-card-description-lines`, `--umbra-radio-card-divider`, `--umbra-radio-card-media-size`, `--umbra-radio-card-min-height`, `--umbra-radio-card-padding`, `--umbra-radio-card-radius`, `--umbra-radio-card-selected-bg`, `--umbra-radio-card-selected-border`, `--umbra-radio-gap`, `--umbra-radio-invalid-border`, `--umbra-radio-mark-color`, `--umbra-radio-selected-bg`, `--umbra-radio-size`.

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The options. |
| `label` | `ReactNode` | The group's label. |
| `description` | `ReactNode` | A line under the label. |
| `error` | `ReactNode` | An error message under the options, shown with an icon. Setting it makes the group invalid. |
| `columns` | `number` | Lays the options in a grid of at most this many columns; columns drop as the group narrows. `card` options are always in a grid, of one column by default. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `string \| null` | Controlled: the `value` of the chosen option. |
| `onChange` | `((value: string) => void)` |  |
| `aria-label` | `string` | Accessible name of a group that has no visible label. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |
| `variant` | `RadioVariant` | `default`: a dot and a label. `card`: a bordered tile with a title, a description and an icon. |
| `orientation` | `"vertical" \| "horizontal"` | The direction of the options, and of the arrow keys that move between them. |
| `disabled` | `boolean` |  |
| `readOnly` | `boolean` |  |
| `invalid` | `boolean` |  |
| `required` | `boolean` |  |
| `requiredLabel` | `string` | The text of the required marker after the group label. |
| `name` | `string` | Form field name. |
| `id` | `string` |  |
| `defaultValue` | `string` |  |

**Parts**: `label`, `description`, `options`, `error`.

**Blocks**: `RadioGroup.Root`, `RadioGroup.Label`, `RadioGroup.Description`, `RadioGroup.Options`, `RadioGroup.Error`.

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

## SegmentedFilter

A row of joined segments that filters the content below it. One or several can be selected.

**Tokens**: `--umbra-segmented-filter-bg`, `--umbra-segmented-filter-border`, `--umbra-segmented-filter-fg`, `--umbra-segmented-filter-height`, `--umbra-segmented-filter-min-item-width`, `--umbra-segmented-filter-padding-x`, `--umbra-segmented-filter-radius`, `--umbra-segmented-filter-selected-bg`, `--umbra-segmented-filter-selected-border`, `--umbra-segmented-filter-selected-fg`.

| Prop | Type | Purpose |
|---|---|---|
| `all` | `boolean` | Adds a first segment that stands for "no filter". Choosing it clears the others. |
| `allLabel` | `string` | Label of the "All" segment. |
| `allCount` | `number` | Count of the "All" segment. |
| `size` | `"default" \| "small"` | `small` is for table cells and dense toolbars. Otherwise the height follows the density level. |
| `fullWidth` | `boolean` | Fills the width of its container with equal segments. |
| `disabled` | `boolean` |  |
| `aria-label` | `string` | Accessible name of the group. |
| `aria-labelledby` | `string` | Id of the element that names the group. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
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

## StatusIndicator

A status as a dot or an icon with a label, or as a coloured label.

**Tokens**: `--umbra-status-indicator-color`, `--umbra-status-indicator-gap`, `--umbra-status-indicator-size`.

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label. Without one, give `aria-label`. |
| `icon` | `ReactNode` | Replaces the icon of the `icon` variant. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `aria-label` | `string` | Names an indicator that has no visible label. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `pulse` | `boolean` | Draws attention with a slow pulse around the dot. With reduced motion the dot stays still. |
| `variant` | `"icon" \| "dot" \| "label"` | `dot`: a small shape. `icon`: the status icon. `label`: no mark, the label itself is coloured. |
| `status` | `Status` |  |
| `color` | `string` | A custom colour (any CSS colour). Replaces the colour of `status`; the shape stays. |

**Parts**: `indicator`, `label`.

**Blocks**: `StatusIndicator.Root`, `StatusIndicator.Indicator`, `StatusIndicator.Label`.

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

**Tokens**: `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-nav-font`, `--umbra-nav-gap`, `--umbra-nav-indicator-color`, `--umbra-subnav-bg`, `--umbra-subnav-end-gap`, `--umbra-subnav-gap`, `--umbra-subnav-height`, `--umbra-subnav-indicator-color`, `--umbra-subnav-padding-x`.

| Prop | Type | Purpose |
|---|---|---|
| `label` | `ReactNode` | The section name. |
| `items` | `NavItem[]` | The pages of the section. Same shape as `PrimaryNav`. |
| `end` | `ReactNode` | Free slot at the end, normally a `ShortcutBar`. Its content is never clipped. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `string` | The active item. |
| `onChange` | `((id: string) => void)` | Called with the id of the item the user chose. |
| `renderLink` | `((props: import("./nav").NavLinkProps) => ReactNode)` | Plugs in the app's router link. Defaults to a plain `<a>`. |
| `moreLabel` | `string` | Label of the overflow item. |
| `submenuLabel` | `((label: string) => string)` | Accessible name of the caret that opens an item's dropdown, from the item's label. |
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

## Tabs

Switches between views of the same content area. The panel fills the rest of the slot.

**Tokens**: `--umbra-tabs-bg`, `--umbra-tabs-border`, `--umbra-tabs-fg`, `--umbra-tabs-gap`, `--umbra-tabs-height`, `--umbra-tabs-indicator-color`, `--umbra-tabs-padding-x`, `--umbra-tabs-pill-radius`, `--umbra-tabs-radius`, `--umbra-tabs-selected-bg`, `--umbra-tabs-selected-fg`, `--umbra-tabs-underline-selected-fg`, `--umbra-tabs-vertical-max-width`.

| Prop | Type | Purpose |
|---|---|---|
| `items` | `TabsItem[]` | The tabs and their panels. Leave out to compose `Tabs.List`, `Tabs.Tab` and `Tabs.Panel` yourself. |
| `aria-label` | `string` | Accessible name of the tab list. |
| `end` | `ReactNode` | Shown after the tabs, for example an "add" button. |
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
| `minWidth` | `number` | Reserved: `Columns` has no rule that uses it yet, so it has no effect. |
| `minHeight` | `number` | Below this height a parent `Stack` may collapse the child to its header. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |

**Parts**: `indicator`, `icon`, `count`, `close`, `list`, `tab`, `panel`.

**Blocks**: `Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`.

## Tag

A small label chip: a category, a status code or a value with an icon.

**Tokens**: `--umbra-tag-bg`, `--umbra-tag-border`, `--umbra-tag-fg`, `--umbra-tag-font`, `--umbra-tag-gap`, `--umbra-tag-padding`, `--umbra-tag-radius`, `--umbra-tag-stripe-width`.

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label. |
| `icon` | `ReactNode` | A leading icon, avatar or flag. |
| `onRemove` | `(() => void)` | Shows a remove button. |
| `removeLabel` | `string` | Accessible name of the remove button; a text label is added to it ("Remove Region 2"). |
| `loading` | `boolean` | Shows a placeholder of the tag's size. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `tone` | `Tone` | What the colour means. |
| `variant` | `"subtle" \| "solid" \| "outline"` | `outline`: coloured border. `subtle`: tinted fill. `solid`: filled, for short status codes. |
| `size` | `"default" \| "small"` | `small` is for use inside table cells. |
| `color` | `string` | A custom colour (any CSS colour). Replaces `tone`. |
| `stripe` | `(string & {}) \| Tone` | A second colour on the trailing edge: a tone name or any CSS colour. |
| `stripeLabel` | `string` | What the stripe means, for screen readers and as a tooltip. |

**Parts**: `icon`, `label`, `remove`, `skeleton`.

**Blocks**: `Tag.Root`, `Tag.Icon`, `Tag.Label`, `Tag.Remove`.

## TextField

A box for typing one line of text, or several with `multiline`.

**Tokens**: `--umbra-field-description-color`, `--umbra-field-error-color`, `--umbra-field-marker-color`, `--umbra-focus-color`, `--umbra-icon-size`, `--umbra-option-group-gap`, `--umbra-option-group-inline-gap`, `--umbra-option-group-min-option-width`, `--umbra-option-group-text-gap`, `--umbra-text-field-affix-color`, `--umbra-text-field-bg`, `--umbra-text-field-border`, `--umbra-text-field-fg`, `--umbra-text-field-height`, `--umbra-text-field-invalid-border`, `--umbra-text-field-padding-x`, `--umbra-text-field-placeholder`, `--umbra-text-field-radius`, `--umbra-text-field-width`.

| Prop | Type | Purpose |
|---|---|---|
| `prefix` | `ReactNode` | Text or an icon before the text. |
| `suffix` | `ReactNode` | Text, an icon or a small control after the text. |
| `clearable` | `boolean` | Shows a button that empties the field while it holds text. |
| `clearLabel` | `string` | Accessible name of the clear button. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `string` | Controlled text. |
| `onChange` | `((value: string) => void)` |  |
| `aria-label` | `string` | Accessible name of a field that has no `FormField` label. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |
| `size` | `"default" \| "small"` | `small` is for use inside table cells. Otherwise the height follows the density level. |
| `disabled` | `boolean` |  |
| `rows` | `number` | Visible lines of a `multiline` field. |
| `readOnly` | `boolean` | Focusable and selectable, but cannot be changed. |
| `invalid` | `boolean` | Shows the danger border and an error icon. Put the message in the `error` of a `FormField`. |
| `required` | `boolean` |  |
| `name` | `string` | Form field name. |
| `id` | `string` |  |
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

**Tokens**: `--umbra-field-description-color`, `--umbra-field-error-color`, `--umbra-field-marker-color`, `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-option-group-gap`, `--umbra-option-group-inline-gap`, `--umbra-option-group-min-option-width`, `--umbra-option-group-text-gap`, `--umbra-toggle-bg`, `--umbra-toggle-border`, `--umbra-toggle-gap`, `--umbra-toggle-height`, `--umbra-toggle-mark-color`, `--umbra-toggle-radius`, `--umbra-toggle-selected-bg`, `--umbra-toggle-selected-thumb-bg`, `--umbra-toggle-small-height`, `--umbra-toggle-thumb-bg`, `--umbra-toggle-thumb-inset`, `--umbra-toggle-width`.

| Prop | Type | Purpose |
|---|---|---|
| `children` | `ReactNode` | The label. |
| `description` | `ReactNode` | A second line under the label. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `value` | `string` | The form value when on. |
| `onChange` | `((checked: boolean) => void)` |  |
| `aria-label` | `string` | Accessible name of a toggle that has no visible label. |
| `className` | `string` |  |
| `style` | `import("react").CSSProperties` |  |
| `size` | `"default" \| "small"` | `small` is for use inside table cells and dense toolbars. Otherwise the size follows the density level. |
| `disabled` | `boolean` |  |
| `checked` | `boolean` | Controlled state. |
| `defaultChecked` | `boolean` |  |
| `readOnly` | `boolean` | Focusable, but cannot be changed. |
| `name` | `string` | Form field name. |
| `id` | `string` |  |
| `labelPosition` | `"start" \| "end"` | The side of the switch the label is on. |

**Parts**: `track`, `label`, `description`.

**Blocks**: `Toggle.Root`, `Toggle.Track`, `Toggle.Label`, `Toggle.Description`.

## Tooltip

A short description of a control, shown on hover and on keyboard focus. Text only: it never holds anything the user could interact with.

**Tokens**: `--umbra-tooltip-bg`, `--umbra-tooltip-border`, `--umbra-tooltip-fg`, `--umbra-tooltip-max-width`, `--umbra-tooltip-radius`.

| Prop | Type | Purpose |
|---|---|---|
| `children` (required) | `ReactNode` | The control the tooltip describes: any umbra-ui control, or a plain focusable element. |
| `content` | `ReactNode` | The text. Nothing is shown when it is empty (and there is no `title` or `shortcut`). |
| `title` | `ReactNode` | A heading above the text, for a rich tooltip. |
| `shortcut` | `string` | Id of a shortcut in the provider's list: its keys are shown as a hint. |
| `placement` | `OverlayPlacement` |  |
| `delay` | `number` | Milliseconds before it shows on hover. Keyboard focus shows it at once. |
| `offset` | `number` | Gap between the control and the tooltip, in pixels. |
| `open` | `boolean` | Controlled state. |
| `defaultOpen` | `boolean` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `disabled` | `boolean` | Never shows. |
| `wrap` | `boolean` | Puts the control in a focusable wrapper that carries the tooltip, so it also shows for a control that takes no pointer or focus events. Defaults to the control's own `disabled` prop. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` | On the tooltip itself. |
| `style` | `CSSProperties` |  |

**Parts**: `title`, `body`, `hint`.

**Blocks**: none.

## TopBar

The brand-coloured bar at the top: where the user is, the main sections, and the one primary action.

**Tokens**: `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-nav-font`, `--umbra-nav-gap`, `--umbra-nav-indicator-color`, `--umbra-subnav-indicator-color`, `--umbra-topbar-action-gap`, `--umbra-topbar-action-size`, `--umbra-topbar-bg`, `--umbra-topbar-fg`, `--umbra-topbar-gap`, `--umbra-topbar-height`, `--umbra-topbar-logo-size`, `--umbra-topbar-padding-x`.

| Prop | Type | Purpose |
|---|---|---|
| `logo` | `ReactNode` | App or entity mark. |
| `nav` | `ReactNode` | A `PrimaryNav`. |
| `actions` | `ReactNode` | `IconButton`s. They collapse into one menu when space is short. |
| `context` | `ReactNode` | A two-line status block. Hides first when space is short. |
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

**Parts**: `start`, `logo`, `nav`, `actions`, `search`, `context`, `primaryAction`.

**Blocks**: `TopBar.Root`, `TopBar.Start`, `TopBar.Logo`, `TopBar.Nav`, `TopBar.End`, `TopBar.Actions`, `TopBar.Search`, `TopBar.Context`, `TopBar.PrimaryAction`.

## TrendArrow

The direction of a change: up, down or flat.

**Tokens**: `--umbra-trend-arrow-bad`, `--umbra-trend-arrow-gap`, `--umbra-trend-arrow-good`, `--umbra-trend-arrow-neutral`.

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
| `tone` | `TrendTone` | The colour of the arrow. |
| `direction` (required) | `TrendDirection` |  |

**Parts**: `icon`, `value`.

**Blocks**: `TrendArrow.Root`, `TrendArrow.Icon`, `TrendArrow.Value`.

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

## ValuePill

A value coloured by where it falls on a five-step ramp.

**Tokens**: `--umbra-value-pill-bg`, `--umbra-value-pill-fg`, `--umbra-value-pill-font`, `--umbra-value-pill-min-width`, `--umbra-value-pill-padding`, `--umbra-value-pill-radius`.

| Prop | Type | Purpose |
|---|---|---|
| `value` (required) | `number \| null` | The value. `null` or `undefined` shows `emptyText` in a neutral pill. |
| `format` | `((value: number) => ReactNode)` | Turns the value into what is shown: `(v) => v.toFixed(2)`, or a grade letter. |
| `showLevel` | `boolean` | Adds a small bar marker of the level, for readers who cannot tell the colours apart. |
| `levelLabel` | `((level: number, steps: number) => string)` | What a screen reader hears for the marker. |
| `emptyText` | `ReactNode` | Shown when there is no value. |
| `loading` | `boolean` | Shows a placeholder of the pill's size. |
| `parts` | `see Parts` | Replace or hide named pieces. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `size` | `"default" \| "small" \| "large"` | `small` is for use inside table cells. |
| `shape` | `"square" \| "circle" \| "pill"` | `square` for values in dense rows, `circle` for grades of one or two characters. |
| `min` | `number` | The bottom and top of the scale, split into five equal bands. |
| `max` | `number` |  |
| `thresholds` | `readonly number[]` | Ascending boundaries, at most four. A value at a boundary belongs to the band above it. |
| `ramp` | `"higher-is-better" \| "lower-is-better"` | Which end of the scale gets the top of the ramp. |

**Parts**: `value`, `level`, `skeleton`.

**Blocks**: `ValuePill.Root`, `ValuePill.Value`, `ValuePill.Level`.

## VerticalNav

Side navigation for a modal, a settings screen or one column of a page.

**Tokens**: `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-icon-size`, `--umbra-nav-font`, `--umbra-nav-gap`, `--umbra-nav-indicator-color`, `--umbra-subnav-indicator-color`, `--umbra-vertical-nav-bg`, `--umbra-vertical-nav-current-bg`, `--umbra-vertical-nav-current-fg`, `--umbra-vertical-nav-fg`, `--umbra-vertical-nav-gap`, `--umbra-vertical-nav-padding`, `--umbra-vertical-nav-radius`, `--umbra-vertical-nav-rail-below`, `--umbra-vertical-nav-rail-width`, `--umbra-vertical-nav-row-height`, `--umbra-vertical-nav-stripe-width`, `--umbra-vertical-nav-width`.

| Prop | Type | Purpose |
|---|---|---|
| `items` | `(VerticalNavItem \| VerticalNavSection)[]` | The entries: items, groups (an item with `items`) and sections (`{ type: 'section', label, items }`). |
| `header` | `ReactNode` | Fixed above the list, for example a title or a search field. |
| `footer` | `ReactNode` | Fixed below the list. |
| `collapsible` | `boolean` | Shows the button that lets the user switch to the icon rail and back. |
| `parts` | `see Parts` | Replace or hide named pieces. `item` applies to every item, also inside groups and sections. |
| `value` | `string` | The current item. |
| `onChange` | `((id: string) => void)` | Called with the id of the item the user chose. |
| `renderLink` | `((props: NavLinkProps) => ReactNode)` | Plugs in the app's router link. Defaults to a plain `<a>`. |
| `aria-label` | `string` | Accessible name of the navigation landmark. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |
| `collapsed` | `boolean` | Icon-only rail (controlled). Each label stays as the accessible name of its item. |
| `size` | `number \| "content"` | Share of the parent's space: a weight, or `"content"` to take the size of the content. Default 1. |
| `label` | `string` | Tab label when a parent `Columns` shows one child at a time. |
| `priority` | `number` | Which child gives way first when space runs out. Higher stays longer; ties give way from the end. Default 0. |
| `minWidth` | `number` | Reserved: `Columns` has no rule that uses it yet, so it has no effect. |
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
