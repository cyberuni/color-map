---
"color-map": minor
---

Add `color-map/tokens`: `toDTCG()` (a DTCG 2025.10 token file with a hex fallback; `none` components print as `"none"`), `toCssVariables()` (custom properties in one rule) and `toTailwindTheme()` (a Tailwind v4 `@theme` block in oklch). They take a color, a CSS string, an array (a scale; 11 colors get the keys 50 to 950), a nested object, or a `semanticPalette()` result.
