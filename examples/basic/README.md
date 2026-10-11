# Basic example

A small full-window app: bars, a three-column page, a stack that collapses, and a density switch.

## Run it here

```sh
npm install                    # at the repository root
npm run build                  # builds umbra-ui, which this example imports
npm run examples -- basic      # installs this example against that build, and builds it
npm run dev --prefix examples/basic
```

After a change to the library, run the second and third lines again: the example holds a copy of the
built package, not a link to the source.

## Use it as a template

The folder is a complete Vite app: its own `package.json`, `tsconfig.json` and `vite.config.ts`.

1. Copy the folder out of the repository (without `node_modules` and `dist`).
2. Swap the local dependency for the published package: `npm install umbra-ui@latest`. It replaces
   `"umbra-ui": "file:../.."` in `package.json` with the current version.
3. Delete `.npmrc`. It only matters for the `file:` dependency.
4. `npm install`, then `npm run dev`. `npm run build` typechecks and builds; `npm run preview` serves the build.

<!-- pre-release: remove at 0.1.0 -->

Until `0.1.0` is on npm, step 2 is `npm install github:asafmor/umbra-ui`.

<!-- /pre-release -->
