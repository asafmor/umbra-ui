# 07 — Customisation: four layers, the same for every component

**Decided** 2026-10-10.

Every component is customised through the same four layers. A developer tries them in order and stops at the first that is enough.

| Layer | For | Example |
|---|---|---|
| 1. Tokens | Look: colour, type, spacing, density | `<UmbraProvider brand="#0a7" density="compact">` |
| 2. Props | Variants and behaviour | `<Card title="Budget" collapsible priority={2} />` |
| 3. Parts | Replace or hide one named piece | `<Card parts={{ header: <MyHeader />, footer: null }} />` |
| 4. Blocks | Compose your own version from the building blocks | `<Card.Root><Card.Header>…</Card.Header><Card.Body>…</Card.Body></Card.Root>` |

Rules:

- **Tokens** can be set on the provider or on any subtree. A component never declares the public token of another component on one of its parts: that would beat the app's value set on an ancestor. A container that needs a different default for a child (a 24px clear button in a field, a smaller icon in a nav item) sets a private property, and the child reads `var(--umbra-<token>, var(--<token>, <default>))` (decided 2026-10-11; done for `icon-size`, `icon-button-size`, `focus-offset` and `primary-action-min-height`).
- **Props** cover the common cases only. A component does not grow a prop for every piece; that is what parts are for.
- **Parts**: each component publishes a fixed list of part names. A part accepts a node (replace), `null` (hide), or a function that receives the default part's props (wrap or adjust).
- **Blocks**: the all-in-one component is itself built from its public blocks, so anything it does can be rebuilt by hand. Exceptions, each recorded in its spec (2026-10-11): a component that is a single control with fixed inner parts (`PrimaryAction`), or whose value is the wiring between existing public components (`HistoryButtons`), publishes no blocks; its pieces are reached through `parts`, and a hand-built version is composed from the public components it uses.
- Every component also accepts `className` and `style` on its root, and exposes its state as `data-` attributes for CSS.
- **`data-part`** (added 2026-10-11): every piece named in a spec's anatomy carries `data-part="<name>"`, whether or not it can be replaced, and so do the placeholders shown while loading (`skeleton`) and the empty and error states (`empty`, `error`). The value is the part's name exactly as it is written in `parts` and in the spec: camelCase (`externalIcon`, `sortIndicator`), never kebab-case. A replaced part is the app's node, so it carries the attribute only if the app adds it.
- **Blocks** take `className` and `style` like the root does, and pass them to their element.
- **Each component's spec lists all four layers**: its tokens, props, part names and blocks. The per-component customisation table in the docs is generated from the source, so it cannot go out of date.

**Rejected**: props only (prop bloat; unusual cases stay impossible). Building blocks only (simple cases need too much code).

## Prop names (added in the integration pass, 2026-10-10)

The same idea has the same name in every component. New components follow this list.

| Idea | Name |
|---|---|
| A press | `onPress`. A row or point chosen from a collection: `onAction(id)`. Never `onClick`. |
| State flags | `disabled`, `readOnly`, `invalid`, `required`, `loading`, `selected`, `checked`, `pressed`, `open`, `collapsed`. No `is` prefix. |
| A changing value | `value` / `defaultValue` / `onChange`. Other state: `<name>` / `default<Name>` / `on<Name>Change` (`collapsed`, `open`). |
| Lists of ids | `<what>Ids`: `selectedIds`, `hiddenIds`, `expandedIds`. Items are identified by `id`; the type of one is `<Component>Id` (`ListId`). The change callback names the idea, not the prop: `onSelectionChange`, `onHiddenChange`, `onExpandedChange` (recorded 2026-10-11; `List`, `Menu`, `DataTable`, `Legend`, the charts and `VerticalNav` already agree). |
| Heading level | `headingLevel` |
| A built-in string | `<what>Label` with an English default: `moreLabel`, `closeLabel`, `emptyLabel`, `retryLabel` |
| Text of a number | `formatValue` |
| Size | `size` is the share of the parent's space on a layout child, and the control size elsewhere. A layout child that also has a control size names it for the part: `tabSize`, `itemSize`. |
| Colour by meaning | `tone`; a free colour is `color`. `variant` is the shape or look. |
| Router link | `renderLink(props)`. `props` is one exported type, `LinkRenderProps`, on every component that has it. |
| Accessible name of an element with no visible name | `aria-label` (and `aria-labelledby` where another element names it). On every component: the charts, `Menu`, `Popover` and `ScrollArea` took `label` until 2026-10-11. `label` is kept for text that is also shown (a `Button`, a `FormField`, a tab of `Columns`) and for the names of inner controls (`closeLabel`, `moreLabel`). |
| Number of placeholder rows while loading | `skeletonRows` (`List`, `DataTable`, `KeyValueList`, `Legend`) |
| Height of a component that fills its slot | `height`: `fill` (default; the content's height where there is none to fill), `content`, or pixels. `DataTable`, `List`, the charts (`src/internal/height.ts`). |
| Loading, empty, error | `loading`, `empty`, `error`, `onRetry`, `retryLabel` (`src/internal/dataState.tsx`) |

