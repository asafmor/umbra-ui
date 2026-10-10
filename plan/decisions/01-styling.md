# 01 — Styling: plain CSS with CSS variables

**Decided** 2026-10-10.

- Styles are authored as CSS and compiled to one stylesheet at build time. Apps import `umbra-ui/styles.css` once.
- Every token is a CSS variable. Apps override brand and context tint by setting variables (through the provider or in their own CSS).
- Density levels and context tints are attribute-scoped sets of variables, so they can be set on the provider or on any subtree.
- Size-based behaviour uses native container queries (see `../layout.md`).
- No runtime style generation.

**Rejected**: Tailwind-based (forces Tailwind on every app; overrides get tangled). Runtime CSS-in-JS (slower; awkward with server rendering).

**Confirmed 2026-10-10**: CSS Modules as the authoring format; class names are not public API, variables and `data-` attributes are.
