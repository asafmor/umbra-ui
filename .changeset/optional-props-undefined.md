---
'umbra-ui': minor
---

Every optional prop, part prop, block prop and option type (columns, items, series, commands, shortcuts) accepts an explicit `undefined`, so an app with `exactOptionalPropertyTypes` can write `prop={condition ? value : undefined}`. `numberColumn` and `actionsColumn` keep their defaults when a member is passed as `undefined`.
