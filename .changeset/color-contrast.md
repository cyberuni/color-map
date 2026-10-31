---
"color-map": minor
---

Add contrast to `color-map/color`: `contrast()` (WCAG 2 by default), `meets()` with named levels such as `AA`, `onColor()` for readable text on a background, and `findContrast()` to find a color of a given hue and chroma that reaches a target and report the ratio it achieves. Any `(fg, bg) => number` function, or a `ContrastFn` with thresholds, replaces WCAG 2, for example an APCA function built on colorjs.io. `mix()` now treats the hue of a converted gray as missing in `oklch` and `lch`, so mixing white with blue in `oklch` keeps blue's hue.
