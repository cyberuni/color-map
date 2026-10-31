# Evidence: Modern CSS color and design-system palettes for color-map

IDs map from the strand reports: A01-A36 -> E01-E36 (CSS color), B01-B40 -> E37-E76 (palettes), C01-C15 -> E77-E91 (libraries), E92+ added during synthesis.

## E01 (A01)

- claim: Color 4 is a CR Draft dated 29 Oct 2026; last linked CR Snapshot 2022-07-05
- date: 2026-10-30
- status: active
- confidence: high
- source.label: CSS Color 4
- source.url: https://www.w3.org/TR/css-color-4/
- source.type: SPEC
- notes: source date 2026-10-29.

## E02 (A02)

- claim: Color 5 is a WD, 29 Oct 2026; prior WD 13 Jan 2026
- date: 2026-10-30
- status: active
- confidence: high
- source.label: CSS Color 5
- source.url: https://www.w3.org/TR/css-color-5/
- source.type: SPEC
- notes: source date 2026-10-29.

## E03 (A03)

- claim: Color 6 is ED 8 Oct 2026, "Not Ready For Implementation"; no /TR publication (404)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: CSS Color 6
- source.url: https://drafts.csswg.org/css-color-6/
- source.type: SPEC
- notes: source date 2026-10-08.

## E04 (A04)

- claim: Color HDR 1 is a WD 26 Oct 2026 (prev 3 Mar 2026)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: CSS Color HDR 1
- source.url: https://www.w3.org/TR/css-color-hdr-1/
- source.type: SPEC
- notes: source date 2026-10-26.

## E05 (A05)

- claim: contrast-color() in Color 5: returns white or black only, UA-defined algorithm, tie->white, advised not to use WCAG2 ratio simply, must still meet AA large
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 5 section 8
- source.url: https://www.w3.org/TR/css-color-5/#contrast-color
- source.type: SPEC
- notes: source date 2026-10-29.

## E06 (A06)

- claim: Color 6 contrast-color(): candidates list, tbd-fg/tbd-bg, wcag2()/aa/aaa mappings 4.5/3/7/4.5, color-layers()
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 6
- source.url: https://drafts.csswg.org/css-color-6/#contrast-color
- source.type: SPEC
- notes: source date 2026-10-08.

## E07 (A07)

- claim: HDR draft adds dynamic-range-limit, ictcp, jzazbz, jzczhz, color-hdr(), rec2100-*
- date: 2026-10-30
- status: active
- confidence: high
- source.label: HDR 1
- source.url: https://www.w3.org/TR/css-color-hdr-1/
- source.type: SPEC
- notes: source date 2026-10-26.

## E08 (A08)

- claim: color-mix percentage normalization: sum to 100, leftover becomes alpha multiplier (purple 30% plum 30% -> alpha 0.6); default hue method shorter; default space oklab
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 5 section 3 + changelog
- source.url: https://www.w3.org/TR/css-color-5/#color-mix
- source.type: SPEC
- notes: source date 2026-10-29.

## E09 (A09)

- claim: Hue methods shorter/longer/increasing/decreasing
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 5 section 9 / Color 4 13.5
- source.url: https://www.w3.org/TR/css-color-5/#interpolation
- source.type: SPEC
- notes: source date 2026-10-29.

## E10 (A10)

- claim: Interpolation: powerless->missing, carry forward analogous missing comps, fill from other color, premultiply
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 section 13
- source.url: https://www.w3.org/TR/css-color-4/#interpolation
- source.type: SPEC
- notes: source date 2026-10-29.

## E11 (A11)

- claim: `none`: missing comps behave as 0 except interpolation; serialized as none except legacy
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 section 4.4
- source.url: https://www.w3.org/TR/css-color-4/#missing
- source.type: SPEC
- notes: source date 2026-10-29.

## E12 (A12)

- claim: Powerless components set to missing only when from conversion; epsilons hsl S<=0.001, lch C<=0.0015
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 4.4.1, tables
- source.url: https://www.w3.org/TR/css-color-4/#powerless
- source.type: SPEC
- notes: source date 2026-10-29.

## E13 (A13)

- claim: oklch epsilon value
- date: 2026-10-30
- status: active
- confidence: low
- source.label: (not re-extracted)
- source.url: https://www.w3.org/TR/css-color-4/#ok-lab
- source.type: SPEC
- notes: source date n/a.

## E14 (A14)

- claim: Conversion algorithm (linearize, XYZ, linear Bradford, dest, gamut map, polar)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 section 11.2
- source.url: https://www.w3.org/TR/css-color-4/#color-conversion
- source.type: SPEC
- notes: source date 2026-10-29.

## E15 (A15)

- claim: Sample code is section 19 "Sample code for Color Conversions" (non-normative)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 section 19
- source.url: https://www.w3.org/TR/css-color-4/#color-conversion-code
- source.type: SPEC
- notes: source date 2026-10-29.

## E16 (A16)

- claim: Spec Oklab matrices recalculated for consistent white and 64-bit precision (csswg-drafts#6642, color.js PR 357)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 sample code comments
- source.url: https://www.w3.org/TR/css-color-4/#color-conversion-code
- source.type: SPEC
- notes: source date 2026-10-29.

## E17 (A17)

- claim: Ottosson matrices M1/M2; updated 2021-01-25 for higher-precision sRGB matrix and exact D65; published 2020-12-23
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Oklab post
- source.url: https://bottosson.github.io/posts/oklab/
- source.type: BLOG
- notes: source date 2020-12-23.

## E18 (A18)

- claim: Gamut mapping: three algorithms (binary search w/ local MINDE, EdgeSeeker, Ray Trace); JND 0.02, epsilon 0.0001; L>=1 white, L<=0 black
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 section 14
- source.url: https://www.w3.org/TR/css-color-4/#css-gamut-mapping
- source.type: SPEC
- notes: source date 2026-10-29.

## E19 (A19)

- claim: CIE LCH hue curvature problems 270-330 deg; OkLCh avoids; simple chroma reduction can over-reduce light yellow/cyan
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 section 14.1
- source.url: https://www.w3.org/TR/css-color-4/#gamut-mapping
- source.type: SPEC
- notes: source date 2026-10-29.

## E20 (A20)

- claim: Browsers: most UAs clip; only Firefox shipped GM; Chrome/WebKit looking into it (but text also says Firefox "behind a flag")
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: interop#1394
- source.url: https://github.com/web-platform-tests/interop/issues/1394
- source.type: ISSUE (Lea Verou)
- notes: source date 2026-09-14.

## E21 (A21)

- claim: Oklch gamut-mapping critique: odd results vs Lch in some interpolations; Lilley acknowledged polar-space intermediates out of gamut
- date: 2026-10-30
- status: active
- confidence: high
- source.label: csswg-drafts#7071
- source.url: https://github.com/w3c/csswg-drafts/issues/7071
- source.type: ISSUE
- notes: source date 2022-02-18.

## E22 (A22)

- claim: Serialization: sRGB family -> rgb()/rgba() legacy commas, 0-255 numbers; none cases -> color(srgb ...) or modern hsl/hwb
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 section 16.2
- source.url: https://www.w3.org/TR/css-color-4/#serializing-sRGB-values
- source.type: SPEC
- notes: source date 2026-10-29.

## E23 (A23)

- claim: Alpha serialization: legacy 0.93/0.92549 rule; modern 6 decimals, round up
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 section 16.1
- source.url: https://www.w3.org/TR/css-color-4/#serializing-alpha-values
- source.type: SPEC
- notes: source date 2026-10-29.

## E24 (A24)

- claim: lab/lch/oklab/oklch serialize as numbers, trailing zeros removed; precision >= 16-bit
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 16.3-16.4
- source.url: https://www.w3.org/TR/css-color-4/#serializing-lab-lch
- source.type: SPEC
- notes: source date 2026-10-29.

## E25 (A25)

- claim: Color equality: Oklab epsilon 0.00001 for different spaces; missing equals only missing
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 4 section 12
- source.url: https://www.w3.org/TR/css-color-4/#color-comparison
- source.type: SPEC
- notes: source date 2026-10-29.

## E26 (A26)

- claim: Baseline: color() widely (low 2023-05-09; Chrome 111, Safari 15, FF 113)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: webstatus color-function
- source.url: https://api.webstatus.dev/v1/features/color-function
- source.type: WEBSTATUS
- notes: source date 2026-10-30.

## E27 (A27)

- claim: Baseline: color-mix widely (2023-05-09)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: webstatus color-mix
- source.url: https://api.webstatus.dev/v1/features/color-mix
- source.type: WEBSTATUS
- notes: source date 2026-10-30.

## E28 (A28)

- claim: Baseline: relative color newly 2024-09-16 (Chrome 125, FF 128, Safari 18)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: webstatus relative-color
- source.url: https://api.webstatus.dev/v1/features/relative-color
- source.type: WEBSTATUS
- notes: source date 2026-10-30.

## E29 (A29)

- claim: Baseline: light-dark newly 2024-05-13
- date: 2026-10-30
- status: active
- confidence: high
- source.label: webstatus light-dark; MDN
- source.url: https://api.webstatus.dev/v1/features/light-dark
- source.type: WEBSTATUS/MDN
- notes: source date 2026-10-30.

## E30 (A30)

- claim: Baseline: contrast-color newly 2026-04-10 (Safari 26, FF 146, Chrome 147); MDN notes mid-tone caveat
- date: 2026-10-30
- status: active
- confidence: high
- source.label: webstatus; MDN
- source.url: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/contrast-color
- source.type: WEBSTATUS/MDN
- notes: source date 2026-10-30.

## E31 (A31)

- claim: Baseline: oklab/oklch widely (2023-05-09), lab/lch widely, hwb widely (2022-04-28)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: webstatus oklab, lab, hwb
- source.url: https://api.webstatus.dev/v1/features/oklab
- source.type: WEBSTATUS
- notes: source date 2026-10-30.

## E32 (A32)

- claim: color-mix on MDN: defaults to oklab if no space; percents inferred; sum<100 adds alpha
- date: 2026-10-30
- status: active
- confidence: high
- source.label: MDN
- source.url: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix
- source.type: MDN
- notes: source date 2026-10-30.

## E33 (A33)

- claim: Safari 16.4 early relative-color needed `deg` in calc; use @supports
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: MDN relative colors
- source.url: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors
- source.type: MDN
- notes: source date 2026-10-30.

## E34 (A34)

- claim: color() predefined list per MDN includes display-p3-linear, rec2100-pq/hlg/linear
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: MDN color()
- source.url: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color
- source.type: MDN
- notes: source date 2026-10-30.

## E35 (A35)

- claim: device-cmyk(): uncalibrated, no relative syntax; @color-profile defines custom spaces via ICC
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 5
- source.url: https://www.w3.org/TR/css-color-5/#cmyk-colors
- source.type: SPEC
- notes: source date 2026-10-29.

## E36 (A36)

- claim: Relative color: channel keywords resolve to numbers in the function's native range (rgb 0-255), none treated as 0 in math
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Color 5 section 4
- source.url: https://www.w3.org/TR/css-color-5/#relative-colors
- source.type: SPEC
- notes: source date 2026-10-29.

## E37 (B01)

- claim: Tailwind v4 palette defined as `oklch(L% C H)` with 11 steps 50-950; blue L 97 ... 28.2, C peak 0.245 at 600, hue 254.6 -> 267.9
- date: 2026-10-30
- status: active
- confidence: high
- source.label: tailwindcss theme.css
- source.url: https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/theme.css
- source.type: code
- notes: source date read 2026-10-30.

## E38 (B02)

- claim: Yellow hue drifts 102 -> 54 from 50 to 950; amber 95 -> 45.6; chroma bell shape (aggregate table)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: same, my computation
- source.url: same
- source.type: code
- notes: source date 2026-10-30.

## E39 (B03)

- claim: Tailwind does not document its derivation; DeltaE2000 reverse-engineering exists
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: Frana article via search
- source.url: https://dev.to/matfrana/the-mystery-of-tailwind-colors-v4-hjh
- source.type: blog/search
- notes: source date 2025?.

## E40 (B04)

- claim: Evil Martians fitted L list and fixed C list per step to Tailwind
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: Evil Martians
- source.url: https://evilmartians.com/chronicles/better-dynamic-themes-in-tailwind-with-oklch-color-magic
- source.type: blog
- notes: source date ?.

## E41 (B05)

- claim: Radix 12 steps and their purposes
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Radix docs
- source.url: https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- source.type: doc
- notes: source date ?.

## E42 (B06)

- claim: Radix steps 11/12 guaranteed Lc 60/90 on step 2; step 9 white text except sky, mint, lime, yellow, amber
- date: 2026-10-30
- status: active
- confidence: high
- source.label: same
- source.url: same
- source.type: doc
- notes: source date ?.

## E43 (B07)

- claim: Radix custom generator algorithm (nearest-scale mixing in OKLCH, bezier easing, step 9 = input, hover rule, APCA text rule)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: radix-ui/website generate-radix-colors.tsx
- source.url: https://github.com/radix-ui/website/blob/main/components/generate-radix-colors.tsx
- source.type: code
- notes: source date main, read 2026-10-30.

## E44 (B08)

- claim: Radix ships separate dark scales (`xxxDark`)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: same (imports)
- source.url: same
- source.type: code
- notes: source date unknown.

## E45 (B09)

- claim: TonalPalette.fromHueAndChroma, key color search, tone 99 yellow special case
- date: 2026-10-30
- status: active
- confidence: high
- source.label: MCU tonal_palette.ts
- source.url: https://github.com/material-foundation/material-color-utilities/blob/main/typescript/palettes/tonal_palette.ts
- source.type: code
- notes: source date unknown.

## E46 (B10)

- claim: Variant -> palette (hue, chroma) table incl. rotation tables
- date: 2026-10-30
- status: active
- confidence: high
- source.label: MCU dynamic_scheme.ts
- source.url: https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/dynamic_scheme.ts
- source.type: code
- notes: source date unknown.

## E47 (B11)

- claim: 2025 spec changes chroma (TonalSpot 32/26, Vibrant 74, Expressive 48/36) and adds ContrastCurve/ToneDeltaPair
- date: 2026-10-30
- status: active
- confidence: high
- source.label: MCU color_spec_2025.ts
- source.url: https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2025.ts
- source.type: code
- notes: source date unknown.

## E48 (B12)

- claim: Role tones (primary 40/80, surface 98/6, container 90/30, outline 50/60)
- date: 2026-10-30
- status: active
- confidence: high
- source.label: MCU color_spec_2021.ts
- source.url: https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2021.ts
- source.type: code
- notes: source date unknown.

## E49 (B13)

- claim: Tone delta 40 => >=3:1, 50 => >=4.5:1
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: Google HCT code comment and Material blog (via search; not read directly)
- source.url: https://material.io/blog/science-of-color-design
- source.type: blog/search
- notes: source date 2022-02-17.

## E50 (B14)

- claim: Blend.harmonize rotates hue by min(diff*0.5, 15) deg, keeps chroma and tone
- date: 2026-10-30
- status: active
- confidence: high
- source.label: MCU blend.ts
- source.url: https://github.com/material-foundation/material-color-utilities/blob/main/typescript/blend/blend.ts
- source.type: code
- notes: source date unknown.

## E51 (B15)

- claim: Contrast.ratioOfYs = (lighter+5)/(darker+5) with Y 0-100
- date: 2026-10-30
- status: active
- confidence: high
- source.label: MCU contrast.ts
- source.url: https://github.com/material-foundation/material-color-utilities/blob/main/typescript/contrast/contrast.ts
- source.type: code
- notes: source date unknown.

## E52 (B16)

- claim: Leonardo: 3000-sample scale + binary search per target ratio; spaces list; negative ratios; contrast multiplier
- date: 2026-10-30
- status: active
- confidence: high
- source.label: @adobe/leonardo-contrast-colors 1.1.0 (npm pack)
- source.url: https://www.npmjs.com/package/@adobe/leonardo-contrast-colors
- source.type: code
- notes: source date unknown.

## E53 (B17)

- claim: Leonardo license Apache-2.0
- date: 2026-10-30
- status: active
- confidence: high
- source.label: package LICENSE
- source.url: same
- source.type: code
- notes: source date unknown.

## E54 (B18)

- claim: Carbon: 10 grades per hue; grade-distance table for 4.5/3; theme layering
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: Carbon docs (page extract partial)
- source.url: https://carbondesignsystem.com/elements/color/overview/
- source.type: doc
- notes: source date unknown.

## E55 (B19)

- claim: Primer: 0-9 scales, grays 0-13 inverted for dark, functional token pairing rules, nine themes
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: Primer docs / primitives
- source.url: https://primer.style/product/getting-started/foundations/color-usage/ ; https://github.com/primer/primitives
- source.type: doc
- notes: source date unknown.

## E56 (B20)

- claim: Primer Prism archived 2024-12-10, builds on Leonardo/ColorBox/Palx
- date: 2026-10-30
- status: active
- confidence: high
- source.label: primer/prism
- source.url: https://github.com/primer/prism
- source.type: doc
- notes: source date 2024-12-10.

## E57 (B21)

- claim: Open Props colors: 19 hues x 13 steps hex
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: props.colors.css
- source.url: https://github.com/argyleink/open-props/blob/main/src/props.colors.css
- source.type: code
- notes: source date unknown.

## E58 (B22)

- claim: Harmonizer: OKLCH + APCA/WCAG per-level contrast, APCACH
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: evilmartians/harmonizer README
- source.url: https://github.com/evilmartians/harmonizer
- source.type: doc
- notes: source date unknown.

## E59 (B23)

- claim: Atmos: OKLCH, easing, hue transitions light->dark, WCAG2+APCA
- date: 2026-10-30
- status: active
- confidence: low
- source.label: vendor pages
- source.url: https://atmos.style/shade-generator
- source.type: vendor
- notes: source date unknown.

## E60 (B24)

- claim: Huetone credits APCA + CSS WG conversions; working space not stated
- date: 2026-10-30
- status: active
- confidence: low
- source.label: ardov/huetone README
- source.url: https://github.com/ardov/huetone
- source.type: doc
- notes: source date unknown.

## E61 (B25)

- claim: uicolors.app algorithm undocumented
- date: 2026-10-30
- status: active
- confidence: medium (absence)
- source.label: site
- source.url: https://uicolors.app/
- source.type: doc
- notes: source date unknown.

## E62 (B26)

- claim: WCAG 3 WD 10 Sep 2026: contrast algorithm "yet to be determined", placeholders, assumes size/weight factor
- date: 2026-10-30
- status: active
- confidence: high
- source.label: W3C
- source.url: https://www.w3.org/TR/wcag-3.0/
- source.type: spec
- notes: source date 2026-09-10.

## E63 (B27)

- claim: APCA marked exploratory early 2023, absent from July 2023 WD; completion ~2030
- date: 2026-10-30
- status: active
- confidence: medium-high
- source.label: Roselli
- source.url: https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html
- source.type: blog
- notes: source date 2026-04.

## E64 (B28)

- claim: APCA constants 0.0.98G-4g; apca-w3 0.1.9; "being evaluated"
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Myndex/apca-w3
- source.url: https://github.com/Myndex/apca-w3
- source.type: doc
- notes: source date algorithm 2021-02-15.

## E65 (B29)

- claim: APCA license: W3 compliant-code-only, patent pending, naming restriction, AGPLv3 otherwise; GitHub NOASSERTION
- date: 2026-10-30
- status: active
- confidence: high
- source.label: LICENSE.md
- source.url: https://github.com/Myndex/apca-w3/blob/master/LICENSE.md
- source.type: doc
- notes: source date 2019-2023.

## E66 (B30)

- claim: APCA Lc guide 15/30/45/60/75/90
- date: 2026-10-30
- status: active
- confidence: high
- source.label: APCA in a Nutshell
- source.url: https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell
- source.type: doc
- notes: source date unknown.

## E67 (B31)

- claim: Bridge-PCA maps Lc 60/75/90 to 3/4.5/7; polarity-sensitive; beta
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: npm / search
- source.url: https://www.npmjs.com/package/bridge-pca
- source.type: doc
- notes: source date unknown.

## E68 (B32)

- claim: contrast-color(): white/black only, algorithm UA-defined, advises against WCAG 2 ratio alone, must meet AA-large
- date: 2026-10-30
- status: active
- confidence: high
- source.label: CSS Color 5
- source.url: https://www.w3.org/TR/css-color-5/
- source.type: spec
- notes: source date unknown.

## E69 (B33)

- claim: contrast-color Baseline 2026 (since Apr 2026), mid-tone limitations
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: MDN
- source.url: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/contrast-color
- source.type: doc
- notes: source date 2026.

## E70 (B34)

- claim: Oklab hue linearity vs CIELAB/CIELUV/HSV purple shift; lightness RMS 0.20 vs 1.70; data CAM16-generated
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Ottosson
- source.url: https://bottosson.github.io/posts/oklab/
- source.type: blog (author)
- notes: source date 2020.

## E71 (B35)

- claim: HSL lightness inconsistent across hues; OKLCH hold c/h change l; LCH blue hue shift 270-330
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Evil Martians OKLCH article
- source.url: https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
- source.type: blog
- notes: source date unknown.

## E72 (B36)

- claim: Harmonies are hue rotations; OKLCH fixed L,C rotation keeps perceived lightness; gamut caveat
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: search roundup
- source.url: https://www.stefanjudis.com/blog/oklch-perceived-lightness
- source.type: blog
- notes: source date unknown.

## E73 (B37)

- claim: Abney/Bezold-Brucke definitions; direction disagrees between sources; no measured design magnitudes
- date: 2026-10-30
- status: active
- confidence: low
- source.label: Wikipedia + search
- source.url: https://en.wikipedia.org/wiki/Abney_effect
- source.type: search
- notes: source date unknown.

## E74 (B38)

- claim: Dark mode: saturated colors vibrate/fail 4.5:1, #121212 surface, elevation by lighter surfaces
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: Material 2 dark theme guidance via search
- source.url: https://m2.material.io/design/color/dark-theme
- source.type: doc/search
- notes: source date unknown.

## E75 (B39)

- claim: Radix warns saturated gray backgrounds in dark mode clash
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Radix composing a palette
- source.url: https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette
- source.type: doc
- notes: source date unknown.

## E76 (B40)

- claim: colorjs.io supplies deltaEOK, contrastAPCA used by Radix generator
- date: 2026-10-30
- status: active
- confidence: high
- source.label: generate-radix-colors.tsx
- source.url: see B07
- source.type: code
- notes: source date unknown.

## E77 (C01)

- claim: culori 4.0.2, MIT, modified 2026-04-03, 22 KB gz.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: see URL / npm registry
- source.url: https://www.npmjs.com/package/culori ; https://bundlephobia.com/package/culori.
- source.type: registry/docs
- notes: source date 2026-10-30.

## E78 (C02)

- claim: colorjs.io 0.7.1, MIT, 2026-07-24, native types, 79 KB min/31 KB gz measured from npm pack.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: see URL / npm registry
- source.url: https://www.npmjs.com/package/colorjs.io
- source.type: registry/docs
- notes: source date 2026-10-30.

## E79 (C03)

- claim: chroma-js 3.2.0, license (BSD-3-Clause AND Apache-2.0), 2025-11-28, 16 KB gz.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: see URL / npm registry
- source.url: npm registry (npm view)
- source.type: registry/docs
- notes: source date 2026-10-30.

## E80 (C04)

- claim: MCU 0.4.0 Apache-2.0 2026-01-21; bundlephobia size 4.5 KB suspect.
- date: 2026-10-30
- status: active
- confidence: high/low
- source.label: see URL / npm registry
- source.url: npm registry (npm view)
- source.type: registry/docs
- notes: source date 2026-10-30.

## E81 (C05)

- claim: Leonardo 1.1.0 Apache-2.0 2026-10-01, deps chroma-js, apca-w3, hsluv, ciecam02.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: see URL / npm registry
- source.url: npm registry (npm view)
- source.type: registry/docs
- notes: source date 2026-10-30.

## E82 (C06)

- claim: apca-w3 0.1.9, "Limited W3 License", last 2022-07.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: see URL / npm registry
- source.url: npm registry (npm view)
- source.type: registry/docs
- notes: source date 2026-10-30.

## E83 (C07)

- claim: d3-color 3.1.0 ISC and tinycolor2 1.6.0 (2023) stale.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: see URL / npm registry
- source.url: npm registry (npm view)
- source.type: registry/docs
- notes: source date 2026-10-30.

## E84 (C08)

- claim: colord 2.10.0 MIT 2026-08-20, 2 KB gz.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: see URL / npm registry
- source.url: npm registry (npm view)
- source.type: registry/docs
- notes: source date 2026-10-30.

## E85 (C09)

- claim: @texel/color 1.1.11 MIT; color-bits 1.2.0 ISC.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: see URL / npm registry
- source.url: npm registry (npm view)
- source.type: registry/docs
- notes: source date 2026-10-30.

## E86 (C10)

- claim: No color-mix parsing in culori 4.0.2 src or colorjs.io 0.7.1 parse.js. medium (grep only). npm pack.
- date: 2026-10-30
- status: superseded by E92 (grep result replaced by an executed probe)
- confidence: medium
- source.label: see URL / npm registry
- source.url: npm registry (npm view)
- source.type: registry/docs
- notes: source date 2026-10-30.

## E87 (C11)

- claim: Style Dictionary 5.7.1 and sd-transforms 2.0.3 depend on colorjs.io ^0.5.2.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: see URL / npm registry
- source.url: npm registry (npm view)
- source.type: registry/docs
- notes: source date 2026-10-30.

## E88 (C12)

- claim: DTCG 2025.10 stable announced 2025-10-28.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: see URL / npm registry
- source.url: https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/ ; https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/.
- source.type: registry/docs
- notes: source date 2026-10-30.

## E89 (C13)

- claim: DTCG color value structure and 14 spaces; draft dated 2026-09-08 marked do-not-implement.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: see URL / npm registry
- source.url: https://www.designtokens.org/tr/drafts/color/.
- source.type: registry/docs
- notes: source date 2026-10-30.

## E90 (C14)

- claim: color-engine-mcp, tokven-mcp, Standby.Design.
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: see URL / npm registry
- source.url: https://glama.ai/mcp/servers/aimsise/color-engine-mcp/tree ; https://mcp.so/servers/tokven.
- source.type: registry/docs
- notes: source date 2026-10-30.

## E91 (C15)

- claim: Self-implementation LOC estimates.
- date: 2026-10-30
- status: active
- confidence: low
- source.label: see URL / npm registry
- source.url: npm registry (npm view)
- source.type: registry/docs
- notes: source date 2026-10-30.

## E92 (synthesis)

- claim: Neither culori 4.0.2 nor colorjs.io 0.7.1 parses color-mix(), relative color (`from`), light-dark(), contrast-color(), currentcolor or system colors (Canvas); both parse all Color 4 forms tested incl. none, color(display-p3), hwb, lab, turn units. Supersedes E86 (C10) grep result and resolves the colorjs.io relative-color inference.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Probe script run during synthesis
- source.url: raw/scripts/probe.mjs (run as: node probe.mjs <dir with culori@4.0.2 and colorjs.io@0.7.1 installed>)
- source.type: code (executed)
- notes: source date 2026-10-30. Run against installed npm packages.

## E93 (synthesis)

- claim: culori gamut-maps display-p3 red to rgb(255, 11, 12) with toGamut (CSS method) vs rgb(255, 0, 0) with clampRgb, showing the clip vs chroma-reduction difference.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Probe script run during synthesis
- source.url: raw/scripts/probe.mjs (run as: node probe.mjs <dir with culori@4.0.2 and colorjs.io@0.7.1 installed>)
- source.type: code (executed)
- notes: source date 2026-10-30.

## E94 (synthesis)

- claim: culori ships no .d.ts; types come from @types/culori 4.0.1. colorjs.io registers 54 spaces including hct, cam16-jmh, okhsl, apca-relevant contrast; default gamut-mapping method is 'css'.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: npm package inspection
- source.url: https://www.npmjs.com/package/@types/culori
- source.type: registry/code
- notes: source date 2026-10-30.

## E95 (synthesis)

- claim: DTCG Color Module 2025.10 (28 Oct 2025, Final CG Report, stable): $value = {colorSpace (required), components (required, number or 'none'), alpha (optional 0-1, default 1), hex (optional, must be 6-digit)}; 14 colorSpace keys; oklch L 0-1, H [0,360).
- date: 2026-10-30
- status: active
- confidence: high
- source.label: DTCG Color Module 2025.10
- source.url: https://www.designtokens.org/tr/2025.10/color/
- source.type: spec
- notes: source date 2025-10-28. Verified directly; confirms E89 (C13).

## E96 (synthesis)

- claim: Contrast ratio depends only on luminance Y, and HCT tone is CIE L*, a monotonic function of Y. So Material's tone-delta contrast guarantee (E49) holds for any hue/chroma model that sets L* exactly; an OKLCH-hue + L*-tone palette keeps the guarantee without porting CAM16.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Derived from WCAG 2 formula and HCT definition (E45)
- source.url: https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
- source.type: derivation
- notes: source date unknown. Reasoning, not a sourced claim; the delta-40/50 numbers themselves are E49 (medium).

## E97 (follow-up)

- claim: Chrome DevTools 149 (released 2 June 2026) moved the APCA contrast calculator from experiment to a standard setting (Settings > Preferences > Elements > Enable APCA contrast guidelines).
- date: 2026-10-30
- status: active
- confidence: medium
- source.label: What's new in DevTools (Chrome 149)
- source.url: https://developer.chrome.com/blog/new-in-devtools-149
- source.type: official docs
- notes: source date 2026-06-02. Read through a search summary of the Spanish edition, not fetched directly. A third-party blog still describes an Experiments toggle.

## E98 (follow-up)

- claim: npm downloads for the last month: apca-w3 465,990; wcag-contrast 535,917; colorjs.io 38.1M; culori 14.6M; chroma-js 13.6M; @material/material-color-utilities 1.83M; @adobe/leonardo-contrast-colors 71k; apcach 5.2k; bridge-pca 117. Many new APCA packages appeared on npm in 2026 (sass-apca, apca-cli, @huekit/contrast, Storybook APCA addons).
- date: 2026-10-30
- status: active
- confidence: high
- source.label: npm downloads API and npm search
- source.url: https://api.npmjs.org/downloads/point/last-month/apca-w3
- source.type: registry
- notes: Downloads include transitive installs (Leonardo depends on apca-w3; Style Dictionary depends on colorjs.io), so they measure reach, not deliberate adoption.

## E99 (follow-up)

- claim: clibuilder 12.1.1 (MIT, published 2026-10-31) depends on args-minus and @toon-format/toon 4.x. It supports typed arguments and options, subcommands, config validated with Standard Schema, and plugins.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: npm registry; clibuilder README
- source.url: https://github.com/clibuilder/clibuilder
- source.type: registry/docs
- notes: The README does not document a JSON output mode or error format.

## E100 (follow-up)

- claim: The axi principles for agent-ergonomic CLIs are: token-efficient TOON output; minimal default schemas; truncation with --full; precomputed aggregates; definitive empty states; structured errors and exit codes with no prompts; ambient context, with an on-demand skill as the fallback; content first; contextual next-step suggestions; and consistent, concise help.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: kunchenguid/axi README
- source.url: https://github.com/kunchenguid/axi
- source.type: docs
- notes: Read through a WebFetch summary. The repo also ships an AXI skill (`npx skills add kunchenguid/axi`).

## E101 (follow-up)

- claim: Bundled with esbuild and minified, Material Color Utilities 0.4.0 costs about 20 KB gzipped when only `Hct` is imported from the package root, because the root does not tree-shake. Importing hct/hct.js and palettes/tonal_palette.js directly costs 8.4 KB gzipped.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Local esbuild measurement
- source.url: local esbuild run (esbuild --bundle --minify --format=esm, then gzip); entry scripts not preserved
- source.type: code (executed)
- notes: The figure is for code taken as-is. A trimmed port could be smaller.

## E102 (follow-up)

- claim: Tree-shaken bundle sizes (esbuild minified, gzip -9). The 14 Color 4 spaces plus parse, format, gamut-map and delta-E: culori 4.0.2 10,449 B; colorjs.io 0.7.1 20,657 B. Adding interpolation and WCAG contrast: culori 11,546 B; colorjs.io 21,833 B. culori with only rgb, oklab and oklch: 7,115 B. culori's named-color table alone: 1,347 B. The current color-map 2.2 build: 480 B. Unpacked install size: colorjs.io 17 MB, culori 1.6 MB, chroma-js 756 KB, Material Color Utilities 1.3 MB.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Local esbuild measurement
- source.url: local esbuild run (esbuild --bundle --minify --format=esm, then gzip -9); entry scripts not preserved
- source.type: code (executed)
- notes: Shows that a dependency does not make bundles smaller. The same feature set costs roughly the same in bytes whoever writes it.

## E103 (follow-up)

- claim: color-map-rainbow 3.0.0 (owner: unional; repo cyberuni/color-map-rainbow) is a separate package that depends on color-map ^2.2.0. These names were free on npm on 2026-10-30: color-map-cli, color-map-axi, color-map-apca, color-map-material, color-map-hct, colormap-cli, @color-map/core, @color-map/cli. The axi README states no naming rule, but all of its reference tools use the -axi suffix, both wrappers (gh-axi, chrome-devtools-axi) and native tools (obsidian-axi, lavish-axi), and it shows global installs (npm install -g gh-axi).
- date: 2026-10-30
- status: active
- confidence: high
- source.label: npm registry; kunchenguid/axi README
- source.url: https://www.npmjs.com/package/color-map-rainbow ; https://github.com/kunchenguid/axi
- source.type: registry/docs
- notes: A name that is free today can be taken before it is published.

## E104 (follow-up)

- claim: Material Color Utilities 0.4.0's package.json lists only "." in `exports` (types, import, default) and sets no `sideEffects` field. Deep imports such as hct/hct.js are therefore blocked for consumers, and a package that depends on it cannot get below the ~20 KB root-import cost. The 8.4 KB figure (E101) is reachable only by copying the code.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: @material/material-color-utilities package.json
- source.url: https://www.npmjs.com/package/@material/material-color-utilities
- source.type: code
- notes: Corrects the earlier plan text that said an adapter could use deep imports.

## E105 (follow-up)

- claim: apca-w3's LICENSE.md (copyright 2019-2023 Andrew Somers / Myndex) contains these clauses:
  - Royalty-free use is allowed only "for predicting contrast for web content".
  - "Commercial use is prohibited without a written and signed commercial license agreement".
  - Use of the names APCA, SAPC and Accessible Perceptual Contrast Algorithm "is only permitted for code that is properly implementing the APCA algorithm, and maintaining sync with the current version", as defined by the APCA integration compliance document.
  - "Patent(s) pending."
  - Use of the APCA logo needs written consent.
  - Uses outside the W3 cooperative agreement fall under "AGPU v3" (sic).
  - The reference algorithm is 0.0.98G-4g with an output clamp at about ±Lc 10.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: Myndex/apca-w3 LICENSE.md
- source.url: https://github.com/Myndex/apca-w3/blob/master/LICENSE.md
- source.type: license text
- notes: Read through a WebFetch extraction of quoted clauses. Refines E65. The naming clause is a term of the copyright license on apca-w3's code, so it binds licensees of that code. Whether "APCA" is a registered trademark was not checked.

## E106 (follow-up)

- claim: colorjs.io 0.7.1 src/contrast/APCA.js is its own implementation inside an MIT package. Its header cites "APCA 0.0.98G" and https://github.com/Myndex/apca-w3, and it restates the published constants (normBG 0.56, normTXT 0.57, revTXT 0.62, revBG 0.65, blkThrs 0.022, scaleBoW 1.14, and others). It imports no apca-w3 code.
- date: 2026-10-30
- status: active
- confidence: high
- source.label: colorjs.io package source
- source.url: https://github.com/color-js/color.js/blob/main/src/contrast/APCA.js
- source.type: code
- notes: Using it does not accept apca-w3's license. A granted patent would still cover it.
