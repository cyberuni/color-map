---
"color-map": minor
---

`color-map` now re-exports `color-map/color`, `color-map/scale`, `color-map/palette` and `color-map/tokens`, so `import { parse, toCss } from 'color-map'` works. With a bundler, this costs nothing extra.

Add `color-map/legacy` with `createColors`, `createColorsFromMap`, `rgbHex`, `rgbaString` and their types. The root still exports these names, unchanged, but marks them deprecated: 3.0 removes them from the root, so import them from `color-map/legacy`.
