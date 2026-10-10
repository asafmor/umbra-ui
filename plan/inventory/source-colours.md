# Source colours (sampled reference)

Sampled from screenshots 1, 10, 14, 15, 30, 38 by counting dominant pixels. Values are quantised to steps of 8 per channel, so they are accurate to about ±4. They are a **reference for the source look**, not the final umbra-ui palette (decision: inspired, own identity).

Not yet extracted: typography, spacing, radius, borders, elevation, the value-to-colour ramp.

## Fixed layer (never changes across screenshots)

| Role | Sampled | Notes |
|---|---|---|
| Primary action (magenta) | `#fc0464` → `#ec0484` | Gradient on the Continue button; flat `#dc0c64` on smaller buttons |
| Selected (violet) | `#6c0cd4` – `#740cdc` | Selected segment, active filter |
| Soft violet | `#a464dc`, `#6c4494` | Tag borders, secondary highlights |
| Pink text accent | `#fc64fc` | Underlined section titles, key values |
| Success green | `#04ac64` / `#049c64` | Result dots, positive status |
| Body text, secondary | `#9c9c9c` – `#b4b4b4` | |
| Body text, primary | `#fcfcfc` | |

## Base layer (dark neutrals, default purple context)

| Role | Sampled |
|---|---|
| Deepest surface (cards) | `#04040c`, `#0c0414` |
| Page background | `#14041c` → `#34044c` (dark-to-purple gradient with diagonal streaks) |
| Raised surface | `#1c142c`, `#241434`, `#241c3c` |
| Neutral card (right column) | `#141c24` |

## Brand layer (set by the app)

| Screenshot | Top bar |
|---|---|
| 1, 10, 14, 30 | Blue `#044c9c` |
| 15 | Charcoal (no saturated brand colour) |
| 38 | Light grey `#e4e4e4` with dark text |

## Context tint layer (set by the app, per section)

| Screenshot | Context | Dominant background |
|---|---|---|
| 1, 14, 38 | Default | Purple: `#14041c`, `#24142c`, `#2c1c34` |
| 10 | Tactics | Teal: `#0c443c`, `#14544c`; accent `#248c7c` |
| 30 | Competition | Green: `#041c14`, `#042414`, `#044c34` |
| 15 | Other club | Grey-green charcoal: `#1c2424`, `#141c1c` |

## Implication for token design

- A context tint needs at least three derived values: page background, card tint and a mid accent. The token set should derive them from one input colour.
- A brand colour can be light or dark, so top bar text colour must be computed for contrast.
