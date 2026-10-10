# Advanced example

A back-office app with three sections and client-side routing. Copy it as a starting point for an app
with a router.

| It shows                                                                                       | Where                             |
| ---------------------------------------------------------------------------------------------- | --------------------------------- |
| A tiny hash router, and `renderLink` on every component that takes links                       | `src/router.tsx`, `src/App.tsx`   |
| The theme: one `brand`, and a context tint per section through `Page context`                  | `src/App.tsx`, `src/sections/`    |
| The shortcut registry (`Alt+1` to `Alt+3`, `N`), the history keys and a command palette        | `src/App.tsx`                     |
| List + detail: a `List` selection in the route, driving a `PageHeader` and a `KeyValueList`    | `src/sections/Clients.tsx`        |
| A `DataTable` with sorting, priority columns, bulk actions in an `ActionBar`, a confirm dialog | `src/sections/Orders.tsx`         |
| A form in a `Modal` that is a route (`#/orders/new`, `#/orders/o-1004`)                        | `src/sections/Orders.tsx`         |
| Settings: `VerticalNav`, `FormField` rows, `Toggle`s and the density switch                    | `src/sections/Settings.tsx`       |
| A component of your own, built with all four customisation layers                              | `src/components/ContactsCard.tsx` |

```sh
npm install        # at the repository root
npm run build      # builds umbra-ui, which this example imports
npm run dev -w examples/advanced
```

The data is made up in `src/data.ts` and kept in memory: a reload brings it back.
