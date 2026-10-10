# EmptyState

**Tier** 1 · **Group** Data display · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Says that a region has nothing to show, or failed to load, and what to do about it. Every data component uses it for its empty and error states, through the shared helper `src/internal/dataState.tsx`.

## Not for

- A message above content that is there: use `Banner`.
- Content that is still loading: use `Skeleton` (the `loading` prop of the data component).
- A single missing value in a cell ("–", "N/A"): plain text.

## Evidence

Heading plus paragraph in a card (2, 19, 27); one centred line filling a card (24); small text in a large empty card (8); inline text only (15, 23, 38). No illustration anywhere in the source. Error states are not in the screenshots; the rule is in `plan/interaction.md`.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `icon` | decorative icon | hidden |
| `title` | the short statement | shown when set |
| `description` | one or two sentences | hidden |
| `action` | a control that resolves the state | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `block`, `inline` | `block` is centred in its slot; `inline` is one line of text |
| `tone` | `neutral`, `error` | `error` colours the icon and title with the danger colour |

States: none of its own.

## Customisation

### 1. Tokens

`--umbra-empty-state-color`, `--umbra-empty-state-title-color`, `--umbra-empty-state-title-font`, `--umbra-empty-state-icon-color`, `--umbra-empty-state-icon-size`, `--umbra-empty-state-error-color`, `--umbra-empty-state-gap`, `--umbra-empty-state-padding`, `--umbra-empty-state-max-width`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `title` | node | — | The short statement |
| `description` | node | — | Explanation or next step |
| `icon` | node | — | Decorative icon |
| `action` | node | — | For example a `Button` |
| `variant` | see above | `block` | |
| `tone` | see above | `neutral` | |
| `role` | `alert` \| `status` | — | `alert` announces the content when it appears |

### 3. Parts

`icon`, `title`, `description`, `action`.

### 4. Blocks

`EmptyState.Root`, `EmptyState.Icon`, `EmptyState.Title`, `EmptyState.Description`, `EmptyState.Action`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | Content taller (block) or wider (inline) than the slot | `icon` hides |
| 2 | Still too large | `description` hides |
| 3 | Inline, still too wide | `title` truncates with an ellipsis |

The steps are measured, not fixed sizes, and undo when the slot grows. They work for hand-composed blocks too, because the root sets `data-shrink` and the CSS hides the parts. A block in a parent without a definite height is as tall as its content and never shrinks.

## Interaction and accessibility

- No role by default: it is static text. With `role="alert"` (what the data components set for an error) it is announced when it appears.
- The icon is decorative and hidden from assistive technology.
- The error tone is not carried by colour alone in the data components: the role and the text say it.
- The action is an ordinary control in the tab order.

### The shared data states (`src/internal/dataState.tsx`, not exported)

Every data component extends `DataStateProps` and calls `dataState(props, { isEmpty })`, which returns the state to show or `null`.

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `loading` | boolean | `false` | The component shows its skeleton and sets `aria-busy` on its root |
| `empty` | text \| node \| `{ title, description, icon, action }` | English text per component | Shown when there is no data |
| `error` | `true` \| text \| node \| `{ title, description, icon, action }` | — | Shown in place of the data; `true` shows "Something went wrong" |
| `onRetry` | function | — | Adds a retry `Button` to the error state |
| `retryLabel` | string | "Try again" | |

Order: error, then loading, then empty. Text becomes the title; a node replaces the content but keeps the root and the retry button.

## Open questions

None.

Resolved 2026-10-10:

- The shrink steps are measured (`useShrinkLevel`), because a block shrinks by height and the content's height is not known to CSS.
- `Card` keeps its own plain `empty` and `error` rendering. Using `EmptyState` for a text there would turn the secondary body text of the existing `Layout/Card` "States" story into a bold title and change its baselines.
- `error` on the data components also accepts `true`, `icon` and `action`, beyond the `{ title, description }` asked for.
- No illustration slot: the source has none; `icon` takes any node.
