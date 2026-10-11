# Contributing to umbra-ui

Thank you for helping. This page says how to set up, what a change needs, and where the rules are.
By taking part you agree to the [code of conduct](CODE_OF_CONDUCT.md).

## Before you start

- **A bug**: open an issue with a reproduction (the bug report form asks for one).
- **A new component, prop or behaviour**: open an issue first. The library is opinionated, and some
  things are decided: the page never scrolls, components fill their slot, names and sample data are
  domain-neutral. [`AGENTS.md`](AGENTS.md) lists the decisions that bind every change.
- **A security problem**: do not open an issue. See [`SECURITY.md`](SECURITY.md).

## Set up

Node 24 (what CI runs) and npm.

```sh
git clone https://github.com/asafmor/umbra-ui.git
cd umbra-ui
npm install                         # also generates the token CSS and builds the package
npx playwright install chromium     # for the browser tests
npm run storybook                   # the workshop, on port 6006
```

## Commands

| Command                 | Does                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `npm run lint`          | ESLint, Prettier, the generated tables, and every code sample in the docs                          |
| `npm run typecheck`     | TypeScript                                                                                         |
| `npm test`              | Unit tests                                                                                         |
| `npm run test:visual`   | Every story in a browser: captures, no page scroll, accessibility, interactions                    |
| `npm run test:examples` | The three example apps, built and driven in a browser                                              |
| `npm run docs:tables`   | Regenerates `docs/customisation-tables.md` after a change to props, parts, blocks or CSS variables |
| `npm run format`        | Prettier, writing                                                                                  |

The full table, with what each command covers, is in [`AGENTS.md`](AGENTS.md#commands).

## What a change needs

Every commit passes lint, typecheck and the unit tests, and the browser tests pass before a pull
request is merged. The pull request template has the checklist:

1. **The spec** in `plan/specs/` is updated in the same change as the code (written first, for a new
   component, from `plan/specs/Card.md`).
2. **Stories** for every variant and state.
3. **Tests** for what a still image cannot show: keys, focus, each step of shrinking.
4. **A changeset**, when users of the library will notice the change (below).
5. **The generated tables** are up to date: `npm run docs:tables`.

The rules for building a component (the four customisation layers, tokens, states, accessibility,
naming) are in [`plan/prompts/component-brief.md`](plan/prompts/component-brief.md). Read it before
adding one; it is short.

### Adding a changeset

```sh
npm run changeset
```

Pick the bump (`patch` for a fix, `minor` for anything new or changed, until `1.0`) and write one or
two sentences for the changelog, for a user of the library: what they can now do, or what changed for
them. It makes a small file in `.changeset/`; commit it with the change. Docs, tests and refactors that
users cannot notice need none.

### Baseline images

The visual tests compare every story with a stored image. When your change alters how something looks,
run `npm run test:visual:update`, **look at every image that changed**, and commit them with the code.
Prefer adding a variant to an existing story over adding a story: each story costs about fifteen
images (`plan/decisions/06-docs-and-testing.md`, "Baseline images").

### The `screenshots/` folder

The design was inspired by a set of third-party screenshots that some contributors have locally in
`screenshots/`. They are copyrighted: **never commit or push them**, never copy a logo, a name or an
asset from them, and keep the folder in `.gitignore`. Names of real people, places, clubs,
competitions, companies and products stay out of the code, the stories, the docs and the plan.

## Releases

Only the owner releases. The steps are in [`docs/releasing.md`](docs/releasing.md).

## Licence

Contributions are made under the [MIT licence](LICENSE) of the project.
