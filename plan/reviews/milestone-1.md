# Milestone 1 review (2026-10-11)

Three independent reviews ran before the first release. This file records what each found and what was done. The component reviews are added by the orchestrator.

## Release readiness

Review 3 asked whether `0.1.0` can be released. Verdict: **ready with gaps**; one finding blocked the release. Numbers are the review's finding ids.

### Fixed

| # | Finding | Fix |
|---|---|---|
| 1 | `changeset version` failed: the root package was also the workspace root. Blocked the release. | No workspaces: the examples are plain folders (`plan/decisions/05-packaging.md`). `npm run version` then `npm run release`, in `docs/releasing.md`. `npm run release:check` rehearses the bump on a temporary copy and checks the tarball; CI runs it. The changesets are one grouped `0.1.0` summary, all `minor`. |
| 7 | A copied example did not build | Each example has a complete `package.json`, a self-contained `tsconfig.json` and a "Use it as a template" section. `npm run examples:standalone` copies each out, installs it against the packed tarball and builds it; CI runs it. |
| 8 | Links between guides were dead in Storybook; Storybook was not deployed | `docs/storybook/Guide.tsx` rewrites the links to Storybook pages; anchors work; a Welcome page. `.github/workflows/docs.yml` deploys to GitHub Pages when started by hand. |
| 9 | No browser support statement | README and getting-started: Chrome and Edge 117, Firefox 121, Safari 16.2, which features are required and which degrade; Chromium-only testing; React 19.0; Node 20; server rendering. |
| 10 | The docs said "not on npm yet" and installed from GitHub | `npm install umbra-ui` first; the GitHub install is a marked block that the release steps delete. `homepage`, `bugs`, `keywords` and `engines` in `package.json`. A "Status and roadmap" section and a CI badge. |
| 11 | 177 MB of baseline images | A policy in `plan/decisions/06-docs-and-testing.md` ("Baseline images"). The npm package holds `dist/` only (checked by `release:check`). History is untouched. |
| 12 | Stale repo map and commands in `AGENTS.md` | Every folder under `src/`, every spec file, every script and command. "Current state" is the orchestrator's. |
| 13 | Commit `37fc048` fails lint | Recorded under "Known issues" in `AGENTS.md`. |
| 14 | The built-in strings table was incomplete | Generated from the source into `docs/customisation-tables.md` ("Built-in strings"); the guide links to it. `Select` and `SearchField` are in the component lists. |
| 15 | Recipe 11 broke at `/` and did not say to install the router | Fixed. |
| 16 | `TokenName` claim; the `recent` icon; `import(".")` in the tables; the tables page overflowed sideways | The docs name `TokenOverrides`; the icon is listed; the generator prints type names only; wide tables scroll inside the page. |
| 18 | Two samples failed under `exactOptionalPropertyTypes` | `npm run docs:check` now compiles every sample with that flag. The two samples were reworded; the prop types are listed under "Open". |
| 20 | Place names in `plan/inventory/` | Replaced with placeholders ("Country A", "Region A", "Division A"). |
| 21 | No community files | `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), issue forms, a pull request template. No e-mail address anywhere. |
| 22 | Open-ended peer range, unchecked on React 19.0 | Checked on 19.0.0 with the packed tarball: a page, the command palette, a tooltip, no console output; `renderToString` on Node 20, 22 and 24. `>=19` stays. |

### Open

| # | Finding | For |
|---|---|---|
| 2, 3, 4, 5, 17 | Types under `node16` resolution, the CSS import in `index.d.ts`, mangled component names, bundle size per import, story helpers in the tarball | The build work |
| 6 | Three flaky browser tests | The component work |
| 18 | Optional props are not typed `\| undefined`, so `prop={condition ? value : undefined}` fails for an app with `exactOptionalPropertyTypes`. Seen on `PageProps.context` and `Command.href`; the pattern is library-wide. | `src/` |
| 19 | Tokens declared and never read: `space-0`, `size-min-window-width`, `size-min-window-height` (the minimum window is a TypeScript constant). Literal durations: Skeleton 1.6s, ProgressBar 1.4s, the spinner 0.9s. | Owner: remove, or read them |
| 11 | Whether to trim the captures per story (12 images now) | Owner |
| 21 | Repository settings: protect `main`, enable private vulnerability reporting and "Reported content", enable Pages | Owner |
| 22 | Whether a registry install prints npm's allow-scripts warning for `prepare` (cannot be known before publishing; `docs/releasing.md` says what to do) | Owner, after the release |

### Not verified

- Firefox and Safari: the minimum versions come from the dates each CSS feature shipped, not from a test.
- `npm publish` itself. The rehearsal stops at `npm publish --dry-run` in a scratch clone.
- The Pages workflow has never run: Pages is not enabled.
