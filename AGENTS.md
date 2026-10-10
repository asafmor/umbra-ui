# umbra-ui — agent guide

Read this first. It tells you what the project is, where things are, what state it is in, and how to take on a task.

## What this is

`umbra-ui` is an open-source React component library for full-window, data-dense applications (dashboards, consoles, back-office tools). It is opinionated: its own dark look, and a layout system where components size themselves to fill the window.

The design is **inspired by** 40 screenshots of a game UI in `screenshots/`. It is not a copy: no logos, names or assets from the source, and no domain-specific (football) components.

## Current state

**Phase: planning complete, implementation not started. No library code exists yet.** Update this section whenever the phase or the next step changes.

| Step | Status | Artifact |
|---|---|---|
| 1. Screenshot inventory | done | `plan/inventory/` |
| 2. Component catalog | approved | `plan/components.md` |
| 3. Tokens | done, contrast-checked | `plan/tokens.json` |
| 4. Layout model | decided; open details listed in the file | `plan/layout.md` |
| 5. Interaction and motion | decided; open details listed in the file | `plan/interaction.md` |
| 6. Tech decisions | decided | `plan/decisions/` |
| 7. Roadmap | approved | `plan/roadmap.md` |
| 8. Tier 0 specs | approved (14 files) | `plan/specs/` |
| 9. Reference screen | done | `plan/reference/` |

**Next step**: Milestone 0 (foundation) in `plan/roadmap.md`. It starts implementation and needs the owner's go-ahead. The three "Before any code" tasks are done and all 14 tier 0 specs are approved.

## Repo map

| Path | Content |
|---|---|
| `screenshots/` | The 40 source images. Read-only reference. **Local only: never commit or push them** (third-party copyrighted images; keep the folder in `.gitignore`). |
| `plan/inventory/` | Per-screenshot analysis: layout, components, scroll evidence. Club, competition and person names are replaced with placeholders ("Home Club", "League A", "Person B"), so quoted labels do not match the images word for word. |
| `plan/components.md` | The catalog: every component, what it absorbs, its tier, and the product decisions. |
| `plan/tokens.json` | The design tokens: colour, type, spacing, radius, density, motion. |
| `plan/inventory/source-colours.md` | Colours sampled from the screenshots (reference only), and the sampling method. |
| `plan/specs/` | One spec per component. `Card.md` is the template; all 14 tier 0 specs are approved. |
| `plan/layout.md` | The layout model: primitives, sizing rules, and what happens as space shrinks. |
| `plan/interaction.md` | States, motion, loading, live updates, keyboard and accessibility rules. |
| `plan/decisions/` | One short record per tech decision: styling, behaviour base, charts, table engine, packaging, docs and testing, customisation. |
| `plan/roadmap.md` | Pre-code tasks, milestones, build order, and the per-component definition of done. |
| `plan/reference/` | `index.html`: the static reference screen, the visual ground truth for the look (open it in a browser; `?density=compact&context=teal` switches settings). `shot-*.png`: renders at three sizes. |
| `plan/prompts/` | Ready-made prompts for starting a coding session (`milestone-0.md`). |

## Decisions that bind every task

The full list with dates is in `plan/components.md` under "Decisions". The ones most often relevant:

- **The page never scrolls.** The app fills the window; only regions inside cards may scroll.
- **Components fill their slot** and show less detail as space shrinks, instead of overflowing.
- **Colour layers**: the app sets brand and context tint; violet (selected) and magenta (primary action) are fixed.
- **Density**: three levels, set once on the provider.
- **Every component is customisable through the same four layers**: tokens, props, parts, blocks (`plan/decisions/07-customisation.md`). Icon props accept any node.
- **Colour that carries data needs a non-colour fallback** (icon, text or pattern).
- **Domain-neutral**: generic names and generic props only.

## How to take on a task

**Add a component**
1. Check `plan/components.md`. If it is listed, use that name and scope. If not, add a row first (group, what it absorbs, screenshots, tier).
2. Find its evidence: search `plan/inventory/` for the name, then open the listed screenshots.
3. Write its spec before code in `plan/specs/`, copying the section structure of `plan/specs/Card.md` exactly (purpose, not for, evidence, anatomy, variants, the four customisation layers, behaviour as space shrinks, accessibility, open questions).

**Change a component**
1. Read its spec and its catalog row.
2. If the change contradicts a decision above, stop and ask the owner.
3. Update the spec in the same change as the code.

**Extract more from the screenshots**
1. Read the image itself; do not rely on the inventory alone. Its hex values and proportions were estimated by eye.
2. For colours, sample pixels (see the method note in `plan/inventory/source-colours.md`).
3. Add findings to the matching inventory file, and to the catalog or tokens if they change them.

**Something the screenshots cannot show** (motion, hover, focus, loading, keyboard): propose a rule, get the owner's approval, then record it in `plan/interaction.md`.

## Working with the owner

- Reply in short bullets and short tables. No long prose.
- Ask before deciding anything that changes the experience of developers using the library.
- When a decision is made, record it in `plan/` and update "Current state" above.
