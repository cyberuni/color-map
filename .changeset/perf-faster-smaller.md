---
"color-map": patch
---

Speed up color conversion, `toGamut`, `contrast`, `mix` and the scale and palette builders (`semanticPalette` runs about 1.8 times as fast), and shrink every entry point's gzip size slightly. Every result is unchanged, to the last bit.
