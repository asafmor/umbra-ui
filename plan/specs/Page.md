# Page

**Tier** 0 · **Group** Layout · **Status** spec approved 2026-10-10

## Purpose

The content area under the bars. It applies the outer margin and the context tint, and gives its full size to one layout child.

## Not for

- Splitting space: use `Columns` and `Stack` inside it.
- The window frame: use `AppShell`.

## Evidence

Every full screenshot: an even margin around the content (about 32px at default density), tint changing per section (10 teal, 30 green).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `header` | a `PageHeader` fixed above the content | hidden |
| `content` | one `Columns`, `Stack` or `Card` | shown |
| `footer` | an `ActionBar` fixed below the content | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `padding` | `default`, `none` | `none` for edge-to-edge content |

States: `loading` (skeleton for the whole page).

## Customisation

### 1. Tokens

`--umbra-page-margin` (from density), `--umbra-page-gap`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `context` | preset name \| colour | provider | Context tint for this page |
| `header` | node | — | |
| `footer` | node | — | |
| `padding` | see above | `default` | |
| `loading` | boolean | `false` | |

### 3. Parts

`header`, `content`, `footer`.

### 4. Blocks

`Page.Root`, `Page.Header`, `Page.Content`, `Page.Footer`.

## Behaviour as space shrinks

The margin follows the density level only. `header` and `footer` keep their height; `content` takes the rest and never overflows.

## Interaction and accessibility

- Changing `context` updates the shell background too, so page and frame always match.

## Open questions

- Page presets (list + detail, list + main + aside, main + aside) are listed in `layout.md` and specified separately.
