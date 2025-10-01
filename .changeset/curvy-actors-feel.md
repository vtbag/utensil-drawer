---
'@vtbag/utensil-drawer': patch
---

The `declarative-names` script can now skip elements that are outside the viewport!

Use the new `:in-viewport` pseudo-class to target only element that have an overlap with the current viewport. For example `":is(h2,h3):in-viewport = heading-"` 
