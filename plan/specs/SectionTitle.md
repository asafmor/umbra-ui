# SectionTitle

**Tier** 0 · **Group** Layout · **Status** spec approved 2026-10-10

## Purpose

A heading for one section of content inside a card or page, with optional controls on the same line.

## Not for

- The title of a card: use `Card`'s `title`.
- The title of a page: use `PageHeader`.

## Evidence

The source uses four styles: condensed uppercase (1, "MESSAGES"), pink underlined link (1, "News", "League Table"), white underlined, and sentence-case with a rule under it (14, "Purpose"). The library keeps three and gives each one meaning.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `title` | text | shown |
| `count` | a number after the title | hidden |
| `actions` | trailing controls | hidden |

## Variants and states

| `variant` | Look | Use |
|---|---|---|
| `heading` (default) | condensed, uppercase | a plain section |
| `link` | accent colour, underlined | the title opens a fuller view of the section |
| `rule` | body font, sentence case, a rule under it | sections of long-form content |

`link` is chosen automatically when `href` or `onOpen` is set.

## Customisation

### 1. Tokens

`--umbra-section-title-font`, `--umbra-section-title-color`, `--umbra-section-link-color`, `--umbra-section-rule-color`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The title |
| `variant` | see above | `heading` | |
| `headingLevel` | 2–6 | 3 | Heading level |
| `href` / `onOpen` | string / function | — | Makes it a link |
| `count` | number | — | |
| `actions` | node | — | |
| `moreLabel` | string | "More actions" | Accessible name of the overflow menu button |

### 3. Parts

`title`, `count`, `actions`.

### 4. Blocks

None; it is small enough to rebuild from text and a `Link`.

## Behaviour as space shrinks

`actions` move into an overflow `Menu`, then the title truncates.

## Interaction and accessibility

- Renders a real heading element at `headingLevel`.
- The link variant keeps its underline, so it is not identified by colour alone.
- The overflow of `actions` is a real menu, as in `CardHeader`: each button is a `menuitem`.

## Open questions

None.

Resolved 2026-10-10: `href` renders a plain `<a>`, not a router link (approved after Milestone 0).
