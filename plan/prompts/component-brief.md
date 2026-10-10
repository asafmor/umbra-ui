# Brief for building a batch of components

Given to an agent together with a list of components. It repeats nothing that is written elsewhere; read the files it names.

## Read first

1. `AGENTS.md`: conventions, commands, binding decisions.
2. `plan/decisions/07-customisation.md`, `plan/layout.md`, `plan/interaction.md`.
3. `plan/specs/Card.md` (the spec template) and `plan/specs/Button.md` (a small component's spec).
4. Code to copy the patterns from: `src/basics/Button.tsx` and `Button.module.css`, `src/layout/Card.tsx`, `src/layout/SectionTitle.tsx`, `src/utils/parts.ts`, `src/internal/useShrinkLevel.ts` (read its comment), `src/provider/icons.tsx`, and any component listed under "Already built" in your task.
5. `plan/components.md`: the catalog row of each of your components.
6. Evidence: search `plan/inventory/` for each component and its absorbed names, then open the listed images in `screenshots/` and look at them yourself. `plan/reference/index.html` shows several tier 1 looks in this library's own identity; match it where it shows your component.

## For each component, in this order

1. **Spec** in `plan/specs/<Name>.md`, with exactly the sections of `Card.md`. Status line: `spec written 2026-10-10 (approved under the owner's delegation)`. Decide open questions yourself, choose the fuller option, and list each decision under "Resolved".
2. **Code** in the folder named in your task. One `.tsx` and one `.module.css` per component; small related components may share a CSS module.
3. **Stories**: one story file per component (title `<Group>/<Name>`), covering every variant and state, including loading, empty and error where the component has them, every `parts` kind (node, `null`, function) and the blocks composed by hand.
4. **Tests** in a new file `tests/visual/<group>.spec.ts` (do not edit other spec files): keyboard, focus, and every behaviour a still image cannot show, including each shrink step.
5. **Docs**: nothing by hand. The customisation tables are generated.

## Rules that are easy to get wrong

- **Four layers, always.** Tokens (`var(--umbra-<component>-<name>, <fallback from a global token>)`, never declared on the component itself), props, `parts` through `renderPart`, and blocks as static members (`Tag.Root`). The all-in-one component is built from its own blocks.
- **Root**: `data-umbra="<kebab-name>"`, `className` and `style` props, state as `data-` attributes. Each part: `data-part="<name>"`.
- **Public types are ours.** No React Aria or TanStack type appears in a public prop or return type. Events are plain callbacks (`onPress: () => void`, `onChange: (value) => void`).
- **Tokens have one source**, `plan/tokens.json`. Do not hard-code a colour, font, radius, spacing step or duration that has a token. If you need a new global token, add it to `plan/tokens.json` in the fitting group (and run `npm run tokens`); keep additions few.
- **Fill the slot, show less as it shrinks.** A component never overflows its container: text truncates with an ellipsis, secondary parts hide (container queries where possible, `useShrinkLevel` where measuring is needed). State each step in the spec and test it.
- **Layout children**: a component that can sit directly in a `Columns` or `Stack` takes the slot props through `useSlot` (see `Card`); others do not.
- **States** (`plan/interaction.md`): hover, pressed, selected (violet plus a second cue that is not colour), focus ring from the global rule (use `outline-offset: var(--umbra-focus-offset, 2px)` if you restate it; draw it inwards inside a clipping container), disabled at `var(--umbra-state-disabled-opacity)`. Motion durations and easings from tokens, multiplied by `var(--umbra-motion-scale)` for movement.
- **Data components** take `loading` (built from `Skeleton`, in the final layout so nothing moves), an empty state and an error state with room for a retry action. Use `src/internal/dataState.tsx` when it fits.
- **Colour that carries data needs a second cue** (icon, text or pattern), on every context tint.
- **Keyboard**: every control is reachable; a composite uses one tab stop and arrow keys inside. Build on React Aria Components where it has the pattern.
- **Text**: every built-in string is a prop with an English default (`moreLabel`, `closeLabel`), so apps can translate it.
- **Domain-neutral**: generic names, props and sample data only ("Item 1", "Person A", "Region 2", "Orders"). Nothing from sport, and no real names of people, places, companies or products. Copy no asset, logo or name from `screenshots/`.
- **The page never scrolls.** Stories fill the window (`parameters: { frame: 'padded' }` for small components) and must not overflow the document at 1920x1080, 1280x720 or 1024x600 at any density. Split a tall story into several.
- **Do not touch**: `src/index.ts`, `src/charts/index.ts`, `AGENTS.md`, `docs/`, `.changeset/`, other groups' files, and existing spec files of tier 0 components unless your task says so. Report the exports to add instead.

## Checks, all passing before you finish

Use the test port given in your task, so parallel checkouts do not collide: prefix the Playwright commands with `UMBRA_TEST_PORT=<port>`.

1. `npm run typecheck`, `npm run lint` (`npm run format` and `npm run docs:tables` fix the usual failures), `npm test`.
2. `npm run test:visual:update`: builds Storybook, runs every Playwright test, writes baselines for your new stories. No existing baseline may change; if one does, find out why.
3. `npx playwright test <group> a11y --repeat-each 3`: no failures, no flakiness. The accessibility test must pass for your stories on all four tints.
4. Look at the new baseline images (read the PNG files): at 1920x1080, 1024x600 and compact density, and on another tint. Fix anything clipped, overlapping, misaligned, unreadable or unlike the reference.
5. Commit on your branch with clear messages (one commit per component is fine), ending with the attribution line given in your task. Do not push.

## Report

Short bullets: components done; exports to add to `src/index.ts` (values and types); tokens added to `plan/tokens.json`; decisions you made under "Resolved"; anything not done or left weaker than the spec, and why; the final pass counts.
