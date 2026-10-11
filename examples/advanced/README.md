# Advanced example

A back-office app with four sections and client-side routing. It is a starting point for an app with a router
([use it as a template](#use-it-as-a-template)).

| It shows                                                                                                            | Where                             |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| A tiny hash router, and `renderLink` on every component that takes links                                            | `src/router.tsx`, `src/App.tsx`   |
| The theme: one `brand`, and a context tint per section through `Page context`                                       | `src/App.tsx`, `src/sections/`    |
| The shortcut registry (`Alt+1` to `Alt+4`, `N`), the history keys, a command palette and the `ShortcutsSheet` (`?`) | `src/App.tsx`                     |
| A tour of the frame with `Spotlight` (`Shift+T`), and an `EntitySwitcher` that steps through the clients            | `src/App.tsx`                     |
| A `Planner` of the orders by due date, with a `WeekStrip` of the selected week                                      | `src/sections/Planner.tsx`        |
| List + detail: a `List` selection in the route, driving a `PageHeader` and a `KeyValueList`                         | `src/sections/Clients.tsx`        |
| A `DataTable` with sorting, priority columns, bulk actions in an `ActionBar` with a `SplitButton`, a confirm dialog | `src/sections/Orders.tsx`         |
| A form in a `Modal` that is a route (`#/orders/new`, `#/orders/o-1004`), with a `Stepper`                           | `src/sections/Orders.tsx`         |
| Settings: `VerticalNav`, `FormField` rows, `Toggle`s, a `Slider` and the density switch                             | `src/sections/Settings.tsx`       |
| A component of your own, built with all four customisation layers                                                   | `src/components/ContactsCard.tsx` |

## Run it here

```sh
npm install                    # at the repository root
npm run build                  # builds umbra-ui, which this example imports
npm run examples -- advanced   # installs this example against that build, and builds it
npm run dev --prefix examples/advanced
```

After a change to the library, run the second and third lines again: the example holds a copy of the
built package, not a link to the source.

The data is made up in `src/data.ts` and kept in memory: a reload brings it back.

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
