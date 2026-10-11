# Releasing

For the maintainer. A release is made by hand, from a clean `main`, in two commands with a review
between them.

> **Only the owner releases.** Nobody else, and no coding agent, runs `npm run release` or `npm publish`,
> creates a tag or a GitHub release, or changes the repository settings. Everything else on this page
> (`npm run version` on a branch, the checks, the dry run) is safe: none of it leaves your machine.

## Before

| Check                                            | How                                         |
| ------------------------------------------------ | ------------------------------------------- |
| You are on `main`, up to date, nothing to commit | `git status`                                |
| CI is green on that commit                       | The badge in the README, or the Actions tab |
| You are signed in to npm as the package owner    | `npm whoami`                                |
| The release can be made                          | `npm run build && npm run release:check`    |

`release:check` rehearses the version bump on a copy in a temporary folder and prints what it would
release (`umbra-ui 0.0.0 -> 0.1.0`), then checks that the package holds every file its `exports` name
and nothing outside `dist/`. CI runs it on every push.

## The steps

| #   | Command                                       | What it does                                                                                                                                                                                                                        |
| --- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `npm run version`                             | Turns the pending changesets (`.changeset/*.md`) into the new version in `package.json` and a new section at the top of `CHANGELOG.md`, deletes them, and updates `package-lock.json`. Publishes nothing.                           |
| 2   | `git diff`                                    | Review: the version, and `CHANGELOG.md` as a user will read it. Edit the changelog by hand if it needs it.                                                                                                                          |
| 3   | `git add -A && git commit -m "Release 0.1.0"` | The release commit.                                                                                                                                                                                                                 |
| 4   | `npm publish --dry-run`                       | Optional. Builds, and lists the files and the size of what would be published. Uploads nothing.                                                                                                                                     |
| 5   | `npm run release`                             | Lint (with the docs samples), typecheck, unit tests, build, the final package check, then `changeset publish`: it publishes `umbra-ui` to npm and creates the git tag `v0.1.0`. It asks for your one-time password if you have one. |
| 6   | `git push --follow-tags`                      | Pushes the release commit and the tag.                                                                                                                                                                                              |

- Step 5 stops before publishing when a changeset is still pending, the version is still `0.0.0`,
  `CHANGELOG.md` has no section for the version, or a file named in `exports` is missing.
- The example apps are not part of the release. They are plain folders, not workspaces, so Changesets
  never sees them; they are also `private`.
- The browser tests are not part of `npm run release` (they take about ten minutes). CI runs them: wait
  for it to be green on the commit you release.
- A version that is already on npm is skipped by `changeset publish`, so running step 5 twice is safe.

### The bump

Each changeset names its bump. Until `1.0.0`: `minor` for a new component, a new prop or a changed
prop; `patch` for a fix. The changesets waiting now are all `minor`, so the first release is `0.1.0`;
`release:check` fails if they ever add up to anything else before the first release.

## Once, for the first release (`0.1.0`)

Before step 1:

1. **Remove the pre-release notes.** Each is a block between `<!-- pre-release: remove at 0.1.0 -->`
   and `<!-- /pre-release -->`. Delete the two comments and what is between them:

   | File                           | Says                                          |
   | ------------------------------ | --------------------------------------------- |
   | `README.md`                    | "Not on npm yet", install from GitHub         |
   | `docs/getting-started.md`      | The same, in step 1                           |
   | `examples/basic/README.md`     | Step 2 of "Use it as a template", from GitHub |
   | `examples/dashboard/README.md` | The same                                      |
   | `examples/advanced/README.md`  | The same                                      |

   `git grep -n "pre-release"` must find nothing in those files afterwards.

2. **Check the name is free**: `npm view umbra-ui` must answer 404.

After step 6:

3. In a fresh Vite app, `npm install umbra-ui` and build the first page of the README.
4. **The `prepare` script.** `package.json` builds the package on `prepare`, which is what makes
   `npm install github:asafmor/umbra-ui` work. npm 11 prints an "allow-scripts" warning that names
   `prepare: npm run build` when the package is installed from GitHub or from a tarball file. Look at
   the output of step 3: if the warning also shows for the install from the registry, rename the script
   to `prepack` (it then runs for `npm pack` and `npm publish` only) and release a patch. Installing from
   GitHub stops working with that change, which is fine once the package is on npm.
5. Optional: a GitHub release from the tag, with the `0.1.0` section of `CHANGELOG.md` as its text.

## Publishing Storybook

`.github/workflows/docs.yml` builds Storybook (the components and the guides) and deploys it to GitHub
Pages. It runs only when started by hand, so it cannot fail before Pages is enabled.

1. Repository **Settings > Pages > Build and deployment > Source**: choose **GitHub Actions**.
2. **Actions > Docs > Run workflow**, on `main`.
3. The run prints the address of the site (the `deploy` job, under `github-pages`).
4. Add that address to the README, in "Learn more", in place of the `npm run storybook` row, and to
   `homepage` in `package.json`.

> **For the owner to fill in**: the address is not written anywhere yet, because it is only known once
> Pages is enabled. Without a custom domain GitHub serves a project site at
> `https://<account>.github.io/<repository>/`.

To publish on every release instead of by hand, add a `push: tags: ['v*']` trigger to the workflow once
the first run has worked.

## Installing from GitHub

`npm install github:asafmor/umbra-ui` clones the whole repository, with its history and the baseline
images of the visual tests (about 250 MB), installs the development dependencies and builds the package.
It takes minutes and is meant for trying an unreleased commit only. The package on npm holds `dist/`,
the README, the licence and the changelog: about 200 kB.

## Trying a release without publishing

```sh
git clone . ../umbra-release-rehearsal && cd ../umbra-release-rehearsal
npm ci
npm run version          # 0.1.0 and CHANGELOG.md, in the clone only
npm publish --dry-run    # the file list; uploads nothing
```

Delete the clone afterwards. Do not push from it.
