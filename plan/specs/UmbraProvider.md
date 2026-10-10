# UmbraProvider

**Tier** 0 · **Group** Foundation · **Status** spec approved 2026-10-10

## Purpose

Wraps the app once. Supplies the theme, density, icon map and shortcut registry to every component below it.

## Not for

- Changing the look of one section: use `UmbraScope` (below).
- Holding app data or routing.

## Evidence

Not a visible component. Derived from the decisions: brand and context tint (screenshots 1, 10, 15, 30, 38), density switch (26).

## Anatomy

No parts. Renders one wrapper element that carries the CSS variables and `data-` attributes.

## Customisation

### 1. Tokens

Sets all `--umbra-*` variables from `tokens.json`. Any variable can be overridden through the `tokens` prop or in the app's own CSS.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `brand` | colour | token default | TopBar colour; text on it is computed for contrast |
| `context` | preset name \| colour | `violet` | Context tint for the page background and tinted cards |
| `density` | `compact` \| `default` \| `spacious` | `default` | Spacing, row heights, text sizes |
| `icons` | partial icon map | default set | Overrides the built-in icons by name (see `decisions/05-packaging.md`) |
| `shortcuts` | shortcut list | — | App key bindings; feeds `ShortcutsSheet` and key hints |
| `tokens` | partial token map | — | Overrides individual tokens |
| `reducedMotion` | `system` \| `always` \| `never` | `system` | |
| `locale` | string | browser | Number and date formatting, text direction |

### 3. Parts

None.

### 4. Blocks

`UmbraScope`: the same `context`, `density`, `brand` and `tokens` props for a subtree. Example: one teal section, or one compact table inside a default page.

## Behaviour as space shrinks

None of its own.

## Interaction and accessibility

- Registers the library's reserved shortcuts (open command palette, open shortcuts sheet).
- Reports shortcut conflicts in development.

## Open questions

- The built-in icon map: the final list of names (about 25).
- Which keys the library reserves.
