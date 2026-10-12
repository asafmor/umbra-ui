---
'umbra-ui': minor
---

**Known limits of this release.**

- `StarRating` with `step={0.5}`: a press chooses the whole star, so that its target is never smaller than a star; a half is chosen with the arrow keys or by dragging along the stars.
- `Planner`: what `renderWeek` returns is mounted again when the side column collapses or comes back as the planner is resized, so state kept inside it (not in the app) is lost then.
- The automated tests run in Chromium. Firefox and Safari are supported from the minimum versions and looked at by hand; Firefox 153 and 154 draw their own scrollbars in place of the thin ones.
- `HistoryButtons` on the browser history cannot tell whether there is a page to go to in Firefox before 147 and Safari before 26.2: both buttons stay enabled there.
- esbuild with `splitting: true` puts the code the components share in one chunk that loads first (about 66 KB gzip), whatever is imported; esbuild without splitting, Vite and Rollup do not.
