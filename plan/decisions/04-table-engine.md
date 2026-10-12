# 04 — Table engine: TanStack Table

**Decided** 2026-10-10.

- `DataTable` uses TanStack Table for logic: sorting, column visibility, row models.
- umbra-ui adds: rendering, cell widgets, row highlight and accent, group headers, and the rule that hides columns by `priority` as width shrinks.
- TanStack types are not exposed in the public API; `DataTable` has its own column definition format.
- **To design**: keyboard grid navigation. TanStack Table does not provide it and React Aria's table is not used, so arrow-key movement between cells is ours to build.
- Out of scope (decided earlier): end-user column editing and saved views.
- **Changed 2026-10-11** (owner's finding O-2): end-user column show/hide, reorder, pin and resize are in scope. Saving them is the app's: the table is controlled (`columnState`, one JSON value) and ships no storage. Named saved views stay out of scope. The engine still holds column visibility; order, widths and pins are applied to the column list before the fit rule, because the table lays its columns out itself (`plan/specs/DataTable.md`, "Resolved").

**Rejected**: own logic (grouping, pinning and virtual scrolling would each be ours later). React Aria Table (weaker for column visibility rules and large data).
