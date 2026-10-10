---
'umbra-ui': patch
---

`ScrollArea`: `onReachEnd` is called once each time the end is reached. It was called again on every render while the area stayed at its end.
