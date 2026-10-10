You are starting the implementation of umbra-ui, an open-source React component
library for full-window, data-dense applications. Planning is complete and
approved; no library code exists yet. Your job in this session is Milestone 0
(foundation) from plan/roadmap.md.

Read these first, in this order, before writing anything:
1. AGENTS.md: project overview, repo map, binding decisions, task playbooks.
2. plan/roadmap.md: Milestone 0 scope, its "done when" test, and the
   per-component definition of done.
3. plan/layout.md and plan/interaction.md: the layout and behaviour rules.
4. plan/decisions/ (all seven files): the tech stack. These are decided; do
   not re-open them. If one turns out to be unworkable, stop and tell me why.
5. plan/tokens.json: the design tokens.
6. plan/specs/: one approved spec per tier 0 component (14 files). Card.md is
   the template for any spec you add later.
7. plan/reference/index.html and its shot-*.png renders: the visual ground
   truth for the look. Match it. It is static HTML, so it does not show stack
   collapse, tab mode, overflow menus or motion; those come from the specs.

Work in this order:
1. Repo setup. Run git init (this folder is not a repository yet), then set up
   the GitHub repository as described under "Git and GitHub" below. Set up the
   package (TypeScript, ESM only, React 19+, CSS Modules compiled to one
   stylesheet, entries `umbra-ui`, `umbra-ui/charts`, `umbra-ui/styles.css`),
   Storybook, and visual regression tests that capture stories at several
   window sizes and all three density levels. Generate the CSS variables from
   plan/tokens.json so the tokens have one source.
2. UmbraProvider and UmbraScope.
3. Layout: AppShell, Page, Columns, Stack, Slot, Card, CardHeader,
   SectionTitle, ScrollArea. This is the core of the library; the rules in
   plan/layout.md must hold exactly, including Stack collapsing low-priority
   cards to their header and Columns switching to tabs below 1024 x 600.
4. Shell: TopBar, PrimaryNav, SubNav.
5. Basics: Button, IconButton, Skeleton.
6. Docs: README, the getting-started and layout guides, the `basic` example
   app, and the generator for per-component customisation tables.

Git and GitHub:
- Before the first commit, add a .gitignore that excludes screenshots/ along
  with the usual build and dependency folders. The screenshots are third-party
  copyrighted images and must never be committed or pushed. Confirm with
  `git status` that none is staged.
- Create a new public GitHub repository asafmor/umbra-ui with the gh CLI
  (already logged in as asafmor), and set it as origin. If creating it fails,
  stop and tell me; do not create it under another account or name.
- plan/ is committed in full, including plan/inventory/.
- Commit automatically, without asking, in small commits: one logical change
  each (one component, one config change, one doc), with a clear message.
  Never commit failing code: build and tests pass at every commit.
- Push to origin after every commit or small group of commits.
- Never force-push, never rewrite pushed history, never commit secrets or
  local environment files.

Rules:
- Every component follows its spec and exposes all four customisation layers
  (tokens, props, parts, blocks) as defined in
  plan/decisions/07-customisation.md.
- The page never scrolls. Verify it, do not assume it: for each step, run the
  stories in a real browser and check there is no document overflow at
  1920x1080, 1280x720 and 1024x600, at all three densities.
- Keep React Aria and TanStack types out of the public API.
- No football-specific or other domain-specific names, props or sample data.
- Do not copy any asset, logo or name from the images in screenshots/.
- Specs list "Open questions". When you reach one, ask me; do not decide
  silently. Ask me as well before any choice that changes how developers use
  the library.
- When code and spec disagree, fix the spec in the same change and tell me.
- Do not publish to npm.
- Keep AGENTS.md current: update "Current state" and "Next step" after each
  step, and add the build, test and Storybook commands once they exist.

Milestone 0 is done when a three-column page of placeholder cards fills any
window from 1024 x 600 up with no page scroll, the stack-collapse rule works,
and all three density levels pass the visual tests. Show me that result
running, with the test output, before calling it done.

Reply to me in short bullets and short tables only. Start by reading the
files above, then tell me your plan for step 1 and any questions before you
write code.
