# Accordion

**Tier** 1 · **Group** Layout · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A stack of sections that open and close. It fills the slot it is given; when its open panels need more height than the slot has, they scroll inside instead of pushing content out.

## Not for

- One collapsible unit of content on a page: use `Card` with `collapsible`.
- Switching between views of which exactly one shows: use `Tabs`.
- A group heading inside a list: use `GroupHeader`.
- Navigation with groups: use `VerticalNav`.

## Evidence

A collapsed section with a chevron button and a value beside its title ("Not Available") in a detail pane (15); a column of cards that each collapse with a caret in the header (38); collapsible widgets (36).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `item` | one section: `header` and `panel` | one per entry of `items` |
| `header` | the heading with its button, `meta`, `actions`, `chevron` | shown |
| `title` | the title, inside the button, with `icon` before and `subtitle` under it | shown |
| `meta` | a short value or status | shown when `meta` is set |
| `actions` | controls that do not toggle the section | shown when `actions` is set |
| `chevron` | points down when open, right when closed | shown |
| `panel` | the content; scrolls when the accordion is short of height | shown when open |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `type` | `multiple` (default), `single` | `single` closes the open section when another opens |
| `collapsible` | boolean, default `true` | Only matters for `single`: `false` keeps one section open |
| `variant` | `plain` (default), `card` | Rules between the sections; or each section as a card (the card's own tokens: background, border, radius, padding, title font) |

States per section: open, closed, disabled, hover, pressed, focus.

## Customisation

### 1. Tokens

`--umbra-accordion-padding`, `--umbra-accordion-border`, `--umbra-accordion-header-height`, `--umbra-accordion-gap` (between card sections), `--umbra-accordion-title-font`. The `card` variant also reads `--umbra-card-bg`, `--umbra-card-border`, `--umbra-card-radius`, `--umbra-card-padding` and `--umbra-card-title-font`, so a restyled card restyles it too.

The fade of a `ScrollArea` inside blends into a card section's background, through the private `--scroll-fade-color`; `--umbra-scroll-fade-color` set by the app on any ancestor wins (2026-10-11).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | `{ id, title, subtitle?, icon?, meta?, actions?, content, disabled?, padding?, parts? }[]` | — | The sections. Or pass `Accordion.Item` children |
| `type` | see above | `multiple` | |
| `value` / `defaultValue` | `string[]`; for `single`: `string \| null` | none open | Controlled or uncontrolled open sections |
| `onChange` | function of the new value | — | |
| `collapsible` | boolean | `true` | |
| `variant` | see above | `plain` | |
| `headingLevel` | 2–6 | 3 | Heading level of the section titles |
| `keepMounted` | boolean | `false` | Keeps closed content in the page, hidden, so it keeps its state |
| `aria-label` | string | — | Names the group of sections |
| `size`, `priority`, `minHeight`, `label` | slot props | `size` 1 | The accordion is a layout child |

### 3. Parts

On `Accordion`: `item` (applies to every section built from `items`). On `Accordion.Item` and each entry of `items`: `header`, `title`, `meta`, `actions`, `chevron`, `panel`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`Accordion.Root`, `Accordion.Item` (a complete section), `Accordion.Section` (the bare section), `Accordion.Header`, `Accordion.Panel`. `Accordion.Header` takes `children` to replace the content of its button.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 0 | Any width | Title and subtitle truncate with an ellipsis; actions and chevron keep their place |
| 1 | Section narrower than 20em | `meta` hides |
| 2 | Open panels taller than the slot | Closed sections keep their height. The open panels share what is left, in proportion to their content, and each scrolls inside (thin thumb, fade at the edge) |
| 3 | Even the headers do not fit | The accordion itself scrolls |

## Interaction and accessibility

- Each header is a `button` inside a heading (`headingLevel`), with `aria-expanded` and `aria-controls`. Its panel is a `region` named by the button.
- `Enter` and `Space` toggle. `Up` and `Down` move between headers (no wrap; disabled headers are skipped), `Home` and `End` go to the first and last. Every header is also a tab stop.
- The button covers the whole header, so a press anywhere on it toggles; `actions` sit above it and take their own presses. `meta` and `actions` are outside the heading, so they are not part of the button's name.
- In a `single` accordion with `collapsible={false}`, the open header has `aria-disabled="true"`: it stays focusable and does nothing.
- A disabled section cannot be toggled; only its button and chevron are dimmed, because its meta text and actions are not part of the disabled control.
- Closed content is out of the tab order and the accessibility tree (`visibility: hidden`), and out of the page unless `keepMounted`.
- The focus ring is drawn inside the header, because a card section and the accordion both clip.

### The size animation

Opening and closing animate the panel's height over 180ms (ease-out to open, ease-in to close), in CSS only. The duration is multiplied by `--umbra-motion-scale`, so reduced motion makes it instant. Nothing transitions when the window is resized, because the transition only starts when the open state changes.

Four boxes, outside in:

| Box | Role |
|---|---|
| scroller (the `ScrollArea`) | The flex item that shrinks when the accordion is short of height. Its viewport scrolls at rest. |
| grid | One row, `grid-template-rows: 0fr` closed and `1fr` open, with a transition on that property. Its height is `auto`. |
| clip | The grid item: `min-height: 0; overflow: hidden`. |
| content | Carries the padding. |

Pitfalls (the behaviour is tested in `tests/visual/structure.spec.ts`):

1. **`fr` only interpolates with `fr`.** `0fr` to `1fr` works; `0fr` to `auto` does not.
2. **The grid item needs `min-height: 0`, and no padding or border.** Any of them keeps the row from reaching 0. Padding goes on a child.
3. **The grid must not be the flex item.** In a container of known height a flex item has a definite height, so a row of `0.5fr` is half of the box, which is itself half of the content: the content opens with a gap under it. With the grid inside a plain scroller its height stays `auto`, and the row is exactly the fraction of the content.
4. **No scrollbar while it moves.** The scroller is shorter than its content for the whole transition, so `overflow-y: auto` would flash a scrollbar. It is `hidden` while closed, and turns to `auto` after a delay equal to the duration (`transition: overflow-y 0s linear 180ms` with `transition-behavior: allow-discrete`). A browser without `allow-discrete` shows the scrollbar during the transition and is otherwise the same. `hidden`, not `visible`, so a scrolled panel keeps its position while it closes.
5. **A closing section must keep giving way.** A closed section has `flex-shrink: 0` so its header is never squeezed; an open one has `1`. Changed at once on close, a height-limited section would jump to its full height before shrinking. So `flex-shrink` changes back after the same delay (`transition: flex-shrink 0s linear 180ms`).
6. **Closed content must leave the tab order.** `visibility: hidden`, delayed the same way on close and immediate on open.
7. **Unmounting must wait for the transition, and must not wait when there is none.** Without `keepMounted` the content leaves the page after the close transition. `transitionend` never fires under reduced motion, so the panel asks the grid for its running animations (`getAnimations()`, which also starts the transition) and waits for those: none means now.
8. **The clip hides focus rings at its edge.** Content with `padding="none"` draws its rings inwards.

Alternative considered: `interpolate-size: allow-keywords` with `height: 0` to `auto`. It is simpler, but only Chromium has it; the grid row works in every current browser.

`Card` could not use this as it is: its height is a flex share of its `Stack`, not its content's. It keeps the body mounted while it closes (pitfall 7) and stops the scrollbar (pitfall 4), but animates the root's height from the script; see `plan/specs/Card.md`, "The size animation".

## Open questions

None.

Resolved 2026-10-10:

- `type` defaults to `multiple`; `collapsible` defaults to `true`.
- `value` is `string[]` for `multiple` and `string | null` for `single`, so a single accordion is not handled as a list of one.
- Headers are all tab stops and also take arrow keys (the fuller of the two accepted patterns).
- `meta` and `actions` sit outside the button; the chevron is decorative and at the end, after the actions, like the card's caret.
- Open panels share limited height in proportion to their content; there is no minimum panel height.
- No loading, empty or error state: the accordion is structure, and each panel's content has its own.
- Without `keepMounted`, closed content is removed from the page.
- The accordion starts a new layout context, like a card.
