# C: Libraries, build-vs-depend, output formats, agent angle

Scope note: time-boxed pass. Verified by npm registry, `npm pack` inspection, bundlephobia API, and a handful of web fetches. Items marked (memory) come from prior knowledge, not checked this session.

## 1. Library comparison (npm data fetched 2026-10-30)

| Lib | Version / last npm modify | License | Types | Min+gzip | Spaces / notes |
|---|---|---|---|---|---|
| culori | 4.0.2 / 2026-04-03 | MIT | no native .d.ts in main? (types via @types/culori, memory) | 62 KB min / 22 KB gz whole bundle (bundlephobia); tree-shakes via `culori/fn` | ~30 modes (rgb, hsl, hwb, lab, lch, oklab, oklch, p3, rec2020, prophoto, a98, xyz, jzazbz, okhsl, cubehelix...). Plain objects `{mode:'oklch',l,c,h,alpha}`. |
| colorjs.io | 0.7.1 / 2026-07-24 | MIT | native (`types/`) | 79 KB min / 31 KB gz (dist/color.min.js, measured); fn build 77 KB min | 54 space files. Class `Color` plus procedural `colorjs.io/fn`. Gamut map CSS (default), OKLCH chroma reduction; `none` supported; interpolation with hue methods; WCAG2/APCA contrast. 15 MB unpacked. |
| chroma-js | 3.2.0 / 2025-11-28 | BSD-3 AND Apache-2.0 (mixed) | @types/chroma-js 3.1.3 | 42 KB min / 16 KB gz | Chainable class; `scale()`, bezier, lab/lch/oklab/oklch. No CSS Color 4 `color()` serialization focus. |
| @material/material-color-utilities | 0.4.0 / 2026-01-21 | Apache-2.0 | native | bundlephobia reports 4.5 KB (likely tree-shaken single entry; unreliable) | HCT, tonal palettes, dynamic scheme, quantizers. Opinionated Material 3. |
| @adobe/leonardo-contrast-colors | 1.1.0 / 2026-10-01 | Apache-2.0 | native | not measured | Depends on chroma-js, apca-w3, hsluv, ciecam02. Contrast-targeted scales; outputs sRGB. |
| apca-w3 | 0.1.9 / 2022-07-04 | "Limited W3 License" (non-OSI; concern) | no | small | APCA only. Stale. |
| d3-color + d3-interpolate | 3.1.0 / 2022-06 (ISC) | ISC | @types separate | 4 KB gz (d3-color) | rgb/hsl/lab/hcl/cubehelix; no oklch, no CSS4 parsing. Stale since 2022. |
| tinycolor2 | 1.6.0 / 2023-07 | MIT | @types/tinycolor2 | 5 KB gz | Legacy sRGB only; effectively unmaintained. |
| colord | 2.10.0 / 2026-08-20 | MIT | native | 2 KB gz core; plugins for lab, lch, names, a11y | Small; sRGB-centric with plugins; no oklch in core. |
| @texel/color | 1.1.11 / 2026-01-07 | MIT | native | not measured | Newer, small, functional; OKLab/OKLCH, P3, gamut mapping, array-based. |
| color-bits | 1.2.0 / 2026-07-13 | ISC | native | not measured | Packs colors into 32-bit ints; perf-focused, sRGB. |

Parsing coverage (measured by grepping package source): neither culori 4.0.2 `src/` nor colorjs.io 0.7.1 `src/parse.js` contain a `color-mix(` parser. Colorjs.io has relative color handling (`from` keyword referenced in parse.js; medium confidence, not exercised). Culori: no relative color syntax found (medium). Both handle `color(display-p3 ...)`, oklch, lab etc. (high for colorjs.io, medium for culori). Culori `none`: partial (memory). Premultiplied alpha interpolation: colorjs.io yes (CSS-aligned), culori fixups for alpha yes (memory). Contrast: colorjs.io WCAG2, APCA, Michelson, Weber, Lstar; culori WCAG2 only (`wcagContrast`) (memory); Leonardo and apca-w3 for APCA.

Style Dictionary 5.7.1 (2026-10-24) depends on colorjs.io ^0.5.2 and tinycolor2; sd-transforms 2.0.3 depends on colorjs.io ^0.5.2. So Style Dictionary pipelines already carry colorjs.io.

## 2. API design lessons (memory unless cited; not re-verified)
- Culori: plain-object colors with a `mode` string; modes registered via `useMode(modeOklch)`, which is what makes it tree-shakeable. Trade-off: users must register modes explicitly or import the full bundle.
- Colorjs.io: OO `Color` class (convenient, chainable, larger) plus `colorjs.io/fn` procedural API for tree shaking; spaces are registered objects. Maintainers (Verou/Lilley) stress spec-fidelity over size.
- chroma.js: `chroma.scale(['#fff','#000']).mode('lab').colors(n)` is the de facto scale API; easy for humans, but class-based and mutable-ish.
Maintainer quotes were not retrieved; treat as open.

## 3. Build vs depend
Cost to self-implement (estimates, low confidence): matrices and transfer functions for sRGB, P3, A98, ProPhoto, Rec2020, XYZ D50/D65 with Bradford adaptation, Lab/LCH, OKLab/OKLCH, HSL/HWB: roughly 600-1200 LOC; CSS Color 4 parser (color(), none, calc-free) another 300-500 LOC; CSS gamut mapping (binary-search chroma with deltaEOK) ~100 LOC; color-mix and relative colors add parser complexity (calc() in channels). Reusable test vectors: web-platform-tests `css/css-color` (memory, not fetched) and colorjs.io's test suite (in its repo; not in npm pack, `test/` absent). Reference numbers can also be cross-checked against culori/colorjs.io at dev time.
Depend costs: culori 22 KB gz, colorjs.io 31 KB gz (both MIT, zero deps). Both break color-map's "no dependency" pitch; API leakage risk if their types appear in public signatures.
Recommendation: keep zero runtime deps. Implement a focused core (OKLab/OKLCH, sRGB, P3, Lab/LCH, HSL/HWB, XYZ; CSS parse+serialize; chroma-reduction gamut map) as plain objects `{space, components, alpha}` mirroring DTCG shape, and use culori or colorjs.io only as devDependencies for conformance tests. Defer color-mix/relative colors (neither major lib parses color-mix, so deferring is defensible). If scope grows to all 14 DTCG spaces plus APCA, reconsider depending on colorjs.io/fn (native TS, spec-faithful) as an optional peer.

## 4. Output formats
- DTCG: first stable release 2025.10 announced 2025-10-28 (W3C CG Final report; Format, Color, Resolver modules). Draft dated 2026-09-08 exists as unstable preview ("do not implement").
- Color `$value`: `{ colorSpace, components: [number|"none"...], alpha?: 0-1, hex?: "#rrggbb" fallback }`. Allowed 14 spaces: srgb, srgb-linear, hsl, hwb, lab, lch, oklab, oklch, display-p3, a98-rgb, prophoto-rgb, rec2020, xyz-d65, xyz-d50.
- Tailwind v4 `@theme { --color-brand-500: oklch(0.62 0.19 259); }` (memory; v4 default palette is OKLCH). Style Dictionary v4/v5 has color transforms via colorjs.io and DTCG object support (partly verified via deps). Figma variables store sRGB-ish r,g,b,a floats 0-1 (memory, low confidence on P3 support).
Recommendation: make the DTCG color object the canonical output type, with `toCss()` string serialization (oklch()/color()) and a Tailwind `@theme` emitter as secondary formatters. Include `hex` fallback for out-of-sRGB colors after gamut mapping.

## 5. Agent angle
Found (via search, unverified deeper): `color-engine-mcp` (aimsise; 6 CSS color utilities, OKLCH gamut mapping, ramp with optional design-token output); `tokven-mcp` (Mihkel00; one hex to token set, OKLCH light/dark, WCAG contrast, outputs CSS vars, Tailwind v3/v4, DTCG JSON; tools generate_tokens, get_token_preview, validate_contrast, list_moods); Standby.Design (browser OKLCH generator, not MCP). Inputs are mostly a hex string plus few enum options; outputs are text/JSON. Design guidance (inference): string-in/string-out CSS color strings, flat JSON-schema-friendly options (enums for harmony type, integer steps), deterministic output, errors that name the invalid token.

## Evidence
C01 culori 4.0.2, MIT, modified 2026-04-03, 22 KB gz. high. npm registry + bundlephobia. https://www.npmjs.com/package/culori ; https://bundlephobia.com/package/culori. registry (fetched 2026-10-30)
C02 colorjs.io 0.7.1, MIT, 2026-07-24, native types, 79 KB min/31 KB gz measured from npm pack. high. npm. https://www.npmjs.com/package/colorjs.io
C03 chroma-js 3.2.0, license (BSD-3-Clause AND Apache-2.0), 2025-11-28, 16 KB gz. high. npm.
C04 MCU 0.4.0 Apache-2.0 2026-01-21; bundlephobia size 4.5 KB suspect. high/low. npm.
C05 Leonardo 1.1.0 Apache-2.0 2026-10-01, deps chroma-js, apca-w3, hsluv, ciecam02. high. npm.
C06 apca-w3 0.1.9, "Limited W3 License", last 2022-07. high. npm.
C07 d3-color 3.1.0 ISC and tinycolor2 1.6.0 (2023) stale. high. npm.
C08 colord 2.10.0 MIT 2026-08-20, 2 KB gz. high. npm+bundlephobia.
C09 @texel/color 1.1.11 MIT; color-bits 1.2.0 ISC. high. npm.
C10 No color-mix parsing in culori 4.0.2 src or colorjs.io 0.7.1 parse.js. medium (grep only). npm pack.
C11 Style Dictionary 5.7.1 and sd-transforms 2.0.3 depend on colorjs.io ^0.5.2. high. npm.
C12 DTCG 2025.10 stable announced 2025-10-28. high. https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/ ; https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/. W3C CG.
C13 DTCG color value structure and 14 spaces; draft dated 2026-09-08 marked do-not-implement. high. https://www.designtokens.org/tr/drafts/color/. spec draft (via WebFetch summary).
C14 color-engine-mcp, tokven-mcp, Standby.Design. medium. https://glama.ai/mcp/servers/aimsise/color-engine-mcp/tree ; https://mcp.so/servers/tokven. registry listings via search.
C15 Self-implementation LOC estimates. low. author estimate.

## Contradictions and open questions
- Bundlephobia MCU size (4.5 KB) conflicts with 1 MB unpacked; likely misleading.
- Whether culori ships native types and its exact CSS4 parse coverage (none, calc, relative) not verified.
- WPT css/css-color and colorjs.io test suite reuse not inspected.
- Maintainer design-rationale quotes, Tailwind v4, Figma, and Style Dictionary color transform specifics not fetched.
- Whether the 2026-09-08 DTCG draft changes the 2025.10 color shape is unchecked.
- colorjs.io relative-color support is inferred from the `from` keyword; unverified by running (not permitted).
