# Banner

**Tier** 1 · **Group** Data · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A message band inside a card or page: a notice, a warning, or an insight about the data beside it. Absorbs InsightBanner, RecommendationBand, Callout, Alert and NotificationPrompt.

## Not for

- A message that floats over the page and leaves by itself: use `Toast`.
- A message that blocks the page until answered: use `Modal`.
- The error or empty state of a data component: use its `error` / `empty` prop, or `EmptyState`.
- A coloured header band that names an entity: use `PageHeader` or a `Card` with `headerStyle="band"`.
- One word of status: use `Tag` or `StatusIndicator`.

## Evidence

Green strip with an icon and truncated text in a card (1); dark-green strip with an icon, a bold title and a muted second text on one line (5); filled band with text and actions on the right (15); an inline prompt with a title, a text line, a primary button and a dismiss button (36); feedback callouts pinned to the bottom of cards, one tinted with a border and one neutral with a border only, one wrapping to two lines (39).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `icon` | the tone's icon, or the `icon` prop | shown |
| `title` | bold headline | shown when `title` is set |
| `description` | the children | shown when there are children |
| `actions` | buttons or links | shown when `actions` is set |
| `dismiss` | icon button | shown when `dismissible` |

`title` and `description` sit inside the `content` block, which takes the space the others leave.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `tone` | `info` (default), `success`, `warning`, `danger`, `neutral`, `accent` | Colour and default icon: circled i, circled check, triangle, octagon, speech bubble, light bulb. The icon shape is the cue that does not depend on colour. |
| `variant` | `subtle` (default), `solid`, `outline` | Tinted fill with a soft border; filled with the tone colour; border only |
| `emphasis` | `default`, `insight` | `insight` adds a stripe on the leading edge and squares that edge (source: 1, 39) |
| `compact` | boolean | One line in the label font; title and description share it |

States: open, dismissed (not rendered).

Text contrast, computed for the ten card surfaces (default and tinted card on each of the four tints, the neutral card, the popover):

| Pair | Lowest ratio | Where |
|---|---|---|
| Text on a `subtle` fill, any tone | 11.66 | warning, tinted green card |
| Tone icon on its `subtle` fill | 3.87 | danger, tinted green card |
| Tone icon or border on the card (`outline`) | 4.67 | danger, tinted green card |
| Dark text on a `solid` fill | 5.44 | danger |
| Light text on the `solid` accent fill (fixed violet) | 7.55 | — |

`outline` text is the card's own primary text. The accent tone uses the accent text colour for `subtle` and `outline`, and the fixed violet for `solid`.

## Customisation

### 1. Tokens

`--umbra-banner-<tone>-color` (six), `--umbra-banner-bg`, `--umbra-banner-fg`, `--umbra-banner-solid-fg`, `--umbra-banner-border`, `--umbra-banner-icon-color`, `--umbra-banner-subtle-strength` (share of the tone colour in the subtle fill, 16%), `--umbra-banner-radius`, `--umbra-banner-padding-x`, `--umbra-banner-padding-y`, `--umbra-banner-row-height` (follows the density level), `--umbra-banner-stripe-width`, `--umbra-banner-focus-color` and `--umbra-banner-focus-offset` (the ring of controls inside a `solid` banner), `--umbra-banner-dismiss-size`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `title` | node | — | Bold headline |
| `children` | node | — | The description |
| `tone` | see above | `info` | |
| `variant` | see above | `subtle` | |
| `emphasis` | `default` \| `insight` | `default` | |
| `compact` | boolean | `false` | One-line variant |
| `icon` | node \| `null` | the tone's icon | `null` hides it |
| `actions` | node | — | Trailing controls |
| `dismissible` | boolean | `false` | Shows the dismiss button |
| `onDismiss` | function, no arguments | — | Called when the dismiss button is pressed |
| `dismissLabel` | string | "Dismiss" | Accessible name of the dismiss button |
| `open` / `defaultOpen` | boolean | — / `true` | Controlled or uncontrolled visibility |
| `maxLines` | number | — | Clamps the description |
| `live` | `polite` \| `assertive` \| `off` | `assertive` for `danger`, else `polite` | Chooses the role: `status`, `alert`, or none |

### 3. Parts

`icon`, `title`, `description`, `actions`, `dismiss`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`Banner.Root`, `Banner.Icon`, `Banner.Content`, `Banner.Title`, `Banner.Description`, `Banner.Actions`, `Banner.Dismiss`.

## Behaviour as space shrinks

The banner takes the full width of its container, also as a child of a row (a `Slot`, a card footer). It measures its own content box (a container query: the width inside its padding and border), in units of its font size, so the steps follow the density level. With the default padding (12px a side) and border (1px), the outer width is 26px more.

| Step | Trigger | Result |
|---|---|---|
| 0 | Any width | Title and description wrap; the description clamps to `maxLines` with an ellipsis when set. The banner never overflows. |
| 1 | Content box of 26em or less (416px at the default density; 442px of outer width) | `actions` move below the text, in line with it. The dismiss button stays on the first row. |
| 2 | Content box of 14em or less (224px; 250px outer) | The `icon` hides |

`compact` stays on one line at every width: the description truncates first, then the title; the actions stay on the row and never wrap to a second one; the icon hides at step 2. Below the width of its actions (about 110px with one small button and a dismiss button) the actions are cut off at the banner's edge.

## Interaction and accessibility

- The role follows `live`: `status` (announced politely) by default, `alert` for the `danger` tone, none with `live="off"`. Use `live="off"` for a banner that is part of the page from the start and is not news.
- The tone is never colour alone: each tone has its own icon, and the text says what happened. When the icon is hidden (`icon={null}`, or step 2), the text and the role carry it.
- The dismiss button is an icon button named by `dismissLabel`; `Enter` and `Space` activate it. Actions and the dismiss button are in the tab order, in that order.
- After a dismissal the banner is removed, and the focus it held goes where Tab would have gone: to the next control after the banner, or to the one before it when the banner was the last. Only when the banner really went away and nothing else took the focus, so an app that sets the focus in `onDismiss` wins.
- Inside a `solid` banner, focus rings take the banner's text colour, because the pink ring has too little contrast on a filled band. They are drawn 1px from their control, so the whole ring lies on the fill: the padding and the border leave 3px, and a ring at the usual 2px reached 1px onto the page, where the dark ring had 1.02:1. On the fill it has at least 5.44:1 (the text's ratio, on `danger`).
- The ring of the dismiss button is drawn inside it, in every variant: the button reaches the banner's edge.
- The title is not a heading, so a banner does not change the page outline.

## Open questions

None.

Resolved 2026-10-11 (review fixes):

- **Focus after a dismissal** (revisited): it fell to the page, and the next Tab started from the top. It now moves to the next control (rule above). The banner looks for plain controls in document order; it does not follow positive `tabindex` values.
- **The focus ring in a `solid` banner stays on the fill** (review B5), and has its own tokens.
- **A compact banner never takes a second line** (review B11): it wrapped below 110px when it had actions.
- **The steps are stated for the content box** (review B12). The code was right and the spec quoted the same numbers as outer widths.
- `--umbra-icon-button-size` and `--umbra-focus-offset` are still set inside the banner for the controls it holds, each through a banner token an app can set.

Resolved 2026-10-10:

- One component for all five absorbed names; the differences are `tone`, `variant`, `emphasis` and `compact`.
- `solid` uses dark text on every tone colour (white does not reach 4.5:1 on them), and light text on the violet accent fill.
- `neutral` and `accent` tones have icons too (speech bubble, light bulb), so six tones have six shapes.
- The role is chosen through `live`, not a free `role` prop, so it cannot name a role the banner does not behave as.
- Dismissal has `open` / `defaultOpen` and one callback, `onDismiss`; there is no separate `onOpenChange`, because the banner can only close itself.
- The shrink steps are container queries in `em`, not measured: they do not depend on the content, so a banner does not change layout while its text loads.
- A banner is not a layout child: inside a `Stack`, wrap it in `<Slot size="content">`.
- No loading, empty or error state: a banner is a message, not data.
- The tone icons are imported directly, not through the provider's icon map, because this batch may not change the provider. Follow-up: add them to the map (`info`, `success`, `warning`, `danger`, `note`, `insight`) so apps can replace them globally.
- Queueing several prompts with previous / next buttons (36) is left to the app: put the buttons in `actions`.
