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
| `submenuLabel` | `((label: string) => string)` | Accessible name of the caret that opens an item's dropdown, from the item's label. |
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
| `submenuLabel` | `((label: string) => string)` | Accessible name of the caret that opens an item's dropdown, from the item's label. |
| `aria-label` | `string` | Accessible name of the navigation landmark. |
| `className` | `string` |  |
| `style` | `CSSProperties` |  |

**Parts**: `indicator`, `more`, `label`, `item`, `end`.

**Blocks**: `SubNav.Root`, `SubNav.Label`, `SubNav.Item`, `SubNav.Menu`, `SubNav.End`.

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
