You are reviewing umbra-ui, an open-source React component library for
full-window, data-dense applications. Another session built Milestone 0
(foundation). Your job is to check, independently, whether Milestone 0 is
complete according to the plan. You are a reviewer: do not fix anything, and do
not start Milestone 1.

Be sceptical. AGENTS.md says Milestone 0 is built; treat that as a claim to
test, not a fact. Judge from the code and from what you run, not from commit
messages or status tables.

Read these first, in this order:
1. AGENTS.md: overview, repo map, binding decisions, commands, conventions.
2. plan/roadmap.md: Milestone 0 scope, its "done when" test, and the
   per-component definition of done.
3. plan/prompts/milestone-0.md: the instructions the building session had.
   Its rules are part of what you verify.
4. plan/layout.md, plan/interaction.md, plan/decisions/ (all seven),
   plan/tokens.json.
5. plan/specs/ (14 files).
6. plan/reference/index.html and its shot-*.png renders.

Then verify, in this order:

A. The checks run clean on a fresh state.
   - Run `npm ci`, then lint, typecheck, unit tests, build, the example build
     and `npm run test:visual`. Report exact pass and fail counts.
   - Run the interaction tests several times
     (`npx playwright test interactions --repeat-each 5`) to find flaky ones.
   - Check the latest CI run with `gh run list`.

B. The "done when" test, in a real browser, by your own measurement.
   - Do not rely only on the existing tests: write a throwaway Playwright
     script (outside the repo, or delete it afterwards) that opens the
     full-screen three-column story and the example app.
   - At 1920x1080, 1280x720, 1024x600, a few sizes in between and a few odd
     ones (for example 1024x1400, 2560x600), at all three densities, check
     that the document does not overflow and that no card is cut off by its
     parent.
   - Check that the stack-collapse rule holds exactly as plan/layout.md and
     plan/specs/Columns-Stack.md state it: which cards collapse, in which
     order, that the popover opens, and that it reverses when space returns.
   - Check tab mode below 1024 x 600 (either dimension), and that exactly
     1024 x 600 is not narrow.
   - Resize repeatedly and quickly, and look for states that get stuck.

C. Each component against its spec. For every spec file, compare with the
   code: purpose, anatomy, variants and states, all four customisation layers
   (tokens, props, parts, blocks), behaviour as space shrinks, interaction and
   accessibility. List every item that is missing, different or untested.
   docs/customisation-tables.md is generated from the source and is a fast way
   to see the real props, parts, blocks and tokens.

D. The per-component definition of done in plan/roadmap.md, all five points,
   for each of the 14 components. Pay attention to the points that are easy to
   skip:
   - stories for every variant and state, including loading, empty and error;
   - keyboard and screen-reader checks (run an accessibility check against
     the stories, for example with axe, and try the keyboard yourself);
   - works on every context tint, not only the default one;
   - WCAG 2.2 AA contrast for text and for non-text parts, per
     plan/interaction.md.

E. The rules in plan/prompts/milestone-0.md and AGENTS.md.
   - React Aria and TanStack types are not in the public API (inspect the
     built `dist/*.d.ts`).
   - No football-specific or other domain-specific names, props or sample
     data anywhere in src/, docs/, examples/ or stories.
   - No asset, logo or name from screenshots/ is used; screenshots/ is not in
     git history (`git log --all -- screenshots`); no local file paths and no
     real club, competition or person names in committed files.
   - Tokens have one source: no colour, size or duration from
     plan/tokens.json is hard-coded in component CSS where a variable exists.
   - Package shape: ESM only, React 19+, entries `umbra-ui`,
     `umbra-ui/charts`, `umbra-ui/styles.css`, tree-shakeable.
   - Every commit builds and passes: spot-check a few commits in a temporary
     git worktree. One known exception is recorded in AGENTS.md under
     "Known issues"; confirm it and look for others.
   - Specs were updated where the code differs, and AGENTS.md is current.

F. The look, against plan/reference/. Open the reference screen and the
   full-screen story side by side at the three reference sizes and list
   visible differences in spacing, type, colour and proportion. The story uses
   placeholder content, so compare the frame, bars, cards and controls, not
   the content.

G. The docs: README, docs/getting-started.md, docs/layout.md and
   examples/basic. Follow them literally as a new user would, in a temporary
   folder outside the repo, and report every step that fails or misleads.

Report format. Reply in short bullets and short tables only.
1. Verdict: complete, complete with gaps, or not complete.
2. A table of findings: id, area (A to G), severity (blocks Milestone 0 /
   should fix before Milestone 1 / minor), what you observed, how to
   reproduce, and the spec or plan line it contradicts.
3. What you could not verify, and why.
4. Things the plan itself gets wrong or leaves undefined.

Rules:
- Do not change library code, specs, tests or baselines. Do not commit or
  push. If you create files to test with, remove them and confirm with
  `git status` that the tree is clean at the end.
- Do not publish to npm.
- If a check cannot run (a missing browser, a port in use), fix the
  environment or say so. Do not skip it silently.
- Each spec ends with decisions the owner has approved ("Resolved"). Do not
  report those as defects; if you think one is a mistake, say so in section 4.
