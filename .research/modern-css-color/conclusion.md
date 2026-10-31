# Conclusion: Modern CSS color and design-system palettes for color-map

## Last updated

October 2026

## Question

1. Which ways of defining a color does modern CSS support, and what must `color-map` do to parse, represent and convert between all of them?
2. Which scale, interval and pairing algorithms should `color-map` expose so that an AI agent can generate a good design-system palette?
3. What is the phased plan to get there, including a demo website?

## Verdict

`color-map` should become a zero-dependency, spec-exact color engine with a palette layer on top. Its colors should be plain JSON objects shaped like the W3C design-token (DTCG) color value. The plan has two parts.

- **Color engine.** It implements every CSS Color 4 form, including conversion, gamut mapping and serialization. It also parses the Color 5 functions: `color-mix()`, relative color (`from`), `light-dark()` and `contrast-color()`. Neither culori nor colorjs.io parses those Level 5 functions (E92), so this is the gap the package can own.
- **Palette layer.** It works in OKLCH, plus CIE L* where a contrast guarantee is needed. It offers:
  - scales from curve presets (Tailwind, Radix, tone);
  - contrast-targeted scales (as Leonardo does);
  - a brand-color scale (as the Radix generator does);
  - harmonies;
  - on-color and contrast pairs;
  - dark-mode derivation;
  - a semantic palette that comes with precomputed contrast for every pair.

WCAG 2 contrast is built in. APCA plugs in from outside because of its license.

Agents get string-in, JSON-out functions. The output formats are DTCG 2025.10 JSON, CSS custom properties and a Tailwind v4 `@theme` block.

## Reference material

### R1. Every CSS color form and what the library does with it

| Form | Spec / Baseline | White point / gamut | Library handling |
|---|---|---|---|
| Named colors (148 keywords), `transparent` | Color 4 / widely | D65, sRGB | Parse into the `srgb` space. |
| Hex: 3, 4, 6 or 8 digits | Color 4 / widely | D65, sRGB | Parse; output with `toHex()`. |
| `rgb()`/`rgba()`, `hsl()`/`hsla()`, legacy comma and modern space syntax | Color 4 / widely | D65, sRGB | Parse both syntaxes. Legacy syntax rejects `none` and mixed number/percent. |
| `hwb()` | Color 4 / widely (2022) | D65, sRGB | Parse. When W+B ≥ 100 the result is gray. |
| `lab()`, `lch()` | Color 4 / widely (2023) | D50, unbounded | Parse. 100% means 125 for a/b and 150 for C. |
| `oklab()`, `oklch()` | Color 4 / widely (2023) | D65, unbounded | Parse. 100% means 0.4 for a/b and C. |
| `color(srgb, srgb-linear, display-p3, a98-rgb, prophoto-rgb, rec2020, xyz, xyz-d50, xyz-d65)` | Color 4 / widely (2023) | per space; prophoto uses D50 | Parse. Values outside 0–1 are kept, not clamped. |
| `color(display-p3-linear)` | Color 5 (spec status unclear) | D65, P3 | Support it; cheap given P3. |
| `none` in any component | Color 4 | — | Store as `null`. Carry it forward during interpolation (E10, E11). |
| `currentcolor`, system colors (`Canvas`, `AccentColor`, …) | Color 4 / widely | depends on context | Parse to an unresolved value; resolve only when the caller supplies a context. |
| `color-mix(in <space> <hue-method>?, a p%, b p%, …)` | Color 5 / widely (2023) | — | Parse and resolve. The `in` clause is optional (defaults to oklab). Percentages normalize, and a total under 100% scales alpha (E08). |
| Relative color: `fn(from <color> …)` with `calc()` | Color 5 / newly (2024-09) | — | Parse with a small `calc()` evaluator. Channels resolve to each function's own number range (E36). |
| `light-dark(a, b)` | Color 5 / newly (2024-05) | — | Unresolved until the caller gives a color scheme. |
| `contrast-color(c)` | Color 5 / newly (2026-04) | — | Returns black or white, with the algorithm left to the browser (E05). The library uses WCAG 2 and documents that the result can differ from browsers. |
| `@color-profile`, `device-cmyk()` | Color 5 / no browser support known | ICC | Out of scope; reject with a typed error. |
| Level 6 `contrast-color()` options, `color-layers()`; HDR: `rec2100-*`, `ictcp`, `jzazbz` | Editor's / Working Drafts | — | Out of scope until stable (E03, E04, E06, E07). |

### R2. Conversion, gamut mapping and serialization recipe

1. **Conversion.** Every space converts through XYZ-D65 in the CSS §11.2 order:
   1. Undo the transfer function.
   2. Apply the space's matrix to reach XYZ at its own white point.
   3. Adapt between D50 and D65 with linear Bradford.
   4. Convert to the target space.
   5. Gamut-map.
   6. Convert to polar form if the target is polar.

   Use the matrices in the CSS Color 4 §19 sample code, not the ones printed in Ottosson's blog. The spec recalculated them for a consistent white point and 64-bit precision. They differ around the 4th decimal and decide whether white comes out exactly achromatic (E14–E17).
2. **Missing and powerless components.** Only a component produced by conversion becomes missing (`null`), for example the hue of a gray. A hue the author wrote stays as written (E12). Two colors are equal when they match in Oklab within 0.00001 (E25).
3. **Gamut mapping.** The default is the CSS binary search: reduce OKLCH chroma at constant L and H, and use deltaEOK with a JND of 0.02 and epsilon 0.0001. `'clip'` is also offered, because most browsers still clip today (E18, E20). Ray trace can come later. The spec now allows all three methods (E18).
4. **Serialization.** Follow §16:
   - sRGB-family colors serialize as legacy `rgb(r, g, b)`;
   - an sRGB color with `none` becomes `color(srgb …)`;
   - lab/lch/oklab/oklch serialize as numbers, never percentages;
   - alpha is dropped when it is 1.

   Precision is configurable (E22–E24).

### R3. Scale systems at a glance

| System | Steps | Space | Constant | Chroma | Hue across the scale | Dark mode | Contrast guarantee |
|---|---|---|---|---|---|---|---|
| Tailwind v4 | 11 (50–950) | OKLCH, hand-tuned | a shared L curve (≈98→28) | bell curve peaking at 500–600 | drifts (yellow 102°→54°, blue 255°→268°) | the same scale | none (E37, E38) |
| Radix | 12, one UI purpose per step | hand-tuned; generator uses OKLCH | each step's purpose | step 9 is the purest | single hue in the generator | separate dark scales | steps 11/12 reach APCA Lc 60/90 on step 2 (E41–E44) |
| Material 3 | tones 0–100 | HCT (tone is CIE L*) | hue and chroma per palette | gamut-limited | none within a palette; rotated between palettes | different tones (40↔80) | tone gap 40 gives 3:1, 50 gives 4.5:1 (E45–E51) |
| Leonardo | any list of ratios | LCH, CAM02, HSLuv and others | contrast ratio | from the key colors | from interpolation | negative ratios | exact target ratio (E52) |

Radix step purposes:
- 1–2: app and subtle backgrounds;
- 3–5: component background, hover, active;
- 6–8: borders and focus rings;
- 9–10: solid fill and its hover;
- 11: low-contrast text;
- 12: high-contrast text (E41).

Material role tones (light/dark):
- primary 40/80;
- on-primary 100/20;
- container 90/30;
- surface 98/6;
- outline 50/60 (E48).

Key finding: contrast depends only on luminance, and HCT tone is CIE L*. So setting L* exactly while taking hue and chroma from OKLCH keeps Material's tone-gap contrast guarantee without porting CAM16 (E96).

### R4. Contrast

| Algorithm | Use | Status | Library stance |
|---|---|---|---|
| WCAG 2.x ratio `(L1+0.05)/(L2+0.05)` | AA 4.5 / large text 3 / AAA 7 | the legal baseline today | Built in and the default. |
| APCA (Lc, sign shows polarity) | Lc 90 body / 75 minimum body / 60 other text / 45 large / 30 / 15 | not in WCAG 3; the WCAG 3 draft says the algorithm is "yet to be determined" (E62, E63) | Pluggable `contrast` function only. The apca-w3 license limits copying and naming (E65). |
| Bridge-PCA | APCA-based but WCAG 2 compatible | beta | Optional plug-in. |
| CSS `contrast-color()` | black or white | algorithm left to the browser | Emulated with WCAG 2. |

### R5. Library landscape

| Library | Version | License | Gzip | Color 4 parsing | Color 5 parsing | Note |
|---|---|---|---|---|---|---|
| culori | 4.0.2 | MIT | 22 KB | yes | no | plain objects; types from `@types/culori` |
| colorjs.io | 0.7.1 | MIT | 31 KB | yes | no | 54 spaces including HCT; Style Dictionary depends on it |
| chroma.js | 3.2.0 | BSD-3 + Apache-2.0 | 16 KB | partial | no | the de facto `scale()` API |
| Material Color Utilities | 0.4.0 | Apache-2.0 | — | n/a | n/a | HCT and schemes |
| Leonardo | 1.1.0 | Apache-2.0 | — | n/a | n/a | depends on chroma.js and apca-w3 |

Sources: E77–E85, E92–E94.

### R6. Implementation plan

#### Decisions

- **D1. No runtime dependencies.** That stays the package's pitch. culori and colorjs.io become devDependencies, used only to cross-check results. The Web Platform Tests `css/css-color` suite supplies test vectors.
- **D2. Plain JSON colors.** A color is `{ colorSpace, components, alpha? }` with `null` for `none`. This is the DTCG value shape with `null` in place of the `"none"` string (E95). Plain objects survive JSON, which matters for agents. `NaN` does not survive JSON, and class instances don't either.
- **D3. Space names follow CSS.** The 14 DTCG/CSS spaces plus `display-p3-linear`, all with the spec's names. Each space is a module registered against the XYZ-D65 hub, so unused spaces are tree-shaken out.
- **D4. Unresolvable values are explicit.** `currentcolor`, system colors and `light-dark()` parse into an unresolved node. `resolve(color, { currentColor, colorScheme, systemColors })` turns it into a concrete color. Nothing is guessed silently.
- **D5. Spec numbers by default.** CSS §19 matrices, CSS gamut mapping and CSS serialization are the defaults. Options exist for `clip` and precision.
- **D6. Contrast is a parameter.** Every palette function takes `contrast: 'wcag2' | (fg, bg) => number`, and WCAG 2 is the default.
- **D7. Agent-friendly API.** Functions accept a CSS string or a color object and return plain objects. Options are flat enums and numbers that a JSON Schema can describe. Errors name the bad token.
- **D8. Existing functions keep working, unchanged.** `createColors`, `createColorsFromMap`, `rgbHex` and `rgbaString` are not wrong, just narrow. They work only in sRGB, interpolate in gamma-encoded sRGB, round to integers and take alpha as a separate argument. The new core can reproduce them exactly as "steps in `srgb`, rounded". Even so, they keep their own small code and do not import the core: wrapping them would grow a `createColors`-only bundle from about 0.5 KB to several KB (E102). Tests check them against the core, and the existing tests must keep passing byte for byte. They are not deprecated. Every phase only adds exports, so each release is a minor 2.x version. A major version would only be needed if their output changed, and the plan doesn't change it.
- **D9. Size budgets per entry point, enforced in CI.** Taking a dependency would not shrink bundles. The code to parse, convert and gamut-map the 14 Color 4 spaces costs about the same in any library: 10.4 KB gzipped tree-shaken in culori, 20.7 KB in colorjs.io (E102). A dependency saves implementation effort, not bytes. So the budget is set per import, so that users pay only for what they use:

  | Import | Budget (gzip) | Reference |
  |---|---|---|
  | existing API (`createColors` and the others) | ≤ 0.6 KB | 0.48 KB today |
  | convert between two named spaces, without `parse` | ≤ 2 KB | |
  | full Color 4 core (`parse`, `toCss`, `toGamut`, all spaces) | ≤ 10 KB | culori 10.4, colorjs.io 20.7 |
  | plus `mix` and `contrast` | ≤ 12 KB | culori 11.5, colorjs.io 21.8 |
  | everything, including Color 5 parsing and the palette layer | ≤ 18 KB | culori's full bundle is 22 KB |

  To keep those budgets:
  - Set `"sideEffects": false` and do no work at import time. Material's package skips this, and importing only `Hct` pulls in 20 KB (E101).
  - Make each space its own module. Conversion functions import only the spaces they name.
  - `parse` is the one costly entry, because it must know every syntax. The 148 named colors alone are 1.3 KB, so they go in a separate module that only `parse` pulls in.
  - Measure each row above with size-limit in CI.
  - Keep the install small too: colorjs.io unpacks to 17 MB, culori to 1.6 MB.
- **D10. The CLI is a separate package, built for agents.** It cannot live inside `color-map`: clibuilder would become a runtime dependency there and break D1. It is built on clibuilder 12, which already depends on `@toon-format/toon` (E99), and follows the ten axi principles (E100):
  - TOON output by default for scales and pairs, with `--format dtcg|css|tailwind|json` for files;
  - only the essential fields by default, with `--full` for everything;
  - precomputed contrast ratios and pass/fail counts;
  - explicit empty results;
  - structured errors and exit codes, no prompts, and failure on unknown flags;
  - a short help reference for each subcommand;
  - after each result, a suggested next command, for example `scale` → `pairs` → `export`.

  Agents learn the CLI from a `color-map` skill shipped as a universal-plugin package for Claude Code, Cursor, Codex and Copilot CLI. axi's position is a CLI plus a skill rather than MCP, so the MCP server is dropped.

  Naming:
  - The package is `color-map-cli`, which follows your existing `color-map-*` family (`color-map-rainbow`) and is free on npm.
  - The binary is `color-map`, so the skill, the library and the command share one name.
  - `color-map-axi` is the alternative, if being findable in the axi ecosystem matters more than matching the family (E103).
- **D11. Adapters in the core; recipes, not add-on packages.** The core defines two interfaces:
  - `ContrastFn`: `(fg, bg) => number`, plus a name, thresholds and polarity;
  - `ToneModel`: `toColor(hue, chroma, tone)` and `fromColor(color)`.

  The defaults are WCAG 2 and "L* tone with OKLCH hue and chroma". The core also gets `fromArgb()` and `toArgb()`, a few bytes, so that Material Color Utilities' integer colors convert in one call.

  There are no `color-map-apca` or `color-map-material` packages. A wrapper would save users only a few lines over using the upstream library directly, and it carries costs: a package name containing "APCA" triggers apca-w3's naming clause (E65), and tracking MCU's 0.x API and yearly spec revisions. A wrapper also could not make MCU smaller, because MCU's `exports` allows only the package root, which costs about 20 KB (E101, E104). Instead:
  - The docs and the website carry recipes for APCA (through `apca-w3` or colorjs.io) and for Material (MCU scheme → `fromArgb` → `toDTCG()`, `validate()`, `toTailwindTheme()`).
  - The recipes run as tests in CI so they don't go stale.
  - `color-map-cli` uses MCU directly to offer Material schemes, since the CLI already has dependencies.

  Revisit this if the recipes keep producing user mistakes, or if a vendored, tree-shaken HCT (about 8.4 KB versus 20 KB) becomes worth its Apache-2.0 notice and upkeep.

#### Phases

| Phase | Deliverable | Done when |
|---|---|---|
| **P0. Color core** | Color type, the 15 spaces, the conversion graph, Color 4 parser (all forms in R1 except Color 5), `toCss()`, `toHex()`, `inGamut`, `toGamut` (css and clip), `deltaEOK`, `equals` | WPT css-color parse and serialization vectors pass; random round trips agree with colorjs.io to 1e-6; size budget met |
| **P1. Interpolation and Color 5** | `mix(a, b, t, { in, hue })` following CSS §13 (missing-value carry-forward, premultiplied alpha, four hue methods); parsing and resolving `color-mix()`; relative color with a `calc()` subset (`+ - * /`, `min`, `max`, `clamp`); `light-dark()`; `contrast-color()`; `resolve()` | Spec examples for color-mix and relative color reproduce exactly; browser output matches in a Playwright check |
| **P2. Contrast and pairs** | `contrast(fg, bg, algo)`, `meets(level)`, `onColor(bg)` (Radix rule: white, unless contrast is too low, then a tinted near-black), `findContrast(bg, target, { hue, chroma })` (binary search on L* or OKLCH L) | Every returned pair meets its target; achieved ratios are returned |
| **P3. Scales** | `createScale({ seed, steps, lightness, chroma, hueShift, gamut })` with presets `tailwind-11`, `radix-12`, `tone-13` and `even`; `createContrastScale` (Leonardo-style); `scaleFromBrand` (Radix generator: the input color lands exactly at step 9); `tonalPalette(hue, chroma, tones)` with L* tones | The `tailwind-11` preset rebuilds Tailwind's blue within ΔEOK 0.02 of each step; the tone presets keep the tone-gap contrast guarantee |
| **P4. Harmony, dark mode and semantic palettes** | `harmony(color, 'complementary' \| 'split' \| 'analogous' \| 'triadic' \| 'tetradic', { space })`; `harmonize(color, toward)` (Material's rule: at most 15°); `inverse(color, 'lightness' \| 'rgb')`; `darkVariant(scale, 'mirror' \| 'tone-swap' \| 'lightness-invert')`; `semanticPalette({ brand, mode, contrast })` giving primary, a neutral tinted with the brand hue, success, warning, danger, info and surface/on-surface roles; `validate(palette)` | Each role pair records its achieved ratio; `validate` reports pairs that fail, scales whose lightness doesn't change steadily, and colors that were clipped |
| **P5. Output formats** | `toDTCG()` (2025.10, with a hex fallback), `toCssVariables()`, `toTailwindTheme()` | DTCG output passes the spec's own checks; the Tailwind block works in Tailwind v4 |
| **P6. Agent surface** | A CLI in its own package (`packages/cli`, for example `npx color-map-cli scale '#3b82f6' --preset radix-12`). It is built on clibuilder and follows the axi principles; see D10. An agent skill is shipped with universal-plugin. Published JSON Schemas for every option object. `llms.txt`. No MCP server. | An agent with the skill produces a valid semantic palette, with every contrast pair passing, from one prompt and without hand-written code |

#### Website (`apps/website`), built alongside the phases

The site lives in `apps/website`, and a root `package.json` script named `web` runs it.


- **W1 (with P0).** Converter: paste any CSS color, see it in every space, with in-gamut flags for sRGB, P3 and Rec.2020 and a clip-versus-map comparison.
- **W2 (with P1).** color-mix and relative-color playground, with the library's result next to the browser's own rendering.
- **W3 (with P2–P4).** Palette builder: seed to scale (choose a preset), a contrast matrix (WCAG 2, plus APCA if a plug-in is supplied), light/dark preview on sample UI, harmonies.
- **W4 (with P5–P6).** Export panel (DTCG, CSS, Tailwind), API docs and an "ask an agent" example.

The site uses the Astro + Starlight house layout from the `add-website` skill, with interactive islands for the playgrounds.

#### Open questions for the owner

- **Q1.** APCA, open. It is popular but not a standard:
  - apca-w3 has about 466k npm downloads a month, close to wcag-contrast's 536k;
  - Chrome DevTools 149 (June 2026) made APCA a regular setting rather than an experiment;
  - Radix, Leonardo and Harmonizer all use it;
  - WCAG 3 has not chosen it (E97, E98, E62).

  Because D6 makes contrast a parameter anyway, "left out" and "plug-in" differ only by a documented adapter. Proposed resolution (D11): no APCA code and no APCA package. The docs and the website get a tested recipe built on colorjs.io's own MIT implementation, not on `apca-w3`, whose license forbids commercial use without a signed agreement (E105).

  apca-w3's license, including its naming clause, binds only people who use apca-w3's code. colorjs.io's `APCA.js` is separate MIT code that cites apca-w3 as its reference (E106), so a CLI `--contrast apca` built on it does not accept that license. Two risks remain whoever wrote the code, and both are unverified:
  - "patent(s) pending": a granted patent would cover any implementation;
  - a possible trademark in the name "APCA".

  Legal review is advisable before the CLI ships APCA.
  Decision (issue #255): the CLI does not offer `--contrast apca`. No legal check was obtained, so the unverified patent and trademark risks stay unaccepted. The core's `ContrastFn` adapter and the recipe still let people use APCA themselves. Reopen if a legal check clears it.
- **Q2.** Material tones, open. The two options:

  | | A. L* tone with OKLCH hue and chroma | B. Port HCT (CAM16 hue and chroma plus the L* tone solver) |
  |---|---|---|
  | Contrast guarantee | the same, since contrast follows L* (E96) | the same |
  | Size | close to zero; reuses the Lab and OKLCH code from P0 | about 8.4 KB gzipped for HCT plus TonalPalette taken directly; 20 KB through the package root, which doesn't tree-shake (E101) |
  | Same output as Material Theme Builder | no | yes |
  | Reusing Material's tables (variant chromas 36/16/24, rotation tables) | no; they are in CAM16 units and must be re-tuned for OKLCH | yes, as is |
  | Fits the rest of the library | yes; everything stays OKLCH and CSS-native | adds a second hue model for users to understand |
  | Licensing and upkeep | none | Apache-2.0 code inside an MIT package needs its NOTICE kept, and tracking Google's 2021/2025/2026 spec changes |

  Proposed resolution (D11): A is the core default. People who want exact Material output use Material Color Utilities directly, through `fromArgb` and a tested recipe. The CLI offers Material schemes through MCU.
- **Q3.** Resolved by D8: keep the existing functions as wrappers, with minor releases only.
- **Q4.** Resolved: `apps/website`, plus a root `web` script.
- **Q5.** Resolved by D10: a separate CLI package on clibuilder following axi, a skill shipped with universal-plugin, and no MCP server.

## Confidence

- **Color engine: high.** It rests on the CSS specs themselves (E01–E36) and on running the competing libraries (E92–E94).
- **Palette algorithms: medium-high.** Tailwind, Radix, Material and Leonardo were read from source code (E37–E53). The intended design rules behind Tailwind's numbers are not published, so the curve preset is fitted to its data.
- **Size and effort estimates: low** (E91).

## Strongest support

- The CSS Color 4 §11, §13, §14, §16 and §19 text gives the algorithms and matrices directly (E10, E14–E18, E22–E25).
- Running culori 4.0.2 and colorjs.io 0.7.1 shows that neither parses Color 5 functions, `currentcolor` or system colors (E92).
- DTCG 2025.10 is stable and defines exactly the 14 CSS spaces as `{colorSpace, components, alpha, hex}` (E95).
- Source code for Tailwind's theme, the Radix generator, Material's DynamicScheme/TonalPalette/Blend and Leonardo (E37–E53).

## Strongest counterevidence

- Most browsers clip instead of gamut-mapping (E20). A spec-correct mapped result can differ from what users see in a browser, so `clip` must stay available and the website should show both.
- `contrast-color()` uses a browser-chosen algorithm (E05). The library's WCAG 2 version can pick a different color from the browser for mid-tone backgrounds.
- Shipped palettes are hand-tuned (Tailwind, Radix). A purely algorithmic scale may look worse than those references for yellows and blues, which is why the hue-shift option exists.

## Not supported

- That APCA is part of WCAG 3. The current WCAG 3 draft leaves the algorithm undecided (E62, E63).
- That evenly spaced L steps make a good scale. No major shipped system uses them (E37, E41, E52).
- That HSL hue rotation gives balanced harmonies. Rotating in OKLCH at fixed L and C does better, though this rests on practitioner explanations rather than studies (E70–E72).

## Thin evidence

- Material's tone-gap numbers (40 for 3:1, 50 for 4.5:1) came from a code comment seen through search, not read directly (E49).
- How browsers behave on gamut mapping: the source contradicts itself on whether Firefox's version is shipped or behind a flag (E20).
- The working spaces of Carbon, Primer, Huetone, Atmos and uicolors.app (E54–E61).
- Whether an MIT library can legally ship an APCA implementation (E65).
- Whether `display-p3-linear` belongs to Color 4 or Color 5, and the exact OKLCH powerless-hue epsilon (E13, E34).

## Recheck triggers

- CSS Color 4 reaches Recommendation, or the serialization or gamut-mapping text changes.
- Color 5 `contrast-color()` gains algorithm options, or Level 6 moves to a Working Draft.
- Chrome or Safari ships gamut mapping (interop#1394).
- WCAG 3 picks a contrast algorithm.
- A DTCG release after 2025.10 changes the color value.
- culori or colorjs.io adds Color 5 parsing, which would remove the gap this plan relies on.
