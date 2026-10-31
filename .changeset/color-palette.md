---
"color-map": minor
---

Add `color-map/palette`: `harmony()` (complementary, split, analogous, triadic and tetradic, rotated in OKLCH by default), `harmonize()` (Material's rule: move a hue half the way toward another, at most 15°), `inverse()`, `darkVariant()` (`mirror`, `tone-swap` or `lightness-invert`), `semanticPalette()` (primary, status, surface and outline roles, each pair recording its contrast) and `validate()` (failing pairs, scales whose lightness is not steady, and out-of-gamut colors). Tone gaps of 50 give about 4.5 on WCAG 2, and 4.48 at the worst pair.
