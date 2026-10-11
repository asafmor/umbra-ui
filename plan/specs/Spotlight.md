# Spotlight

**Tier** 2 · **Group** Overlays · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

Dims everything but one element, draws a ring around it and explains it in a callout beside it: a coach mark. With `steps` it is a tour through several elements.

## Not for

- A hint on hover or focus: use `Tooltip`.
- A panel that belongs to a control and leaves the page usable: use `Popover`.
- A task that needs the user's full attention, or a question: use `Modal` or `ConfirmDialog`.
- A message about the page as a whole: use `Banner`.

## Evidence

Screenshot 25: one card of a two-column screen is lit, with a 2px outline with rounded corners; everything else, the top bar included, is dimmed. The source shows no callout, no steps and a soft glow; the callout, the tour and the crisp ring are the library's own (`plan/interaction.md`: no glows).

## Anatomy

| Part | Content | Default |
|---|---|---|
| root | covers the window; takes no presses itself | shown while open and the target is in the page |
| `shield` | transparent; stops presses on what is dimmed. One over the window, or four around an `interactive` target | shown |
| `ring` | the cut-out around the target: a 2px ring, and the dim over the rest of the window | shown |
| `callout` | the dialog beside the target | shown |
| `title` | heading of the callout; names the dialog | when given |
| `body` | the text; describes the dialog | when given |
| `footer` | `progress` and the buttons | shown |
| `progress` | "2 of 5" | in a tour |

## Variants and states

| Variant | How |
|---|---|
| coach mark | `target`, `title`, children: one button (`doneLabel`) |
| tour | `steps`: Skip, Back, Next, and Done on the last step |
| interactive | `interactive`: the target can be used; what it opens is above the dim |
| persistent | `dismissable={false}`: only the callout's buttons close it |

State for CSS: `data-interactive` on the root, `data-placement` and `data-dismissable` on the callout. The document element carries `data-umbra-spotlight` while one is open.

## Customisation

### 1. Tokens

`--umbra-spotlight-dim` (the scrim), `--umbra-spotlight-ring-color` (primary text colour), `--umbra-spotlight-ring-width` (2px), `--umbra-spotlight-radius` (card radius), `--umbra-spotlight-duration` (the fade), `--umbra-spotlight-z-index` (`--umbra-layer-spotlight`), `--umbra-spotlight-callout-width` (320px), `--umbra-spotlight-callout-padding`, `--umbra-spotlight-callout-bg`, `--umbra-spotlight-callout-border`, `--umbra-spotlight-callout-radius`, `--umbra-spotlight-title-font`.

Global token added: `layer.spotlight` (1250), between `layer.modal` and `layer.palette`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `target` | ref \| CSS selector \| function that returns the element | — | What to light |
| `open`, `defaultOpen`, `onOpenChange` | | closed | |
| `title` | node | — | |
| children | node | — | The text of the callout |
| `actions` | node | — | Buttons in place of the built-in ones |
| `steps` | list of `{ target, title?, body?, placement?, interactive? }` | — | A tour |
| `step`, `defaultStep`, `onStepChange` | number, from 0 | 0 | The step shown |
| `onFinish` | function | — | The last step, or a coach mark, was ended with its button |
| `interactive` | boolean | `false` | The target can be used |
| `dismissable` | boolean | `true` | Escape and a press on the dim close it |
| `padding` | pixels | 4 | Space between the target and the ring |
| `radius` | pixels \| CSS length | card radius | Corners of the cut-out |
| `placement` | as `Popover` | `end` | Side of the target, and alignment |
| `offset` | pixels | 12 | Gap between ring and callout |
| `headingLevel` | 1 to 6 | 2 | |
| `aria-label` | string | — | Name of the dialog without a title |
| `nextLabel`, `backLabel`, `skipLabel`, `doneLabel` | string | "Next", "Back", "Skip", "Done" | |
| `progressLabel` | function (current, total) → string | "2 of 5" | |

### 3. Parts

`title`, `body`, `progress`, `actions` (the buttons). `ring`, `shield`, `callout` and `footer` carry `data-part` and are styled, not replaced: the first two are the mechanism.

### 4. Blocks

`Spotlight.Root` (target, state, `interactive`, `dismissable`, `padding`, `radius`, `onTargetLost`), `Spotlight.Callout` (`placement`, `offset`, `stepKey`, `aria-label`), `Spotlight.Title`, `Spotlight.Body`, `Spotlight.Footer`. The tour (steps, progress, buttons) is the all-in-one's; a hand-built tour changes `target` and `stepKey` itself.

## Behaviour as space shrinks

1. The callout is on the `placement` side; when that side has too little room it flips to the opposite side.
2. When neither side has room it stays inside the window, 8px from the edge, and covers part of the target.
3. The callout is at most 320px wide and never wider than the window; its text wraps, its buttons wrap under the progress, and it scrolls inside when it is taller than the window.
4. A target larger than the window is ringed where it is visible; the ring is cut by the window's edge.

## Interaction and accessibility

- **Target.** Found when the spotlight opens and at every step. One inside a scroll area is scrolled into view (`scrollIntoView`, nearest edge). The ring follows it: its place is read once per frame, and only after a resize of the window or of the target (`ResizeObserver`), a scroll anywhere (one listener, on the way down), or the end of a transition or animation. Nothing is written to the page in between.
- **A target that is not there**, or that leaves the page: nothing is dimmed. A coach mark closes (`onOpenChange(false)`); a tour passes the step over in the direction it was going, and closes after the last.
- **Not interactive (default).** Everything but the callout is `inert`, the target included, and a press anywhere on the dim or the target closes the spotlight (if `dismissable`). The callout has `aria-modal="true"`.
- **Interactive.** The target is left out of the inert page and of the shields: presses and keys reach it. Popovers, menus, select lists and tooltips it opens are lifted above the dim (`[data-umbra-spotlight]` in the base stylesheet). No `aria-modal`.
- **Callout.** `role="dialog"`, named by its title (or `aria-label`), described by its body. Focus moves to it when the spotlight opens and at every step; the text is also in a polite live region, so it is spoken when a step changes while the focus stays inside. Tab moves through its buttons (and the target when interactive).
- **Closing.** Escape (focus in the callout, in the target or on nothing), a press on the dim, the Done or Skip button. Focus returns to where it was when the spotlight opened, or to the first control of the page when that is gone. The next opening of an uncontrolled tour starts at its first step.
- **Layers.** `--umbra-layer-spotlight`: above a modal, below the command palette. A spotlight whose target is inside a modal is rendered into that modal's backdrop (as popovers are), so the modal stays open under it, Escape closes the spotlight first, and a press on the dim does not close the modal. The palette opens over a spotlight and returns the focus to it.
- **Motion.** The spotlight fades in over the modal duration and leaves at once. Nothing moves: the ring goes to the next target without a slide, so reduced motion changes nothing.
- **Contrast.** The target is not covered by anything, so its colours are untouched. The ring is the primary text colour: at least 3:1 against the dim and against the page around the target on all four tints (tested from pixels).
- Right to left: `placement` sides are logical; the ring follows the target wherever it is.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **Cut-out technique**: one element over the target, empty and without pointer events, with two box shadows: the ring, and the dim spread over the window (`100vmax`). Chosen over four dim rectangles (no rounded corners) and over an SVG mask or `clip-path` (more code, and a mask needs its own hit-testing). It never blocks the target, and works in every supported browser. Presses on the dim are stopped by separate transparent shields.
- **Ring**: crisp 2px, the primary text colour. No glow and no pulse (`plan/interaction.md`). Not pink, so it is not taken for the focus ring; not violet, which has under 3:1 on the dim.
- **`interactive`** defaults to `false`: a coach mark shows, it does not offer. Per step in a tour.
- **`dismissable`** covers Escape and a press on the dim together.
- **Tour**: built in (`steps`), the fuller option. A missing step is passed over, not an error. The progress counts every step, also one passed over.
- **Layer**: `layer.spotlight` = 1250 (decision 6 of `plan/reviews/milestone-2.md`). `useOverlayLayer` knows the layer; the lift of the target's own overlays is a rule of the base stylesheet.
- **The callout is a React Aria popover** with the ring as its anchor: the same placement and flipping as `Popover`, and its place in React Aria's stack of overlays, which is what keeps a modal below from closing on a press outside it. Three things are worked around, each commented in the code: it is placed again when the ring moves (React Aria only does so on a resize); it is brought back inside the window when neither side has room; its hidden "Dismiss" button is removed when the spotlight is not dismissable.
- **Inert, not a focus trap**: the page outside is made inert by the component itself (React Aria's helper is not exported by `react-aria-components`). What was inert already is left alone and restored by its owner.
- No new icon.

Weaker than it could be:

- A target that moves without a resize, a scroll or a transition (an app that sets `left` from a timer) is followed at the next of those events, not at once.
- When neither side has room the callout covers part of the target instead of trying above and below.
- If the document itself scrolls (the library's pages never do), React Aria closes a dismissable callout.
