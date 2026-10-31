---
"color-map": minor
---

Add `color-map/scale`: `createScale()` with the `tailwind-11`, `radix-12`, `tone-13` and `even` presets (or your own lightness, chroma and hue-shift curves), `createContrastScale()` to pick each step by target contrast, `scaleFromBrand()` for a 12-step scale with your brand color exactly at step 9, and `tonalPalette()` for L* tones, where tones 40 apart reach contrast 3. `mix()` now also treats the hue of a converted gray as missing in `hsl` and `hwb`, and converting white to `hsl` gives saturation 0.
