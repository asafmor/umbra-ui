# AppShell

**Tier** 0 · **Group** Shell · **Status** spec approved 2026-10-10

## Purpose

The outermost frame. Exactly the size of the window, never scrolls, and stacks the bars above one `Page`.

## Not for

- A scrolling document or marketing page.
- A region inside a page: use `Columns` and `Stack`.

## Evidence

Every full screenshot: bars on top, content filling the rest, themed background visible in the margins and behind translucent cards (1, 14, 30, 38).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `topBar` | a `TopBar` | hidden unless given |
| `subNav` | a `SubNav` | hidden unless given |
| `main` | one `Page` | shown |
| `background` | the context-tinted gradient with a subtle diagonal pattern | shown |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `background` | `gradient`, `flat` | `flat` removes the gradient and pattern |

## Customisation

### 1. Tokens

`--umbra-shell-bg`, `--umbra-shell-bg-end`, `--umbra-shell-pattern-opacity`, `--umbra-topbar-height`, `--umbra-subnav-height`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `topBar` | node | — | |
| `subNav` | node | — | |
| `background` | see above | `gradient` | |
| `skipLabel` | string | "Skip to content" | Text of the skip link |
| `children` | node | — | The `Page` |

### 3. Parts

`topBar`, `subNav`, `main`, `background`.

### 4. Blocks

`AppShell.Root`, `AppShell.Bars`, `AppShell.Main`, `AppShell.Background`.

## Behaviour as space shrinks

- Size is `100dvw` × `100dvh` with overflow hidden, fixed to the window so the host page's margins cannot make it scroll; bars keep their height and `main` takes the rest.
- Below the minimum window (1024 × 600) it sets `data-narrow` on the root; `Columns` reacts by switching to tabs (see `layout.md`).

## Interaction and accessibility

- Landmarks: bars in `header`, `main` for the page.
- A "skip to content" link is the first focus stop.

## Open questions

None.

Resolved 2026-10-10:

- The background pattern is opt-in: `--umbra-shell-pattern-opacity` defaults to `0` (the reference screen has no pattern).
- `data-narrow` is set when the window is narrower than 1024px **or** shorter than 600px. Exactly 1024 x 600 is not narrow.
