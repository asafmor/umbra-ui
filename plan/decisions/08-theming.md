# 08 — Theming: four colour inputs and a derived palette

**Decided** 2026-10-11, on the owner's findings O-6, O-10 and O-4 (`plan/reviews/milestone-2.md`). It replaces "violet (selected) and magenta (primary action) are fixed".

## Inputs

Props of `UmbraProvider` and `UmbraScope`. All optional; hex or `rgb()`.

| Input | Default | Drives |
|---|---|---|
| `brand` | `#2a2f8f` | The top bar and band headers. **And, when the app does not set them: `interaction`, `action` and `context`.** So one prop re-skins the app. |
| `context` | `violet` preset, or derived from the brand | The page background and its gradient, the card tints, and the hue of the neutrals: surfaces 1 to 3, the subtle, strong and control borders, secondary and muted text. Through those: row hover steps, menus, fields, skeletons, the scroll thumb. A preset name or a colour. |
| `interaction` (new) | violet `#6a1fd6`, or derived from the brand | Selected and checked things, the accent tone, links and thin marks (list below). |
| `action` (new) | magenta `#db1065`, or derived from the brand | The primary action (list below). |
| `surfaceOpacity` (new) | 1 | How opaque card surfaces are (below). |

Not inputs, and never derived: the semantic colours (`success`, `warning`, `danger`, `info`), the value ramp and the series palette. They carry meaning, or are tuned for colour-vision deficiencies as a set.

### Membership

| Token | Read by |
|---|---|
| `--umbra-color-interaction`, `--umbra-color-on-interaction` | The selected fill: current nav items (`VerticalNav`, `Menu`), `Tabs` (pill, button group), `SegmentedFilter`, `DateChip`, selected `SummaryTile` and `MediaCard`, the current row of `EntitySwitcher`. Checked `Checkbox`, `Radio`, `Toggle`, the box of a multiple `Select`. The `accent` tone everywhere (`Button`, `Tag`, `Badge`, `Banner`, `ValuePill`, the meters, the charts). The thumb border of `Slider`. |
| `--umbra-color-interaction-tint` | The tinted fill of a selected **row of data**, which keeps its dimmer text: `ListItem`, the chosen `Select` option, a selected `DataTable` row. |
| `--umbra-color-interaction-text` | Text and thin marks on dark surfaces: `Link`, the links of `Card`, `SectionTitle` and `Button`, checks in menus, the fill of `Slider`, the current `Stepper` segment, `StatValue` accent, `Avatar` ring, `PieIndicator`, the `LevelMeter` marker, the table's highlight marker, the accent `Banner`, the end of the `ProgressBar` gradient. |
| `--umbra-color-action`, `--umbra-color-action-end`, `--umbra-color-on-action` | `Button` primary, `PrimaryAction` (the gradient), the default fill of `ProgressBar` and `DivergingMeter`, today in `DateChip` and `WeekStrip`. |
| `--umbra-color-focus-ring` | Every focus ring. |

## Derivation

Computed in TypeScript by the provider and every scope (`src/provider/palette.ts`, pure functions, unit-tested) and written as CSS variables on the scope's element. Not in CSS: relative colour syntax is newer than the browser minimums, and `color-mix()` cannot clamp a lightness or compare a contrast. It runs during render, so it works with server rendering. Colours are handled in OKLCH (hue, chroma, lightness) and contrast in WCAG luminance.

**With no colour prop nothing is derived**: the default look is the token values of `plan/tokens.json`, exactly.

1. **From the brand** (when `interaction`, `action` or `context` is not set): each role stands to the brand as its default stands to the default brand. In OKLCH: `h = h(brand) + (h(role default) − h(default brand))`, `L = L(brand) + (L(role default) − L(default brand))` held to 0.30–0.85, `C = C(role default) × min(1, C(brand) / C(default brand))`. The steps are +19° for interaction, +92° for action and +22° for the context. The default brand derives nothing, so it is the default look exactly; a brand one step from it gives colours one step from the defaults; a grey brand gives greys; a light brand gives light fills.
2. **Semantic hues**: a derived interaction hue within 22° of `success` or `danger` is moved to the edge of that zone, so "selected" does not read as either. A colour the app passes as `interaction` is not moved: it asked for it, and the second cue of every selected state (below) and the icon of every semantic tone still tell them apart. The action colour is not moved: the default magenta is itself 13° from the danger red, and a danger button is outlined, not filled.
3. **A safe fill** (`safeFill`, for `interaction` and `action`, derived or passed): hue and chroma are kept; the lightness moves only as far as needed. A fill too dark to show is lightened until it has 3.2:1 against `surface1` (3:1 on a card, whose tint is a little lighter). The text on it is white or near-black, whichever holds 4.5:1 on the fill **and** on its strongest press step (26% black); a fill too light for white and too dark for near-black is darkened to where white holds. So hover and press always darken, as before.
4. **`interaction-text`**: the default pink turned as the fill is from the default violet, at the default's luminance, so its contrast on every surface is the default's.
5. **`interaction-tint`**: the fill, or (a light fill) the fill darkened until secondary text holds 4.5:1 on a selected row.
6. **`action-end`**: the fill turned as the default end is from the default start; the fill itself if text would not hold on it.
7. **Focus ring**: the default light pink. When the selected fill is within 0.2 (OKLab) of it, the ring takes the primary text colour (near-white), unless that is closer still (a white fill). "Focus is never the selected colour" stays. Inside a selected fill a component draws its ring in the fill's own text colour, as before. On the brand bar the ring falls back to the bar's text colour under 3:1, as before.
8. **Context**: a preset is used as written. A colour of the app's (or the one turned from the brand) keeps hue and chroma; its lightness is raised to 0.5 if darker (so it shows) and lowered until muted text keeps 4.5:1 on the bright end of the page gradient. **Neutrals**: each of the eight keeps its luminance exactly and takes the context's hue; its chroma is scaled by `min(1, C(context) / C(violet preset))`. Same luminance means every contrast between neutrals is what it was. The presets get the same from the token build, which bundles `palette.ts`.

### Precedence

- An input set on any scope above wins over one derived from a brand: a `Page context="teal"` stays teal under a brand.
- **A token set by hand wins over the derivation**: through `tokens` on the same or any outer scope, or in CSS on any element inside the provider. With a colour prop the provider writes its values inline on its own element, which beats `:root`; without one it writes nothing, and `:root` works as before.
- `TopBar brand` colours that bar only; nothing is derived from it.
- A colour the provider cannot read (`hsl()`, a name) is passed on as it is, with a development warning and no guarantee.

## Guarantees

Unit-tested over 30 inputs (hues around the wheel, black, white, greys, low and high chroma, the semantic colours, the focus pink), as a brand and as `interaction` / `action`; a sample is measured in a browser on the components (`tests/visual/theming.spec.ts`), and axe checks every story on every tint.

| Guarantee | Value |
|---|---|
| Text on a selected fill and on the primary action, at rest, hovered and pressed | ≥ 4.5:1 |
| The selected fill and the primary action against the card | ≥ 3:1 |
| Link and mark colour on surfaces 1 to 3 | ≥ 4.5:1 |
| Secondary text on a selected row of data, pointed at or not | ≥ 4.5:1 |
| Focus ring against surfaces 1 to 3 | ≥ 3:1 |
| Focus ring apart from the selected fill | ≥ 0.1 OKLab |
| Neutrals under any context | Luminance unchanged (within rounding) |
| Text on the page background, with no card under it | ≥ 4.5:1 |
| Hover and press | Always darker on a filled surface |

Honest limits:

- **The default violet has 2.65:1 against `surface1`**, under the 3:1 a derived fill gets. The default look must not change, so it stays, and a brand next to the default gives a slightly lighter violet than the default itself. Every selected state has a second cue.
- 3:1 is against the page and card surface. On a raised surface (a menu) a dark derived fill can be at about 2.7:1.
- A mid-tone colour is darkened (pure red `#ff0000` becomes a slightly deeper red). An app that needs the exact value sets the token.

## Surface opacity (O-10)

| Piece | Decision |
|---|---|
| Setting | `surfaceOpacity` on the provider and scope; the token `--umbra-surface-opacity`, 0 to 1, default 1. |
| Applied to | `Card` (every tone), `SummaryTile`, `MediaCard`, the card look of `Accordion`, the tinted `PageHeader`. Mixed with `transparent` in the background; never `opacity`, so content stays opaque. |
| Stays opaque | Overlays (popover, menu, select list, tooltip, modal, palette). A selected `SummaryTile` or `MediaCard` (it carries text on the fill). Hover and press steps. Sticky headers inside a card and scroll fades: they are painted in the card's colour to cover what scrolls under them, so at a low opacity they show as bands. |
| Blur | `--umbra-surface-backdrop`, default `none`: any `backdrop-filter`, for example `blur(12px)`. |
| Background | `AppShell` had `--umbra-shell-bg`, `--umbra-shell-bg-end`, `--umbra-shell-pattern-opacity` and the `background` part. Added: `--umbra-shell-image`, any CSS image, drawn over the gradient and under the pattern. |
| Contrast | Over the library's own background (gradient and pattern) text keeps 4.5:1 at any opacity, for any context: the context's lightness is limited for it. Over an image of the app's, the app owns contrast; the guide recommends 0.6 or more, or a dark image. |

## The edge stripe (O-4)

| Row | Selected or current | Highlight (pointer, arrow keys) |
|---|---|---|
| Rows of data: `ListItem`, `DataTable` | Tinted fill and **the edge stripe** | One step lighter |
| Chosen option: `Select`, a checked `Menu` row, `EntitySwitcher` | Tinted or solid fill and **a check**. No stripe | One surface step lighter (`surface3`) |
| Current page: `VerticalNav`, a `Menu` row with `current` | Solid fill, **bold**, `aria-current`. No stripe. A closed group that holds the current item: tinted and bold | One step lighter; on the current row, its fill one step darker |
| Command palette | Nothing is selected | The active row is `surface3`. Before, it was the selected fill with a stripe |

Removed tokens: `--umbra-select-option-stripe-width`, `--umbra-vertical-nav-stripe-width`. Added: `--umbra-vertical-nav-holds-current-bg`.

## Renames

Nothing is published, so there are no aliases.

| Old | New |
|---|---|
| `color.fixed` in `plan/tokens.json` | `color.interaction`, `color.action`, `color.focusRing` |
| `--umbra-color-fixed-selected` | `--umbra-color-interaction` |
| `--umbra-color-fixed-on-selected` | `--umbra-color-on-interaction` |
| `--umbra-color-fixed-accent-text` | `--umbra-color-interaction-text` |
| `--umbra-color-fixed-primary` | `--umbra-color-action` |
| `--umbra-color-fixed-primary-end` | `--umbra-color-action-end` |
| `--umbra-color-fixed-on-primary` | `--umbra-color-on-action` |
| `--umbra-color-fixed-focus-ring` | `--umbra-color-focus-ring` |
| `fixedColours` (`tokens.generated.ts`, internal) | `paletteDefaults` |

New tokens: `--umbra-color-interaction-tint`, `--umbra-surface-opacity`, `--umbra-surface-backdrop`. New props: `interaction`, `action`, `surfaceOpacity`. The card tints are now mixed into `--umbra-color-base-surface1` instead of its literal value, so they follow the context's neutrals.

**Rejected**: deriving in CSS (no relative colour syntax at the minimums; no way to guarantee contrast). The action colour in the brand's own hue (a red brand gives red primary buttons beside danger; the three roles collapse into one colour; `action={brand}` does it for an app that wants it). The series palette following the brand (it is tuned as a set). Applying `opacity` to cards (content fades with them).
