# 02 — Behaviour base: React Aria Components

**Decided** 2026-10-10.

- Menus, selects, modals, popovers, tooltips, tabs, checkboxes, radios, toggles and sliders are built on React Aria Components. umbra-ui supplies all styling and its own prop API on top.
- Reason: the strongest keyboard and screen-reader support available, which matches the keyboard scope in `../interaction.md`.
- React Aria types and components are not re-exported as public API, so the base can be replaced later without breaking users.

**Rejected**: Base UI (lighter, less depth for grids and complex keyboard cases). From scratch (slow, easy to get accessibility wrong).
