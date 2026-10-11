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

- **Tokens** can be set on the provider or on any subtree. A component never declares a public `--umbra-*` property, in its stylesheet or in a `style` object: not another component's token, and not a global one (`--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-icon-size`). That would beat the app's value set on an ancestor. A container that needs a different default for what is inside it (a 24px clear button in a field, a smaller icon in a nav item, a ring colour that shows on the brand bar) sets a private property, and the reader uses `var(--umbra-<token>, var(--<token>, <default>))` (decided 2026-10-11; widened to global tokens and finished the same day, Milestone 2 decision 3).
  - The private properties in use: `--icon-size`, `--icon-button-size`, `--focus-offset`, `--focus-color`, `--primary-action-min-height`, `--badge-ring`, `--badge-size`, `--badge-dot-size`, `--badge-padding-x`, `--badge-font`, `--avatar-size`, `--entity-icon-size`, `--scroll-fade-color`.
  - Order of precedence, strongest first: the app's public token on any ancestor; the container's private default (which may itself come from a token of the container, such as `--umbra-table-focus-offset`); the reader's own default. So a container's token changes the default inside that container only, and gives way to the global token when the app sets both.
  - Every token of `plan/tokens.json` is read by the library (same check, added 2026-10-11): as `var(--umbra-…)`, through a template over a scale (`var(--umbra-space-${gap})`), or through a constant of `tokens.generated.ts` where CSS cannot read a variable (`minWindow` for the media query of `useNarrow`). A token that exists only for apps goes on the check's "for apps" list with its reason; the list is empty.
  - Who may declare a public token: `UmbraProvider` and `UmbraScope` (`src/provider/`), the base stylesheet and the generated tokens (`src/styles/`). `scripts/check-tokens.mjs` (in `npm run lint`) fails on any other declaration; its allowlist, with a reason for each entry, holds `--umbra-slot-min-height` (reset on every layout child, so never inherited) and a component's own token set on its own root from its own prop (`bandColor`). `tests/visual/tokens.spec.ts` proves, per container, that the app's token reaches the reader inside.
- **Props** cover the common cases only. A component does not grow a prop for every piece; that is what parts are for.
- **Parts**: each component publishes a fixed list of part names. A part accepts a node (replace), `null` (hide), or a function that receives the default part's props (wrap or adjust).
- **Blocks**: the all-in-one component is itself built from its public blocks, so anything it does can be rebuilt by hand. Exceptions, each recorded in its spec (2026-10-11): a component that is a single control with fixed inner parts (`PrimaryAction`), or whose value is the wiring between existing public components (`HistoryButtons`), publishes no blocks; its pieces are reached through `parts`, and a hand-built version is composed from the public components it uses.
- Every component also accepts `className` and `style` on its root, and exposes its state as `data-` attributes for CSS.
- **`data-part`** (added 2026-10-11): every piece named in a spec's anatomy carries `data-part="<name>"`, whether or not it can be replaced, and so do the placeholders shown while loading (`skeleton`) and the empty and error states (`empty`, `error`). The value is the part's name exactly as it is written in `parts` and in the spec: camelCase (`externalIcon`, `sortIndicator`), never kebab-case. A replaced part is the app's node, so it carries the attribute only if the app adds it.
- **Blocks** take `className` and `style` like the root does, and pass them to their element.
- **Optional props accept an explicit `undefined`** (added 2026-10-11): every optional member of a props, part props, block props or option type (columns, items, series, commands, shortcuts) is declared `prop?: T | undefined`, so an app with `exactOptionalPropertyTypes` can write `prop={condition ? value : undefined}`. An `undefined` means the same as leaving the prop out. Three checks hold it: the flag is on in `tsconfig.json`, `scripts/check-optional-props.mjs` (in `npm run lint`) reads every declaration under `src/`, and the consumer type check of `npm run check:package` passes `undefined` to a set of props. Where React Aria or the table engine refuses `undefined`, the props go through `defined()` (`src/utils/defined.ts`), which drops the `undefined` keys.
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

