---
'umbra-ui': patch
---

Right to left no longer depends on the page's `lang`: rules that mirror details (drawer side, progress direction, scroll fades, carets, badges) now follow `dir`. The direction of a locale is right in Firefox before 153. `EmptyState` is centred and a chart with `height="content"` has its height in older Safari. Source maps point at the right line in modules with blocks (Avatar, KeyValue, Checkbox, Radio, Tabs, Menu, Modal).
