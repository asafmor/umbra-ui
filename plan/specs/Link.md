# Link

**Tier** 1 · **Group** Data · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A text link: inside a sentence, or on its own line as the way to a fuller view ("See all").

## Not for

- An action that looks like a button: use `Button` (with `href` when it navigates).
- The title of a section that links to its page: use `SectionTitle` with `href`.
- Navigation between pages: use `PrimaryNav` and `SubNav`.

## Evidence

Coloured names inside table rows and text (9, 12, 18, 23); link-style footer items with an external-link icon (21, 26); pink underlined links to a fuller view (12, 18, 20).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `label` | the text, underlined | shown |
| `externalIcon` | an icon and a text for screen readers | shown when `external` |
| `chevron` | a trailing chevron | hidden; shown by `chevron` |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `inline`, `standalone` | `inline` takes the font around it and wraps with its sentence. `standalone` is one bold line in the label font. |
| `tone` | `accent`, `neutral` | `accent` is the fixed pink text colour; `neutral` takes the text colour around it |
| element | link, button | A link with `href`; a button without (it calls `onPress`) |

States: hover (lightens), pressed (darkens), focus, disabled.

## Customisation

### 1. Tokens

`--umbra-link-color`, `--umbra-link-neutral-color`, `--umbra-link-font` (standalone), `--umbra-link-underline-offset`, `--umbra-link-radius` (the corners of the focus ring; default the control radius), `--umbra-link-hover-lighten` (default 30%).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The text |
| `href` | string | — | Where it goes |
| `onPress` | function, no arguments | — | Called on activation, with or without `href` |
| `external` | boolean | `false` | Opens a new tab, with `rel="noopener noreferrer"`, and shows the icon |
| `externalLabel` | string | "opens in a new tab" | Read after the text of an external link |
| `renderLink` | function of the link's props | plain `<a>` | Plugs in the app's router link, as on `PrimaryNav` |
| `disabled` | boolean | `false` | |
| `variant` | see above | `inline` | |
| `tone` | see above | `accent` | |
| `chevron` | boolean | `false` | Trailing chevron |

### 3. Parts

`label`, `externalIcon`, `chevron`.

### 4. Blocks

`Link.Root` (the element), `Link.Label`, `Link.Icon`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | `inline`: the line is too short | The link wraps with its sentence, like any text |
| 2 | `standalone`: wider than its container | The label truncates with an ellipsis; the icon and chevron keep their size |

## Interaction and accessibility

- One tab stop. `Enter` follows a link; `Enter` and `Space` press the button form.
- A link is always underlined, so it never depends on its colour (also in the `neutral` tone, where the colour is the same as the text).
- An external link says so: its icon is decorative and `externalLabel` is read after the text.
- A disabled link is a link without a destination (`aria-disabled`, no `href`): it is announced, cannot be followed and is not a tab stop. `renderLink` is not called for it. A disabled button form uses `disabled`.
- The focus ring of a `standalone` link is drawn inwards, because it usually sits in a row that clips.
- The accent colour has more than 4.5:1 on every surface of every context tint.

## Open questions

None.

Resolved 2026-10-11 (review fix pass):

- The radius is the control radius (`--umbra-link-radius`), no longer a literal 2px; it only shapes the focus ring. Press darkens by the shared `--umbra-state-press-darken`. Hover lightens text, which needs a larger step than a surface, so it has its own token (`--umbra-link-hover-lighten`).
- Every block passes `className` and `style` to its element, and every part carries `data-part` with its name as written here (plan/decisions/07-customisation.md). `Link.Label` and `Link.Icon` dropped `className` and `style` before.
- No loading, empty or error state (plan/interaction.md).

Resolved 2026-10-10:

- `renderLink` receives the same props as on `PrimaryNav` (`LinkRenderProps` is that type), so one router adapter serves both.
- Without `href` the link is a `<button>`, so an action that looks like a link has the right role.
- Both variants are underlined at rest, like the link variant of `SectionTitle`; hover changes the colour only.
- The chevron is opt-in (`chevron`), on either variant.
- `external` sets `target="_blank"`; there is no separate `target` prop.
- The external-link icon is not in the provider's icon map yet (it belongs to another group in this batch); the `externalIcon` part replaces it. Adding it to the map is a follow-up.
