# ScrollArea

**Tier** 0 · **Group** Layout · **Status** spec approved 2026-10-10

## Purpose

A region that scrolls inside its slot. It is the only place scrolling happens: the page itself never scrolls.

## Not for

- Scrolling the page.
- Very long lists that need virtual scrolling: that is a `DataTable` and `List` feature.

## Evidence

Thin scroll thumbs with no track inside cards (1: messages list and player stats; 14: detail pane; 38: coaching team). Screenshot 32 has nine regions scrolling independently.

## Anatomy

| Part | Content |
|---|---|
| `viewport` | the scrolling element |
| `fade` | a soft fade at an edge that has more content |

Scrollbars are the browser's own, styled thin with a transparent track.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `axis` | `vertical`, `horizontal`, `both` | |
| `scrollbar` | `auto`, `hover` | `hover` shows the thumb only while the pointer is over the area |
| `fade` | `true`, `false` | |

## Customisation

### 1. Tokens

`--umbra-scroll-thumb`, `--umbra-scroll-thumb-hover`, `--umbra-scroll-thumb-size`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `axis` | see above | `vertical` | |
| `scrollbar` | see above | `auto` | |
| `fade` | boolean | `true` | |
| `onReachEnd` | function | — | For loading more |

### 3. Parts

`viewport`, `fade`.

### 4. Blocks

None.

## Behaviour as space shrinks

Takes the size of its slot; scrolling starts when content exceeds it. Nothing else changes.

## Interaction and accessibility

- When it overflows and holds no focusable child, the viewport itself is focusable so keyboard users can scroll it, and has a label.
- Native scrolling is kept, so wheel, touch, keyboard and assistive technology behave as the platform does.

## Open questions

None.

Resolved 2026-10-10: the `hidden` scrollbar option is dropped.
