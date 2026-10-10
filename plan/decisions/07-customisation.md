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

- **Tokens** can be set on the provider or on any subtree.
- **Props** cover the common cases only. A component does not grow a prop for every piece; that is what parts are for.
- **Parts**: each component publishes a fixed list of part names. A part accepts a node (replace), `null` (hide), or a function that receives the default part's props (wrap or adjust).
- **Blocks**: the all-in-one component is itself built from its public blocks, so anything it does can be rebuilt by hand.
- Every component also accepts `className` and `style` on its root, and exposes its state as `data-` attributes for CSS.
- **Each component's spec lists all four layers**: its tokens, props, part names and blocks. The per-component customisation table in the docs is generated from the source, so it cannot go out of date.

**Rejected**: props only (prop bloat; unusual cases stay impossible). Building blocks only (simple cases need too much code).
