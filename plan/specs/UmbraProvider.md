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

No parts. Renders one wrapper element that carries the CSS variables and `data-` attributes (`data-umbra-scope`, `data-umbra-density`, `data-umbra-context`, `data-umbra-reduced-motion`). The wrapper has `display: contents`, so it adds no box and can wrap a layout child.

## Customisation

### 1. Tokens

Sets all `--umbra-*` variables from `tokens.json`. Any variable can be overridden through the `tokens` prop or in the app's own CSS.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `brand` | colour (hex or `rgb()`) | token default | TopBar colour; text on it is computed for contrast. Other colour syntaxes get white text and a development warning. |
| `context` | preset name \| colour | `violet` | Context tint for the page background and tinted cards |
| `density` | `compact` \| `default` \| `spacious` | `default` | Spacing, row heights, text sizes |
| `icons` | partial icon map | default set | Overrides the built-in icons by name (see `decisions/05-packaging.md`) |
| `shortcuts` | list of `{ id, keys, label, action? }` | — | App key bindings; feeds `ShortcutsSheet` and key hints. `keys` is written like `Mod+K` (`Mod` is Command on macOS, Ctrl elsewhere). A mounted button with `shortcut={id}` takes the key; otherwise `action` runs. A bare key is ignored while the user types in a field. |
| `tokens` | partial token map | — | Overrides individual tokens. Keys are variable names without the `--umbra-` prefix: `{ 'radius-card': '12px' }`. |
| `reducedMotion` | `system` \| `always` \| `never` | `system` | |
| `locale` | string | browser | Number and date formatting, text direction |

Icon names (`IconName`). Every built-in icon the library draws comes from this map, so replacing a name here replaces it everywhere. A component's own `icon` prop or part still wins for that one place.

| Name | Default (lucide) | Used by |
|---|---|---|
| `back`, `forward` | ArrowLeft, ArrowRight | TopBar history buttons |
| `chevronDown`, `chevronRight` | ChevronDown, ChevronRight | Carets of menus, cards, accordions, navigation groups |
| `close` | X | Dismiss buttons, removable tags |
| `expand` | Maximize2 | Card expand button |
| `more` | Ellipsis | Overflow ("more") menus |
| `search` | Search | Search fields |
| `spinner` | LoaderCircle | Loading buttons |
| `check` | Check | Checkbox, Toggle, multiple SegmentedFilter, checked menu rows |
| `indeterminate` | Minus | Checkbox in the mixed state |
| `invalid` | CircleAlert | Invalid TextField and field error text |
| `info`, `success`, `warning`, `danger` | Info, CircleCheck, TriangleAlert, OctagonAlert | StatusIndicator, Banner, ActionBar status |
| `neutral` | CircleMinus | StatusIndicator `neutral` |
| `message` | MessageSquare | Banner and ActionBar `neutral` |
| `tip` | Lightbulb | Banner `accent` |
| `trendUp`, `trendDown`, `trendFlat` | ArrowUp, ArrowDown, Minus | TrendArrow |
| `externalLink` | ExternalLink | Link `external` |
| `user` | User | Avatar fallback |
| `panelClose`, `panelOpen` | PanelLeftClose, PanelLeftOpen | VerticalNav rail toggle |

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

None.

Resolved 2026-10-10:

- Reserved keys: `Mod+K` (command palette) and `?` (shortcuts sheet).
- The icon map starts with the names Milestone 0 uses and grows per milestone. The default set is `lucide-react`.
- Integration pass: no component imports an icon directly; all 27 names are listed under Props.
- Approved after Milestone 0: the shortcut shape `{ id, keys, label, action? }`; token override keys without the `--umbra-` prefix; `brand` reads hex and `rgb()` only for the contrast calculation.
