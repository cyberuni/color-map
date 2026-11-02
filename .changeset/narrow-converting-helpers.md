---
"color-map": minor
---

Add narrow forms of the converting helpers to `color-map/color`: `createToHex`, `createInGamut`, `createToGamut`, `createDeltaEOk`, `createEquals`, `createMix`, `createContrast`, `createMeets`, `createOnColor` and `createFindContrast`. Each takes the spaces your colors are in, as `createConverter` does, and returns the helper over just those, so a bundle no longer carries all 15 spaces. Each adds the spaces it works in itself; `createToGamut`, for example, adds `srgb`, `oklch` and `oklab`. The narrow helpers take color objects rather than CSS strings, so they do not carry `parse`. `toHex` over every space is about 3 kB gzip; `createToHex(oklch)` is about 1.3 kB. The existing helpers are unchanged.
