---
"color-map": minor
---

Add the color core at `color-map/color`: parse any CSS Color 4 color (hex, named, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()`), convert between 15 color spaces, serialize with `toCss()` and `toHex()`, check and fix gamut with `inGamut()` and `toGamut()` (CSS Color 4 mapping or clip), and compare with `deltaEOK()` and `equals()`. Colors are plain `{ colorSpace, components, alpha? }` objects with `null` for `none`. `fromArgb()` and `toArgb()` convert to and from Material Color Utilities' integer colors. Each space is its own module, so importing one space costs only that space. The existing `createColors`, `createColorsFromMap`, `rgbHex` and `rgbaString` are unchanged.
