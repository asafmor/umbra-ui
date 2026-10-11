# Browser checks by hand

The automated tests run in Chromium only. Firefox and Safari are supported from the minimum versions in
the [README](../README.md#browser-support) without automated tests, so before a release a person opens
the stories below in both and looks. It takes about twenty minutes per browser.

What a machine already checks: `npm run lint` and `npm run check:package` fail when the stylesheet or
the code uses a feature newer than the minimums without a fallback (`scripts/check-browsers.mjs`, which
lists each newer feature and what happens without it: `node scripts/check-browsers.mjs --list`).

## Set-up

| What               | How                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Storybook          | `npm run storybook`, then `http://localhost:6006/?path=/story/<id>` with an id from the tables |
| Without a checkout | The published Storybook: `https://asafmor.github.io/umbra-ui/?path=/story/<id>`                |
| Browsers           | The current Firefox and Safari, and the oldest of each you can reach (minimums: 121 and 16.2)  |
| Window             | 1280x720, then 1024x600, then narrower than 1024 for the stories with tabs                     |
| Toolbar            | Density, context tint and direction are in the Storybook toolbar                               |
| Compare with       | The same story in Chrome, side by side                                                         |

Report a difference as an issue with the browser, its version, the story id and a capture. A difference
that is in the list of `check-browsers.mjs --list` is known: check that it is no worse than its note.

## 1. The three pages

| Story id                                 | Look at                                                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pages-overview--overview`               | The page fills the window and never scrolls, at each window size and each density                          |
| `pages-list-and-detail--list-and-detail` | Selecting a row fills the detail pane; its modal opens and closes; below 1024 wide the columns become tabs |
| `pages-table--table`                     | Sorting, selecting rows, and the action bar that appears                                                   |

On each: card tints and borders have colour (they come from `color-mix()`), a hovered row and a pressed
button change shade, cards collapse to their headers when the window gets low, and the nav moves items
into its "more" menu when it gets narrow.

## 2. Overlays and their layering

| Story id                                                     | Look at                                                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `overlays-popover--placements`                               | Each popover sits beside its trigger and flips at the window edge                              |
| `overlays-tooltip--placements`                               | Tooltips appear on hover and on keyboard focus, above everything                               |
| `overlays-menu--submenus`                                    | A submenu opens beside its row and stays inside the window                                     |
| `inputs-select--open`, `inputs-select--searchable`           | The list opens under the field, scrolls inside, and typing filters                             |
| `overlays-modal--nested`                                     | The second modal is above the first; Escape closes one at a time; focus returns to its trigger |
| `overlays-modal--form`                                       | A select and a tooltip inside the modal open above it, not behind                              |
| `overlays-modal--drawer-end`, `overlays-modal--drawer-start` | The drawer slides in from its side; the scrim covers the page                                  |
| `overlays-commandpalette--default`                           | Opens with its shortcut, above a modal too; arrow keys keep the active row in view             |

## 3. Table

| Story id                                | Look at                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `data-datatable--virtualize-and-sticky` | Scroll fast both ways: the header and the pinned columns stay put, with no gap, jump or blank rows |
| `data-datatable--virtualised`           | Scroll to the end and back; the scrollbar thumb moves evenly; arrow keys move the focused cell     |
| `data-datatable--virtualised-groups`    | Group headers stick while their rows scroll under them                                             |
| `data-datatable--narrowing`             | Columns hide by priority as the window narrows; none is cut                                        |
| `data-datatable--select-in-cell`        | A select inside a cell opens above the table and is not clipped                                    |
| `data-datatable--live-updates`          | A changed cell flashes once                                                                        |

## 4. Scrollbars

| Story id                           | Look at                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `layout-scrollarea--axes`          | Thin scrollbars in the library's colours (Firefox by `scrollbar-color`, Safari by `::-webkit-scrollbar`) |
| `layout-scrollarea--fades`         | The fade at an edge shows only while there is more to scroll that way                                    |
| `layout-accordion--limited-height` | Opening a panel: a scrollbar may show during the transition (known), and must be gone after it           |
| `overlays-modal--long-body`        | The body scrolls, the header and footer do not                                                           |

On macOS, check with "Show scroll bars: Always" too: a scrollbar that takes space must not push content
out of a card.

## 5. Focus rings

| Story id                                              | Look at                                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pages-overview--overview`                            | Tab through the page: every stop shows a ring, none is clipped by its card, a click shows none |
| `inputs-textfield--states`, `inputs-checkbox--states` | The ring of a field, a checkbox, a radio and a toggle                                          |
| `data-datatable--selection`                           | The ring of a cell and of a row checkbox, inside the table's edges                             |

Safari: turn on "Press Tab to highlight each item on a webpage" (Settings, Advanced), or links and
buttons are skipped by Tab.

## 6. Right to left

Open with the toolbar's direction set to right to left, or add `&globals=direction:rtl` to the address.

| Story id                                                       | Look at                                                                                 |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `pages-overview--overview`                                     | The whole page mirrors; back and chevron icons point the other way                      |
| `meters-progressbar--right-to-left`                            | The bar fills from the right, and its gradient runs the same way                        |
| `layout-card--right-to-left`                                   | The collapse caret turns the right way; actions are at the left                         |
| `shell-verticalnav--right-to-left`                             | The active stripe is on the right; a collapsed rail's badges sit on the correct corner  |
| `overlays-modal--drawer-start-right-to-left`                   | The "start" drawer slides in from the right                                             |
| `data-datatable--right-to-left`                                | Pinned columns are on the right; horizontal scroll starts from the right                |
| `overlays-menu--right-to-left`, `inputs-select--right-to-left` | Submenus open to the left; check marks and hints swap sides                             |
| `charts-right-to-left--all-charts`                             | Axes and legends mirror; the tooltip stays beside its point                             |
| `foundation-umbraprovider--locale`                             | A right-to-left locale alone (no `dir` on the page) turns the direction, in Firefox too |

## 7. Reduced motion

Turn on the system setting (macOS: Accessibility, Display, Reduce motion; Firefox elsewhere:
`ui.prefersReducedMotion` = 1 in `about:config`).

| Story id                                                         | Look at                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `foundation-umbraprovider--reduced-motion`                       | Motion is off in this story whatever the system says: use it to see the still version |
| `layout-accordion--variants`, `layout-card--controlled-collapse` | Panels and cards open at once, with no slide                                          |
| `overlays-modal--drawer-end`                                     | The drawer appears without sliding                                                    |
| `charts-linechart--variants`                                     | Lines and bars are drawn at once                                                      |
| `data-datatable--live-updates`                                   | No flash on a changed cell                                                            |

## 8. Fonts and text

| Story id                                              | Look at                                                                                                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages-overview--overview`                            | Figtree for text and Barlow Condensed for headings and nav, with no faux bold; numbers in columns line up                                    |
| `data-datatable--numeric`                             | Tabular figures: digits of a column share their width                                                                                        |
| `inputs-checkbox--states`, `inputs-textfield--states` | A checkbox sits at the middle of its first line; a multiline field has its padding (both use the `lh` unit, which Safari 16.2 and 16.3 lack) |
| `data-emptystate--variants`                           | The block is centred in its card (Safari before 17.6 takes a fallback)                                                                       |

## 9. Charts

| Story id                                                                   | Look at                                                                                                                                                                                                     |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `charts-linechart--interaction`                                            | Hover and arrow keys show the tooltip beside its point, not cut by the card, in a card and in a modal                                                                                                       |
| `layout-content-height--flowing`, `layout-content-height--panel-and-modal` | A chart in flowing content, a panel and a modal is 240px high, not collapsed. Safari before 17 has a fallback for `height="content"` only: a `fill` chart without a height around it is the case to look at |
| `charts-linechart--short-plot`                                             | Labels thin out as the plot gets low                                                                                                                                                                        |

The chart tooltip uses the Popover API where the browser has it (Firefox 125, Safari 17). In an older
one it is a fixed element: check that it is placed beside its point and is whole.
