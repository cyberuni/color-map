# Modern CSS color and design-system palettes for color-map (October 2026)

## Question

1. Which ways of defining a color does modern CSS support (Color 4, Color 5, and the Color 6 and HDR drafts), and what must `color-map` do to parse, represent and convert between them?
2. How do leading design systems generate scales, step intervals, harmonies and contrast pairs, and what should `color-map` expose so that an AI agent can generate a design-system palette?
3. Which existing libraries and token formats shape the build-versus-depend decision and the output format?

## Scope

**In scope:**
- Every CSS color syntax and color space.
- Conversion math, gamut mapping, serialization, and interpolation including missing components.
- Browser support.
- Scale systems: Tailwind v4, Radix, Material 3 HCT, Leonardo, Carbon, Primer, Open Props, and OKLCH-based tools.
- WCAG 2, APCA and `contrast-color()`.
- Dark-mode derivation.
- JS/TS color libraries.
- The DTCG token format.
- Agent-facing tools.

**Out of scope:**
- ICC profile handling (`@color-profile`).
- Rendering HDR colors.
- Image quantization (Material's quantizers).
- The demo website's implementation details. The plan covers what the site shows, not how it is built.

## Source angles

- **W3C specifications:** CSS Color 4, 5, 6 and HDR 1; WCAG 3; the DTCG Color Module 2025.10.
- **Browser support data:** the webstatus.dev API, MDN, and web-platform-tests interop issues.
- **Maintainer writing:** Björn Ottosson on Oklab; csswg-drafts issues by Chris Lilley, Isaac Muse and Lea Verou.
- **Design-system source code:** Tailwind's `theme.css`, the Radix website generator, Material Color Utilities and Leonardo.
- **Design-system docs:** Radix, Carbon, Primer, APCA.
- **npm registry and package inspection,** plus an executed probe of culori and colorjs.io parsing.
- **Practitioner blogs:** Evil Martians, Adrian Roselli.

## Findings

The full findings live in three strand reports, kept in `raw/`. The reports keep their original claim IDs, and `evidence.md` maps them to E-numbers.

- **`raw/A-css-color.md` (E01–E36):**
  - spec status;
  - a table of every color function and space;
  - `none` and powerless components;
  - the Color 5 functions;
  - Baseline dates;
  - the conversion pipeline and matrix sources;
  - the three CSS gamut-mapping algorithms;
  - serialization rules.
- **`raw/B-palettes.md` (E37–E76):**
  - Tailwind v4 L and C tables per step;
  - Radix step purposes and the generator algorithm;
  - Material variant hue and chroma tables, rotation tables and role tones;
  - the Leonardo algorithm;
  - interval strategies;
  - harmony and pairing rules;
  - WCAG 2, APCA and Bridge-PCA;
  - dark-mode practice;
  - a recommended function list and output shape.
- **`raw/C-libraries.md` (E77–E91):**
  - a library comparison;
  - build-versus-depend;
  - the DTCG format;
  - existing palette MCP servers.

### Synthesis findings (E92–E96)

- **Color 5 parsing is the gap.** An executed probe confirmed that culori 4.0.2 and colorjs.io 0.7.1 parse every Color 4 form tested. Neither parses `color-mix()`, relative color, `light-dark()`, `contrast-color()`, `currentcolor` or system colors (E92). This replaces the strand C grep result (E86).
- **DTCG shape verified.** The DTCG 2025.10 color value was checked directly against the spec: `{colorSpace, components (number | "none"), alpha?, hex? (6-digit)}`, with 14 spaces (E95).
- **Contrast follows tone.** WCAG contrast depends only on luminance Y, and HCT tone is CIE L*, which is a function of Y. So any palette that sets L* exactly keeps Material's tone-gap contrast guarantee, whatever hue and chroma model it uses. That is why the plan uses OKLCH hue and chroma with L* tones instead of porting CAM16 (E96).

## Contradictions

- **Browser gamut mapping.** interop#1394 says Firefox has both "shipped" gamut mapping and has it "behind a flag" (E20).
- **When APCA left WCAG 3.** One source says it was removed from the July 2023 draft (E63). A May 2026 blog says it was pulled in April 2026. The W3C draft of September 2026 only says "to be determined" (E62).
- **Oklab matrices.** The CSS spec's matrices differ from those printed in Ottosson's blog around the 4th decimal. The spec's are recalculated on purpose, so use the spec's (E16, E17).
- **APCA license versus use.** apca-w3's license restricts use and naming (E65), yet MIT libraries such as colorjs.io and the Radix generator ship APCA.

## Open questions

- Is the OKLCH powerless-hue epsilon 0.000004? Not re-extracted from the spec (E13).
- Does `display-p3-linear` belong to Color 4 or Color 5 (E34)?
- What exactly does the Ray Trace gamut-mapping algorithm specify?
- What do csswg issues #9449, #10579 and #14069 cover?
- Can WPT `css/css-color` vectors be reused for tests, and under what license?
- Which working spaces do Carbon, Primer, Huetone, Atmos and uicolors.app use?
- What do Material's 2025 and 2026 role tones look like (only the 2021 roles were listed)?
- Can an MIT library include an APCA implementation?
- What did the culori and colorjs.io maintainers write about their API design trade-offs?

## Sources consulted

- CSS Color 4: https://www.w3.org/TR/css-color-4/
- CSS Color 5: https://www.w3.org/TR/css-color-5/
- CSS Color 6: https://drafts.csswg.org/css-color-6/
- CSS Color HDR 1: https://www.w3.org/TR/css-color-hdr-1/
- DTCG Color Module 2025.10: https://www.designtokens.org/tr/2025.10/color/
- WCAG 3 Working Draft: https://www.w3.org/TR/wcag-3.0/
- webstatus.dev API: https://api.webstatus.dev/v1/features/
- MDN CSS color pages: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
- interop#1394: https://github.com/web-platform-tests/interop/issues/1394
- csswg-drafts#7071: https://github.com/w3c/csswg-drafts/issues/7071
- Ottosson, A perceptual color space for image processing: https://bottosson.github.io/posts/oklab/
- Tailwind `theme.css`: https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/theme.css
- Radix generator: https://github.com/radix-ui/website/blob/main/components/generate-radix-colors.tsx
- Radix scale docs: https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- Material Color Utilities: https://github.com/material-foundation/material-color-utilities
- Leonardo: https://www.npmjs.com/package/@adobe/leonardo-contrast-colors
- APCA (apca-w3): https://github.com/Myndex/apca-w3
- Adrian Roselli, WCAG 3 contrast as of April 2026: https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html
- Evil Martians, OKLCH articles and Harmonizer: https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
- Carbon: https://carbondesignsystem.com/elements/color/overview/
- Primer: https://primer.style/product/getting-started/foundations/color-usage/
- npm registry: culori, colorjs.io, chroma-js, @material/material-color-utilities, apca-w3, colord, @texel/color, style-dictionary
