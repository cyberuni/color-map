---
"color-map": patch
---

Make `parse`, `toGamut` and `mix` faster, with the same results and no API change. `parse` reads hex and the plain functional forms by char code (about 2.4 times faster, on the repository benchmark), `toGamut` into `srgb` searches in linear sRGB (about 4.6 times), and `mix` skips the `none` and powerless-hue work when no component is `none` (about 3 times). Anything the fast parse path does not take still goes through the previous parser, so every accepted form and error message is unchanged. The gzip size of the convert-from-a-string scenario grows by about 0.9 kB.
