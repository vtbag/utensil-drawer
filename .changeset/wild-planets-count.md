---
'@vtbag/utensil-drawer': patch
---

Prevents an incompatibility between Chromium and Safari when setVector is called twice inside the same view transition, which led Safari to find no verctors at all.
