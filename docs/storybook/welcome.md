# umbra-ui

React components for full-window, data-dense applications: dashboards, consoles, back-office tools.

- **The page never scrolls.** The app fills the window; only regions inside cards scroll.
- **Components fill their slot** and show less as space shrinks, instead of overflowing.
- **Its own dark look**, with a brand colour and a context tint set by your app.
- **Three density levels**, set once.
- **Customisable in four layers**, the same for every component: tokens, props, parts, blocks.

The toolbar above every story switches the **density** and the **context tint**.

## Guides

| Guide                                                                 | Read it for                                                            |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [Getting started](?path=/docs/guides-getting-started--docs)           | Install, the provider, the frame, browser support, server rendering    |
| [Layout](?path=/docs/guides-layout--docs)                             | How space is shared, and what happens as it shrinks                    |
| [Theming](?path=/docs/guides-theming--docs)                           | Brand, context, density, tokens, fonts, icons, direction               |
| [Customisation](?path=/docs/guides-customisation--docs)               | The four layers, router links, translating built-in strings            |
| [Recipes](?path=/docs/guides-recipes--docs)                           | Thirteen whole screens, from a first page to a table with bulk actions |
| [Customisation tables](?path=/docs/guides-customisation-tables--docs) | Every component's tokens, props, parts and blocks (generated)          |

## Components

Each group in the sidebar holds one entry per component, with a story for every variant and state.

| Group                                                       | Holds                                                                                              |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [Pages](?path=/story/pages-overview--overview)              | Three whole screens built from the components: an overview, a list with its detail, a table        |
| [Foundation](?path=/story/foundation-umbraprovider--scopes) | `UmbraProvider`, `UmbraScope` and the tokens                                                       |
| [Layout](?path=/story/layout-page-layouts--three-columns)   | `AppShell`, `Page`, `Columns`, `Stack`, `Slot`, `Card`, `SectionTitle`, `ScrollArea`, `Accordion`  |
| [Shell](?path=/story/shell-app-shell--full-screen)          | `TopBar`, `PrimaryNav`, `SubNav`, `VerticalNav`, `PageHeader`, `PrimaryAction` and the rest        |
| [Basics](?path=/story/basics-buttons--buttons)              | `Button`, `IconButton`, `Skeleton`                                                                 |
| [Data](?path=/story/data-datatable--ranking)                | `DataTable`, `List`, `KeyValue`, `StatValue`, `SummaryTile`, `Tag`, `Badge`, `Avatar`, `Banner`, … |
| [Inputs](?path=/story/inputs-textfield--states)             | `TextField`, `SearchField`, `Select`, `Checkbox`, `Radio`, `Toggle`, `FormField`, `Tabs`, …        |
| [Overlays](?path=/story/overlays-modal--small)              | `Modal`, `Popover`, `Menu`, `Tooltip`, `CommandPalette`, `ActionBar`                               |
| [Meters](?path=/story/meters-progressbar--variants)         | `ProgressBar`, `LevelMeter`                                                                        |
| [Charts](?path=/story/charts-linechart--variants)           | `LineChart`, `BarChart`, `DonutChart`, `RadarChart`, from `umbra-ui/charts`                        |

## More

- The source, the three example apps and the issue tracker: [github.com/asafmor/umbra-ui](https://github.com/asafmor/umbra-ui).
- What each release changed: the [changelog](https://github.com/asafmor/umbra-ui/blob/main/CHANGELOG.md).
