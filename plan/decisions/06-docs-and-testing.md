# 06 — Docs and testing: Storybook with visual tests

**Decided** 2026-10-10.

- Storybook is both the development workshop and the public documentation.
- Every component has stories for each variant and state, including loading, empty and error.
- **Visual regression tests** capture stories at several fixed window sizes and all three density levels. This is the main guard for the layout and shrink rules.
- Interaction and accessibility tests run against the same stories.
- Full-page example stories rebuild reference screens from `screenshots/` (in umbra-ui's own identity) to test components together.

## Getting-started material (added 2026-10-10)

Storybook alone does not teach installing, the layout system or customisation, so the plan adds:

- **README**: install, and a first full-window page in about 20 lines.
- **Five short guides**, written as Markdown in `docs/` and also shown in Storybook: getting started, layout, theming, customisation, recipes (basic to advanced).
- **Generated customisation tables**: per component, its props, part names, blocks and style variables, built from the source (see `07-customisation.md`).
- **Three example apps** in `examples/`: basic, dashboard, advanced. They double as starting templates.
- **Typed, commented props** on every component.

**Not included (owner's choice)**: shipping the Markdown docs inside the npm package with an `llms.txt` index. Coding agents read the guides and examples from the repository.

**Rejected**: a separate designed docs site (more to maintain; can be added later). Docs site only (loses the per-state workshop and its test integration).

**Confirmed 2026-10-10**: ESLint and Prettier; Changesets for the changelog and releases; GitHub Actions runs lint, typecheck, unit tests and build. Visual tests (Playwright against the built Storybook) run locally for now.
