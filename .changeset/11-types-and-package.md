---
'umbra-ui': minor
---

**Types and the package.** ESM only, with its types, one `styles.css` and source maps that point at the library's `.tsx` source. Every optional prop, part prop, block prop and option type (columns, items, series, commands, shortcuts) accepts an explicit `undefined`, so an app with `exactOptionalPropertyTypes` can write `prop={condition ? value : undefined}`. Every module starts with `'use client'`: a React Server Component imports a component directly, and every component renders on a server without a `window`. A component that is imported alone brings only what it needs: under Vite or Rollup a `Button` is about 27 KB gzip and a `Card` about 37 KB at first load, as `Card`, `SectionTitle`, `PageHeader`, `TopBar` and `GroupHeader` load their overflow menu when it is first needed. React 19; Chrome and Edge 117, Firefox 125, Safari 17.0.
