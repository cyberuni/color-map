---
"color-map": minor
---

Add `createGradient()` to `color-map/scale`: it returns a number of colors along a gradient through color stops, the way a CSS gradient blends them. A stop is `{ color, at? }` or a bare color; stops without a position spread evenly; `in` and `hue` work as they do in `mix()`, with `oklab` by default; each stop's color carries its own alpha. `createColorsFromMap` is now deprecated in favor of `createGradient`, with no change in behavior.
