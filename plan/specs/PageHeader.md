# PageHeader

**Tier** 1 · **Group** Shell · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

The header of a page or of a detail pane: what it shows, a few facts about it, and its actions. Absorbs EntityBanner and MessageHeader.

## Not for

- The header of a card: use `Card` (`title`, `subtitle`, `actions`).
- A heading for one section of content: use `SectionTitle`.
- A message about the data: use `Banner`.
- App-level navigation: use `TopBar`, `SubNav` or `VerticalNav`.

## Evidence

A large mark, a big title, a line under it, and four labelled facts at the far end (5, 30); a small avatar, the sender above a bold title and a time at the far end, at the top of a reading pane (13, 14, 15); a filled band with a mark, a name, a tag and labelled facts divided by vertical rules (13, 15, 16); a profile header with a portrait and blocks of facts (6, 31).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `breadcrumbs` | the path to this page, as a navigation landmark | shown when `breadcrumbs` is set |
| `back` | a back button before the title | shown when `onBack` is set |
| `media` | avatar, entity icon or image | shown when `media` is set |
| `overline` | a small line above the title | shown when `overline` is set |
| `title` | the heading, with `tags` after it | shown |
| `subtitle` | a line under the title | shown when `subtitle` is set |
| `meta` | a row of facts | shown when `meta` is set |
| `actions` | trailing controls | shown when `actions` is set |
| `tabs` | a tab list along the bottom edge | shown when `tabs` is set |

Back button, media, titles and meta share one row (`content`); that row and the actions share the `bar`.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `tone` | `default`, `tinted`, `band` | No surface; a panel in the context tint; a fill in the brand colour or `bandColor` |
| `size` | `default`, `compact` | `compact` is for a detail pane inside a card: smaller title and media |

On a band the text is white or near-black, whichever has more contrast with the band (`textColourOn`), the second-level text is at full strength, and focus rings take the text colour.

## Customisation

### 1. Tokens

`--umbra-page-header-bg`, `--umbra-page-header-fg`, `--umbra-page-header-border`, `--umbra-page-header-padding`, `--umbra-page-header-radius`, `--umbra-page-header-title-font`, `--umbra-page-header-media-size` (56px; a control's height when compact), `--umbra-page-header-media-size-small` (32px).

Defaults for what is inside, as private properties, never as public tokens: the media takes the header's size (`--avatar-size`, `--entity-icon-size`), and on a band the focus rings and a badge's ring take a colour that shows on it (`--focus-color`, `--badge-ring`). The app's own value of the global token, set on any ancestor, wins over these defaults (2026-10-11, `plan/decisions/07-customisation.md`, "Tokens"). So `--umbra-avatar-size`, `--umbra-entity-icon-size`, `--umbra-focus-color` or `--umbra-badge-ring` set by the app also apply inside the header.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `title` | node | — | The heading |
| `subtitle` | node | — | |
| `overline` | node | — | |
| `media` | node | — | An `Avatar` or `EntityIcon` inside takes the header's media size |
| `meta` | `{ label, value }[]` \| node | — | Labelled facts become a description list with rules between; a node is shown as it is |
| `tags` | node | — | After the title |
| `actions` | node | — | Trailing controls. They move into an overflow menu when they do not fit. |
| `moreLabel` | string | "More actions" | Name of the overflow menu button |
| `onBack` / `backLabel` | function / string | — / "Back" | Shows the back button |
| `breadcrumbs` | `{ label, href? }[]` | — | The last item is the current page |
| `breadcrumbsLabel` | string | "Breadcrumb" | Name of the landmark |
| `renderLink` | function | plain `<a>` | The app's router link, for the breadcrumbs |
| `tabs` | node | — | |
| `tone` | see above | `default` | |
| `bandColor` | hex or `rgb()` colour | brand | |
| `size` | see above | `default` | |
| `headingLevel` | 1–6 | 1 | |

### 3. Parts

`breadcrumbs`, `back`, `media`, `overline`, `title`, `subtitle`, `meta`, `actions`, `tabs`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`PageHeader.Root`, `PageHeader.Breadcrumbs`, `PageHeader.Bar`, `PageHeader.Content`, `PageHeader.Back`, `PageHeader.Media`, `PageHeader.Titles`, `PageHeader.Overline`, `PageHeader.Title`, `PageHeader.Subtitle`, `PageHeader.Meta`, `PageHeader.Actions`, `PageHeader.Tabs`.

## Behaviour as space shrinks

The header measures its main row and takes one step each time the row does not fit. It takes them back when it gets wider. The number of steps taken is on the root as `data-shrink`.

| Step | Result |
|---|---|
| 1 | `meta` hides |
| 2 | `actions` move into an overflow menu behind a "more" button (`moreLabel`), as in a card header |
| 3 | `subtitle` hides |
| 4 | `media` shrinks to the small size |
| then | the title truncates with an ellipsis |

Breadcrumb items truncate, the current page last. The header never overflows its container, and its height is its content's: `Page` fixes it above the content.

## Interaction and accessibility

- The title is a heading of `headingLevel`. Use 1 for the page, and a lower level for a detail pane.
- The breadcrumbs are a `nav` landmark with an ordered list; the last item has `aria-current="page"` and is not a link.
- The back button is an icon button named by `backLabel`.
- Tab order follows the reading order: breadcrumbs, back, actions, tabs.
- The root is a plain element, not a `header` landmark: a page has one banner, the `TopBar`.

## Open questions

None.

Resolved 2026-10-10:

- One component for the page header, the entity band and the message header; the differences are `tone`, `size` and which pieces are set.
- Actions no longer wrap under the titles (integration pass). The wrap cost a whole line of height in a layout where the page cannot scroll, and still failed when the actions were wider than the header. Instead they move into an overflow menu at the same step (2), after the meta row hides and before the subtitle does. Taking that step later was tried and rejected: the subtitle and the media then gave way first without making room for the actions, so a narrow header lost all three. The header is always one line of titles high.
- `meta` hides as a whole; it does not drop facts one by one.
- `bandColor` takes hex and `rgb()` only, like the card's band.
- The media size belongs to the header: it sets the size of an `Avatar` or `EntityIcon` inside, whatever their own `size`.
- `tabs` is a node; the `Tabs` component is built separately.
- No `sticky` prop: `Page` keeps the header above the content, and inside a card it goes in the toolbar part or above the body.
- No loading state of its own: pass skeletons as `title` and `media` while a page loads.
- The up / down stepper beside the mark (5, 30) belongs to `EntitySwitcher`. Placement (decided 2026-10-11, Milestone 2): the switcher is the header's `title`, with `stepperPosition="start"` and items without icons, and the mark stays in `media`: `<PageHeader media={<EntityIcon … />} title={<EntitySwitcher … stepperPosition="start" />} />`. The switcher inherits the title's font and colour, so the heading reads as before and its text is the entity's name. No change to the header was needed: when the header narrows, its last step lets the title shrink, and the switcher inside then takes its own steps (name cut, steppers hidden).

Resolved 2026-10-11 (review 2):

- The back button shows its name as a tooltip, as any icon-only button does (F31).
