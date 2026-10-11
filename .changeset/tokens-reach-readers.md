---
'umbra-ui': patch
---

A token set on an ancestor now reaches every component inside a container: `--umbra-badge-*` inside a button or a filled bar, `--umbra-avatar-size` and `--umbra-entity-icon-size` inside `PageHeader`, `--umbra-focus-color`, `--umbra-focus-offset`, `--umbra-icon-size` and `--umbra-icon-button-size` inside `TopBar`, `Banner`, `DataTable`, `Legend`, `EmptyState`, `ListItem` and `GroupHeader`, and `--umbra-scroll-fade-color` inside `Card`, `Modal`, `Popover` and `Accordion`. A container's own token (for example `--umbra-table-focus-offset`) now sets the default inside it and gives way to the global token. The customisation tables list each token's default.
