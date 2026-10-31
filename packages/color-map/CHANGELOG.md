# color-map

## 2.3.0

### Minor Changes

- 7998846: Add contrast to `color-map/color`: `contrast()` (WCAG 2 by default), `meets()` with named levels such as `AA`, `onColor()` for readable text on a background, and `findContrast()` to find a color of a given hue and chroma that reaches a target and report the ratio it achieves. Any `(fg, bg) => number` function, or a `ContrastFn` with thresholds, replaces WCAG 2, for example an APCA function built on colorjs.io. `mix()` now treats the hue of a converted gray as missing in `oklch` and `lch`, so mixing white with blue in `oklch` keeps blue's hue.
- 0072bf7: Add the color core at `color-map/color`: parse any CSS Color 4 color (hex, named, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()`), convert between 15 color spaces, serialize with `toCss()` and `toHex()`, check and fix gamut with `inGamut()` and `toGamut()` (CSS Color 4 mapping or clip), and compare with `deltaEOK()` and `equals()`. Colors are plain `{ colorSpace, components, alpha? }` objects with `null` for `none`. `fromArgb()` and `toArgb()` convert to and from Material Color Utilities' integer colors. Each space is its own module, so importing one space costs only that space. The existing `createColors`, `createColorsFromMap`, `rgbHex` and `rgbaString` are unchanged.
- bffd600: Add `createGradient()` to `color-map/scale`: it returns a number of colors along a gradient through color stops, the way a CSS gradient blends them. A stop is `{ color, at? }` or a bare color; stops without a position spread evenly; `in` and `hue` work as they do in `mix()`, with `oklab` by default; each stop's color carries its own alpha. `createColorsFromMap` is now deprecated in favor of `createGradient`, with no change in behavior.
- aba59da: Add the `color-map` command and an agent skill to the package. `npx color-map` runs `convert`, `mix`, `contrast`, `find-contrast`, `scale`, `palette`, `harmony`, `export` and `schema`; output is TOON by default (`--format json` for JSON), errors are coded, and WCAG 2 is the contrast measure. The package also ships JSON Schemas for every command's options (`color-map/schemas/*`), an `llms.txt`, and a `color-map` skill as a plugin for Claude Code, Cursor, Codex and Copilot CLI. The package still has no runtime dependencies, and the library entry points do not load the command.
- 01f8f8a: Add `mix()` for interpolating colors the way CSS does, and `parseExpr()` and `resolve()` for CSS Color 5 values: `color-mix()`, relative colors with a `calc()` subset, `light-dark()`, `contrast-color()`, `currentcolor` and system colors. They are exported from `color-map/color`.
- 887187f: Add `color-map/palette`: `harmony()` (complementary, split, analogous, triadic and tetradic, rotated in OKLCH by default), `harmonize()` (Material's rule: move a hue half the way toward another, at most 15°), `inverse()`, `darkVariant()` (`mirror`, `tone-swap` or `lightness-invert`), `semanticPalette()` (primary, status, surface and outline roles, each pair recording its contrast) and `validate()` (failing pairs, scales whose lightness is not steady, and out-of-gamut colors). Tone gaps of 50 give about 4.5 on WCAG 2, and 4.48 at the worst pair.
- b213db4: Add `color-map/scale`: `createScale()` with the `tailwind-11`, `radix-12`, `tone-13` and `even` presets (or your own lightness, chroma and hue-shift curves), `createContrastScale()` to pick each step by target contrast, `scaleFromBrand()` for a 12-step scale with your brand color exactly at step 9, and `tonalPalette()` for L* tones, where tones 40 apart reach contrast 3. `mix()` now also treats the hue of a converted gray as missing in `hsl` and `hwb`, and converting white to `hsl` gives saturation 0.
- be3ba42: Add `color-map/tokens`: `toDTCG()` (a DTCG 2025.10 token file with a hex fallback; `none` components print as `"none"`), `toCssVariables()` (custom properties in one rule) and `toTailwindTheme()` (a Tailwind v4 `@theme` block in oklch). They take a color, a CSS string, an array (a scale; 11 colors get the keys 50 to 950), a nested object, or a `semanticPalette()` result.
- 42ff99d: `color-map` now re-exports `color-map/color`, `color-map/scale`, `color-map/palette` and `color-map/tokens`, so `import { parse, toCss } from 'color-map'` works. With a bundler, this costs nothing extra.
  
  Add `color-map/legacy` with `createColors`, `createColorsFromMap`, `rgbHex`, `rgbaString` and their types. The root still exports these names, unchanged, but marks them deprecated: 3.0 removes them from the root, so import them from `color-map/legacy`.

### Patch Changes

- 8287110: Speed up color conversion, `toGamut`, `contrast`, `mix` and the scale and palette builders (`semanticPalette` runs about 1.8 times as fast), and shrink every entry point's gzip size slightly. Every result is unchanged, to the last bit.
- 602a460: Fix names such as `constructor`, `__proto__` and `toString` reaching `Object.prototype` in `parse`, `parseExpr`, `meets`, `harmony`, `createScale` and `toDTCG`; they are now unknown names like any other, and `toDTCG` returns groups without a prototype. Make `toCss` about 2.7 times faster with an exact rounding fast path; its output is unchanged.
- 96f4464: Include `CHANGELOG.md` in the published package.
- 85506ca: An unknown preset, scheme, mode, strategy, contrast algorithm or hue method now throws `color-map: unknown <thing> "<value>"; use one of ...` instead of a raw `TypeError` (`createScale({ seed, steps: 'nope' })`) or a silent fallback (`mode`, harmony `space`). An unknown color space also lists the valid ones, and `meets` words its unknown-level error the same way.

Entries from 2.2.0 and earlier were produced by semantic-release, which was
configured without the changelog plugin — 2.1.0 and 2.2.0 exist only as GitHub
Releases and are absent below. Everything from the next release on is written
here by changesets.

## [2.0.6](https://github.com/unional/color-map/compare/v2.0.5...v2.0.6) (2022-10-03)


### Bug Fixes

* re-release again ([cf9ba4c](https://github.com/unional/color-map/commit/cf9ba4c75af52f5803b53a30cb0e003c201595f2))

## [2.0.5](https://github.com/unional/color-map/compare/v2.0.4...v2.0.5) (2022-10-03)


### Bug Fixes

* re-release ([0742296](https://github.com/unional/color-map/commit/07422964537f9a0564149a353ecfe3911c01eb0a))

## [2.0.4](https://github.com/unional/color-map/compare/v2.0.3...v2.0.4) (2022-10-03)


### Bug Fixes

* cjs package.json ([3b85801](https://github.com/unional/color-map/commit/3b85801902c2b555d9fa9f4bb98a8da23bcd25c6))

## [2.0.3](https://github.com/unional/color-map/compare/v2.0.2...v2.0.3) (2022-06-13)


### Bug Fixes

* add main field ([3acec72](https://github.com/unional/color-map/commit/3acec726b6a9bfe82cbe6553dec6ba53b659facb))

## [2.0.2](https://github.com/unional/color-map/compare/v2.0.1...v2.0.2) (2022-06-13)


### Bug Fixes

* add exports.require for CJS ([b36cde8](https://github.com/unional/color-map/commit/b36cde8cd75e4a00ef572b0b6a4badb2109a1a84))

## [2.0.1](https://github.com/unional/color-map/compare/v2.0.0...v2.0.1) (2022-06-13)


### Bug Fixes

* use NodeNext module resolution ([#128](https://github.com/unional/color-map/issues/128)) ([fdfc5cc](https://github.com/unional/color-map/commit/fdfc5ccfcc0025d1b2c3ccbe0138c3b491fc7037))

# [2.0.0](https://github.com/unional/color-map/compare/v1.1.4...v2.0.0) (2022-06-13)


### Bug Fixes

* remove spec files from dist ([#126](https://github.com/unional/color-map/issues/126)) ([e1ad859](https://github.com/unional/color-map/commit/e1ad859a38c91a450cd23f1b126ba9992de87c62))


* fix!: export as ESM (#127) ([ae16eaa](https://github.com/unional/color-map/commit/ae16eaa83629a5248143eee8a895a0edb15240c1)), closes [#127](https://github.com/unional/color-map/issues/127)


### BREAKING CHANGES

* export with only ESM

This is more of a testing release, to see what are the behavior of ESM:

- how it behaves when exporting ESM using esnext
- how it behaves with only ESM
