# B: Palette, scale, harmony and contrast algorithms (for color-map)

Research date: 2026-10-30. Source types: [code] = primary source code read directly; [doc] = official docs; [spec] = W3C spec/draft; [blog] = practitioner/third-party; [search] = web search snippet only (weak).
Source files (Tailwind theme.css, MCU dynamic_scheme.ts, color_spec_2021/2025.ts, tonal_palette.ts, the Radix generator, the Leonardo package) were read from local copies during research; the copies are not preserved. URLs are in the evidence list.

## 1. Findings by theme

### 1.1 Scale systems

**Tailwind v4 (50..950, 11 steps, OKLCH).** theme.css stores `oklch(L% C H)` per step [code]. The curve is hand-tuned and NOT a formula, but is shared closely across hues. Aggregated across the 17 chromatic hues (my computation from theme.css):

| step | L mean (min-max) | C mean (max) |
|---|---|---|
| 50 | 97.7 (96.2-98.7) | 0.018 (0.031) |
| 100 | 95.0 (93.0-97.3) | 0.042 (0.071) |
| 200 | 90.5 (87.0-94.5) | 0.080 (0.129) |
| 300 | 84.0 (78.5-90.5) | 0.135 (0.196) |
| 400 | 75.4 (67.3-85.2) | 0.189 (0.238) |
| 500 | 68.3 (58.5-79.5) | 0.214 (0.295) |
| 600 | 59.8 (51.1-68.1) | 0.213 (0.293) |
| 700 | 51.5 (45.7-55.5) | 0.187 (0.270) |
| 800 | 44.6 (39.8-47.6) | 0.154 (0.232) |
| 900 | 39.5 (35.9-42.1) | 0.124 (0.189) |
| 950 | 27.8 (25.7-30.2) | 0.088 (0.149) |

- Blue: L = 97, 93.2, 88.2, 80.9, 70.7, 62.3, 54.6, 48.8, 42.4, 37.9, 28.2; C peaks 0.245 at 600; hue 254.6 -> 267.9 (drifts toward violet when dark).
- Yellow: L 98.7 -> 28.6, C peak 0.199 at 400, hue 102 -> 54 (drifts strongly to orange/brown when dark). Amber 95 -> 45.6. Red 17 -> 27 -> 26. Green ~149-157 (small drift). So hue is NOT constant; it drifts per hue family, strongest for yellow/amber.
- Chroma is a bell: low at 50, max around 500-600, tapering to ~0.09 at 950. Lightness is not linear: gaps shrink from ~4.7 per step at the light end to ~10 between 900 and 950 at the dark end. Neutral L: 98.5, 97, 92.2, 87, 70.8, 55.6, 43.9, 37.1, 26.9, 20.5, 14.5.
- Tailwind does not publish the derivation. Third-party reverse engineering exists (Matteo Frana, DeltaE2000 nearest-match) [blog/search].
- Evil Martians fitted a reusable curve to Tailwind: L = 97.78, 93.56, 88.11, 82.67, 74.22, 64.78, 57.33, 46.89, 39.44, 32, 23.78 and a fixed per-step chroma 0.0108, 0.0321, 0.0609, 0.0908, 0.1398, 0.1472, 0.1299, 0.1067, 0.0898, 0.0726, 0.054, with a "max chroma then clamp to gamut" alternative [blog]. Useful as a ready default curve.

**Radix Colors (12 steps, separate light and dark scales per hue).** Step purposes [doc]:
1 app background; 2 subtle background; 3 UI element background; 4 hovered UI element bg; 5 active/selected UI element bg; 6 subtle borders/separators; 7 UI element border and focus rings; 8 hovered UI element border / stronger focus ring; 9 solid backgrounds (purest, highest chroma); 10 hovered solid; 11 low-contrast text; 12 high-contrast text.
- Contract: steps 11 and 12 are designed to reach APCA Lc 60 and Lc 90 on a step-2 background of the same scale; step 9 is designed for white text except sky, mint, lime, yellow, amber (dark text) [doc].
- 31 hue scales including 6 tinted grays (gray, mauve, slate, sage, olive, sand). Scales are hand-tuned, dark scales shipped separately (`xxxDark`, P3 variants too) [code: generator imports `RadixColors[name]` and `[name]Dark`].
- Custom palette generator (radix-ui/website `components/generate-radix-colors.tsx`) [code]: converts all Radix scales to OKLCH; finds the nearest existing scale(s) to the input using deltaEOK on every step color; mixes the two nearest scales with a ratio computed from triangle geometry (case: obtuse angle => use only the closest); then sets hue of every step to the input hue; rescales chroma by `ratioC = input.C / closest.C` capped at `input.C * 1.5`; then re-projects the lightness progression to start at the user's background lightness using cubic-bezier easing (light mode `[0,2,0,2]`, dark mode `[1,0,1,0]`, easing flattened toward linear when the background is lighter than the reference step 1). Step 9 is set to the exact input color (unless within deltaEOK*100 < 25 of the background), step 10 (hover) = L -/+ 0.03/(L+0.1) and C*0.93, steps 11-12 chroma capped to max(C8, C9). Foreground on step 9: white unless |APCA Lc| < 40, then OKLCH(0.25, max(0.08*C, 0.04), H). Also emits alpha variants (solve alpha so that color over background == step) and a "surface" token. This is the best reference algorithm for "scale from one brand color".

**Material 3 HCT tonal palettes.** HCT = CAM16 hue and chroma + CIELAB L* as tone; tone 0 black, 100 white [code/doc]. `TonalPalette.fromHueAndChroma(h, c)`: hue and chroma held constant, tone varies; each tone is solved by the HCT solver as the in-gamut sRGB color with that hue/tone and the closest chroma <= requested (so chroma naturally tapers at extremes where gamut shrinks); special case tone 99 for yellow hues is averaged from tones 98 and 100 [code]. A palette has a "key color" (the tone where requested chroma is achievable, found by binary search around pivot tone 50) [code]. Standard tones: 0,10,20,30,40,50,60,70,80,90,95,99,100 [code/doc]. Nothing is hue-shifted across tones (constant CAM16 hue), but because HCT hue is perceptual-ish, Material compensates by rotating hues between palettes, not within one.

Seed -> five key palettes (dynamic_scheme.ts, 2021 delegate) [code]. h = seed hue, c = seed chroma:

| Variant | primary | secondary | tertiary | neutral | neutral variant |
|---|---|---|---|---|---|
| TonalSpot (default) | h, 36 (2025 phone: 32, dark 26) | h, 16 | h+60, 24 | h, 6 | h, 8 |
| Vibrant | h, 200 (2025: 74) | rotate(h by table), 24 | rotate(table), 32 | h, 10 | h, 12 |
| Expressive | h+240, 40 (2025: 48/36 light/dark) | rotate(table), 24 | rotate(table), 32 | h+15, 8 | h+15, 12 |
| Neutral | h, 12 | h, 8 | h, 16 | h, 2 | h, 2 |
| Monochrome | h, 0 | h, 0 | h, 0 | h, 0 | h, 0 |
| Fidelity | h, c | h, max(c-32, c*0.5) | complement via TemperatureCache, fixed if "disliked" | h, c/8 | h, c/8+4 |
| Content | h, c | same as Fidelity | analogous(3,6)[2] via TemperatureCache | h, c/8 | h, c/8+4 |
| Rainbow | h, 48 | h, 16 | h+60, 24 | h, 0 | h, 0 |
| FruitSalad | h-50, 48 | h-50, 36 | h, 36 | h, 10 | h, 16 |

Error palette default: hue 25, chroma 84. Vibrant rotation tables: breakpoints [0,41,61,101,131,181,251,301,360] with secondary rotations [18,15,10,12,15,18,15,12,12] and tertiary [35,30,20,25,30,35,30,25,25]. Expressive: breakpoints [0,21,51,121,151,191,271,321,360]; secondary [45,95,45,20,45,90,45,45,45], tertiary [120,120,20,45,20,15,20,120,120]. Older CorePalette: a1 = (h, max(48,c)), a2 = (h, c/3), a3 = (h+60, c/2), n1 = (h, min(c/12,4)), n2 = (h, min(c/6,8)) [code].
- Tone assignment by role (2021 spec): light/dark primary 40/80, on-primary 100/20, primary-container 90/30, on-primary-container 10/90, surface/background 98/6 (neutral), surface-variant 90/30, on-surface-variant 30/80, outline 50/60, outline-variant 80/30, inverse-surface 20/90, error 40/80, surface-container-lowest 100/4 (light/dark), plus containers between [code]. 
- Contrast guarantee: tone delta >= 40 gives >= 3:1, >= 50 gives >= 4.5:1 (comment in Google's HCT code, Material blog) [code/blog]. The 2025 spec adds `ToneDeltaPair` constraints and `ContrastCurve(low, normal, medium, high)` indexed by `contrastLevel` in [-1, 1] (0 default, 0.5 medium, 1 high) so one scheme can be generated at several contrast levels [code]. Contrast check uses WCAG ratio on Y derived from tone: `(Ylight+5)/(Ydark+5)` (Y in 0-100) [code].
- Spec versions in repo: 2021, 2025, 2026 (`color_spec_2026.ts` exists; 2026 falls back to 2025 for the classic variants) and new CMF variant [code]. Platforms: phone, watch.

**Adobe Leonardo.** Contrast-ratio-targeted. Inputs: `colorKeys` (key colors), `colorspace` (LCH, LAB, CAM02/JCh, HSL, HSLuv, HSV, RGB), `ratios` (array or named object), background color, theme-level `contrast` multiplier and `saturation`, `formula` 'wcag2' (default) or other [code, v1.1.0]. Algorithm: build a 3000-sample interpolated scale between white, the key colors sorted by lightness, and black (optionally smooth/bezier, optional lightness distribution `shift`/'polynomial'); then for each target ratio do a binary search along that scale (tolerance 0.01, 100 iterations) for the sample whose contrast with the background hits the ratio. Negative ratios mean "darker than background in dark themes" (sign encodes polarity). The multiplier is applied as `(ratio-1)*m+1`, so contrast 1 = baseline, >1 scales all targets. Output names are ratio-derived (gray100, gray200...). License Apache-2.0 [code]. Hue is whatever the interpolation space produces (not constant); chroma not controlled except through key colors and the saturation knob.

**IBM Carbon.** Hue palettes with 10 grades per hue (10..100) plus black/white [doc]. Carbon's own contrast table gives the minimum grade distance that yields 4.5:1 (small text) and 3:1 (large/graphics), e.g. Gray 100 vs White needs 5 grade steps for 4.5:1 [doc]. Themes: White, Gray 10 (light), Gray 90, Gray 100 (dark) use different layering sequences instead of shadows (dark: Gray 100 background, layers Gray 90, 80, 70) [doc]. Color space not documented.

**GitHub Primer.** Base scales 0..9 per hue; grays 0..13; light and dark neutral scales are inverted so functional tokens work in both; neutral steps 0-6 backgrounds, 7-8 borders (8 minimum for control borders), 9-10 text; 9 min contrast against 0-4, 10 against 5-6 [doc]. Functional tokens `bgColor/fgColor/borderColor` with `default, muted, emphasis`, semantic families accent, success, attention, danger, open, closed, done, sponsors; hard pairing rules (`bgColor-*-emphasis` pairs with `fgColor-onEmphasis`; `bgColor-*-muted` pairs with `fgColor-{semantic}`) [doc]. Nine themes incl. dark-dimmed, high-contrast, colorblind, tritanopia built via override files [doc]. Primer Prism (scale tool, built on Leonardo, ColorBox, Palx) was archived on 2024-12-10 [doc]; its algorithm is not documented in README.

**Open Props.** 19 hue families x 13 steps (0..12), hex values, light to dark, no dark variants in the colors file [code]. Derived from the Open Color lineage (not verified here: low confidence). No OKLCH scale in that file.

**Huetone** (ardov). Interactive editor where you edit a palette grid and see contrast matrices for APCA and WCAG 2; README only credits CSS WG/Lea Verou code for conversions and chroma.js; "cielab" topic tag; I could not verify the working space from the README (the web app is believed to work in LCH/OKLCH; unverified) [doc, low].

**Harmonizer (Evil Martians).** Figma plugin: OKLCH, each level (100-900 etc.) has a target contrast (APCA default, WCAG optional) against a chosen background, hues named by user, exports Tailwind/CSS vars/JSON; the contrast engine is APCACH, which combines OKLCH and APCA [doc]. This is the same idea as Leonardo but in OKLCH with chroma held per hue.

**Atmos.** OKLCH shade generator with configurable easing curves and optional hue shift as scale goes from light to dark (blue drifts toward purple when dark, toward cyan when light); WCAG 2 and APCA checks; exports CSS, Tailwind, Style Dictionary, Figma [vendor marketing, low confidence].

**oklch.com / uicolors.app.** oklch.com is a picker showing the real OKLCH gamut (Evil Martians). uicolors.app: page does not document its algorithm; "color harmony settings: auto" only [doc, unknown]. Not verifiable.

### 1.2 Comparison table

| System | Steps | Space | Held constant | Varies | Chroma taper | Hue shift | Dark mode | Contrast guarantee |
|---|---|---|---|---|---|---|---|---|
| Tailwind v4 | 11 (50-950) | OKLCH (stored) | shared L curve (approx.) | C, H, L | bell, peak 500-600, ~0.02 at 50, ~0.09 at 950 | yes, hand-tuned (yellow 102->54, blue 255->268) | same scale, user picks step (`dark:`) | none |
| Radix | 12, purpose-labelled | hand-tuned; generator uses OKLCH | purpose per step | L curve differs light/dark | per-scale, step 9 max chroma, 11-12 capped | per scale, generator forces single hue | separate dark scale per hue | step 11 >= Lc 60, 12 >= Lc 90 on step 2 (APCA) |
| Material 3 HCT | tones 0-100, 13 named | HCT (CAM16 h,c + L*) | hue and requested chroma per palette | tone | clipped to gamut (natural) | none within palette; rotated between palettes | same palettes, different tones (40 -> 80 etc.) | tone delta 40 = 3:1, 50 = 4.5:1; contrast levels -1..1 |
| Leonardo | arbitrary ratios | user-chosen (LCH, LAB, CAM02, HSLuv...) | contrast ratio per swatch | L solved by search | from key color interpolation | from interpolation | themes with negative ratios / dark background | exact target ratio (WCAG 2 default) |
| Carbon | 10 grades | not documented | grade distance rule | | | | separate dark themes | grade-distance table to 4.5/3 |
| Primer | 0-9 (grays 0-13) | not documented | | | | | inverted scales | WCAG AA rules per pair |
| Open Props | 13 | hex | | | | | none | none |
| Evil Martians fit | 11 | OKLCH | hue, fixed C per step | L, C | explicit C list above | none | n/a | none |
| Harmonizer | N | OKLCH | hue/chroma per hue | L solved from contrast | per config | none | background choice | APCA or WCAG target per level |

### 1.3 Interval / step strategies

1. Even L steps in OKLCH are not what shipped palettes use. Tailwind has L steps of roughly 2-4 at light end growing to 6-10 near the dark end (see table), Radix uses cubic-bezier easing over L [code], Leonardo uses a pow/polynomial "distribute lightness" and contrast targeting [code]. Recommendation: expose a lightness-curve parameter (array or bezier) rather than only linear.
2. Contrast-targeted steps (Leonardo, Harmonizer, Huetone): pick each step by binary search on L (monotonic) at fixed hue/chroma until contrast with the background equals the target. This guarantees constant contrast between adjacent roles across all hues, which fixed-L scales do not (blue and yellow of equal L give different WCAG ratios because WCAG uses relative luminance).
3. Max-chroma-in-gamut per step: Material requests a chroma and the solver returns the closest in-gamut chroma at that tone (Vibrant uses chroma 200 = "as much as possible"); Evil Martians recommends a fixed per-step chroma instead of max because max produces uneven brightness across hues [blog]. Gamut-map by reducing chroma at constant L and H (not clip RGB) [CSS Color 4 recommendation, not re-fetched; medium].
4. Hue drift: Tailwind's data shows darker yellow drifts toward orange (102 -> 54) and blue toward violet; these compensate perceptual shifts (Abney effect: adding white to a mono colour changes apparent hue; Bezold-Brucke: hue shifts with intensity). Sources disagree on direction for B-B [search snippets]; no measured magnitudes found. Practical recommendation: ship an optional per-hue-family hue-shift table derived from Tailwind's data (L vs H per family), default small, and make it a parameter. Atmos exposes it as a user option.
5. Ottosson: Oklab improves hue linearity (blue stays blue; CIELAB, CIELUV, HSV drift toward purple) and lightness prediction (RMS 0.20 vs CIELAB 1.70), but data are CAM16-generated, so cannot prove perceptual truth; JzAzBz had slightly lower hue error [blog, primary author]. OKLCH hue is still not perfectly constant under lightness changes; hence the drift in Tailwind's hand-tuned data.

### 1.4 Harmonies and pairs

- Harmonies are hue rotations: complementary +180, split-complementary +150/+210, analogous +/-30, triadic +/-120, tetradic (square +90/+180/+270 or rectangle). Space matters: in HSL the same angle yields very different luminance (hsl(60,100%,50%) yellow is far brighter than hsl(240,100%,50%) blue). In OKLCH holding L and C and rotating H keeps perceived lightness stable, though the fixed (L,C) pair may be outside sRGB at some hues so gamut mapping is needed [blog/search]. OKLCH hue angles also do not equal HSL hue angles; "complement" in OKLCH differs from the RYB/HSL complement of art-school wheels. No primary-source study; flag as practitioner consensus.
- Material uses temperature-based pickers instead of pure rotation for Fidelity/Content (TemperatureCache complement/analogous) and avoids "disliked" colors (DislikeAnalyzer fixes ugly dark-yellow/green in a band) [code].
- Material `Blend.harmonize(design, source)`: in HCT, rotate design hue toward source hue by `min(angularDifference*0.5, 15)` degrees; chroma and tone kept [code, exact]. Also `Blend.hctHue(from,to,amount)` blends hue only with CAM16-UCS and keeps from-chroma and from-tone [code].
- Inverse / dark mode inversion: RGB invert (255-c) flips hue to the opposite and ruins brand colors; correct "inversion" is lightness inversion: map L -> (1-L) or use the mirror step in the scale (step n <-> 13-n for Radix-like, Primer "inverted scales" [doc], Material tone swap [code]). Not a formula in any single source; recommended design below.
- On-color / contrast pairs: Material `on-X` has the same palette hue as X, tone chosen to meet a contrast curve vs X (on-primary 100/20 against primary 40/80) [code]. Radix: foreground on solid step 9 is white or dark; step 11/12 text on step 1-2 backgrounds with Lc 60/90 contract [doc]. Radix generator: white unless Lc < 40 else near-black tinted OKLCH(0.25, ...). Primer: `fgColor-onEmphasis` [doc]. Leonardo: any color at a ratio vs a background [code]. CSS `contrast-color()` returns only white or black.

### 1.5 Contrast algorithms

- **WCAG 2.x**: contrast = (L1 + 0.05)/(L2 + 0.05) with relative luminance L = 0.2126 R + 0.7152 G + 0.0722 B on linearised sRGB (sRGB gamma 2.4 piecewise); thresholds 4.5:1 text (AA), 3:1 large text (>= 24 px or 18.66 px bold) and UI/graphics, 7:1 AAA body text, 4.5:1 AAA large [well known; Carbon and Primer docs cite 4.5/3]. Known flaws: no polarity awareness; overstates contrast for dark colors (4.5:1 can be unreadable near black), mid-tones can be "AA-passing" in white or black yet poor (per APCA nutshell page and MDN contrast-color note) [doc]. Material's own tone math uses ratio (Y+5)/(Y+5) with Y on 0-100 [code].
- **APCA** (Myndex): output Lc, signed (polarity: positive dark-on-light, negative light-on-dark in the library), approx 0 to +/-108. Constants of 0.0.98G-4g (unchanged since 2021-02-15): mainTRC 2.4, normBG 0.56, normTXT 0.57, revTXT 0.62, revBG 0.65, coefficients 0.2126729/0.7151522/0.0721750, blkThrs 0.022, blkClmp 1.414, loClip 0.1, deltaYmin 0.0005, scaleBoW=scaleWoB 1.14, loBoWoffset=loWoBoffset 0.027; apca-w3 npm 0.1.9 [doc, GitHub]. Lc guide: 90 preferred body (fluent text at 18px/300 or 14px/400 and up), 75 minimum body (e.g. 18px/400), 60 minimum non-body content text (24px/400 or 16px/700), 45 headlines/large (36px/400 or 24px/700), 30 absolute minimum other text/placeholder, 15 absolute minimum non-text [doc, APCA in a Nutshell]. Font lookup table (size x weight -> Lc) exists at Silver/Gold level (not reproduced here; read the apca-w3 repository for it).
- **WCAG 3 status** (verified): The W3C Working Draft of 10 September 2026 states "the contrast algorithm used in WCAG 3 is yet to be determined" and uses placeholders "contrast measure to be determined"; the editor notes it assumes the algorithm will include a size/weight factor and may need a separate CVD requirement [spec]. Adrian Roselli (Apr 2026): APCA was marked exploratory early 2023 and removed from the July 2023 draft; WCAG 3 completion estimated 2030 at earliest; Bridge-PCA is mentioned as a WCAG 2-compatible APCA-based option [blog]. A May 2026 blog claiming APCA was pulled "as of April 2026" conflicts on date; the primary evidence supports 2023 removal (see section 4). WCAG 2.2 AA remains the legal baseline.
- **APCA licensing**: apca-w3 is licensed "Limited W3 License / W3 License for Compliant Code Only"; GitHub reports license NOASSERTION; the LICENSE restricts use to WCAG-related web content, says use of the terms "APCA"/"SAPC" is only allowed for code correctly implemented per Myndex's compliance page (notably polarity and current constants), says "patent(s) pending", and says non-W3 uses fall under AGPLv3 [doc, LICENSE.md]. Implication for a zero-dependency MIT library: do not copy apca-w3 source; the formula itself is published, but naming it APCA triggers the compliance clause; safest options are WCAG 2 as built-in default, offer an optional adapter that accepts a caller-supplied APCA function, or implement and not call it APCA (legal review recommended). Radix generator and Harmonizer use colorjs.io's APCA (`contrastAPCA`); colorjs.io is MIT [code]; check its notice before reuse.
- **Bridge-PCA**: APCA-based, WCAG 2-compatible mapping Lc 60/75/90 ~ 3:1/4.5:1/7:1 (other sources Lc 58/72/85); polarity-sensitive; free for web content; public beta 0.1.5/0.1.6 [npm/search, low-medium]. DeltaPhi: not researched (no source found).
- **CSS `contrast-color()`** (CSS Color 5): single-argument, returns white or black, white on tie; the algorithm is "UA-defined at this level", advises against using the WCAG 2.1 ratio alone, but result should still meet WCAG 2.1 1.4.3 AA large text; future levels are expected to add algorithm/return-color control. MDN: Baseline 2026 newly available since April 2026; mid-tone backgrounds (example #2277d3 -> black) can be poor for small text [spec/doc].

### 1.6 Dark mode

- Hand-tuned separate scales: Radix ships separate dark scales and its generator uses a different easing for dark ([1,0,1,0]) than light ([0,2,0,2]) [code]; Primer inverts neutral scales so tokens swap meaning [doc]; Carbon uses distinct themes (Gray 90/100) [doc].
- Algorithmic: Material keeps the same tonal palettes and just picks different tones (primary 40 -> 80, container 90 -> 30, surface 98 -> 6) with contrast curves [code]. Leonardo flips polarity via negative ratios against a dark background [code].
- Pitfalls (Material dark theme guidance, via search, medium): saturated colors vibrate/eye strain on dark and can fail 4.5:1 so use desaturated/lighter tones (primary tone ~200 in M2 terms); baseline surface #121212 rather than pure black; elevation shown by lighter surfaces (overlays) because shadows are invisible; pure white text can vibrate so use slightly off-white. Material 3 dark surface is neutral tone 6 and containers step up to tone ~24 [code]. Radix warns that saturated gray backgrounds in dark mode clash with colorful components [doc].
- Alpha-based steps (Radix `a1..a12`) let the same token work over any background [code].

### 1.7 What an agent should receive: semantic palette output

Recommended JSON shape (inspired by Radix 12-step purposes, Primer functional tokens, Material roles):

```
{
  "meta": {"space":"oklch","seed":"#3b82f6","variant":"tonal-spot","contrast":"wcag2","level":0},
  "scales": { "primary": {"50":"oklch(...)", ... "950":...}, "neutral": {...}, "success":..., "warning":..., "danger":..., "info":... },
  "roles": {
    "light": { "surface":{"bg":"neutral.50","fg":"neutral.900","ratio":16.1}, "surface-variant":..., "primary":{"bg":"primary.600","fg":"primary.50","ratio":5.1}, "primary-container":..., "outline":"neutral.300", "outline-variant":"neutral.200", "focus-ring":"primary.500", "danger":..., },
    "dark":  { ...same keys... }
  },
  "pairs": [ {"fg":"role", "bg":"role", "ratio":4.8, "apca":null, "pass":["AA"]} ]
}
```
Mapping to steps (suggested, derived from Radix/Material/Primer): app bg = 1 (Radix) / neutral 98 or 6 (Material); subtle bg = 2; component bg = 3-5; border = 6-8; solid = 9 (primary, success, etc.); hover solid = 10; text secondary = 11; text primary = 12. Semantic hues: danger ~ red (Material error hue 25), success ~ green, warning ~ yellow/amber (needs dark foreground), info ~ blue. Always include precomputed ratio per pair so the agent can verify without recomputation.

## 2. Recommended algorithms (library surface)

| # | Function | Inputs | Output |
|---|---|---|---|
| A1 | `toOklch / fromOklch / gamutMap` | color string/RGB, target gamut (srgb, p3) | OKLCH triple; in-gamut color via chroma reduction at constant L,H (binary search) |
| A2 | `maxChroma(L, H, gamut)` | L, H | max in-gamut C (for chroma curves and key color) |
| A3 | `createScale({seed, steps, lightnessCurve, chromaCurve, hueShift, gamut})` | seed color; steps (11 Tailwind-like, 12 Radix-like, 13 tone-like) ; curve as array/bezier/preset ('tailwind','radix','even') | array of colors; default presets from Tailwind data above |
| A4 | `createContrastScale({seed, background, targets[], formula})` | background, target ratios or Lc, formula | colors via binary search on L (Leonardo-style) incl. polarity; returns achieved ratio |
| A5 | `scaleFromBrand(color, {gray, background, mode})` | brand color | Radix-generator-style scale with exact brand at step 9, hover step 10, text 11-12 |
| A6 | `tonalPalette(hue, chroma, tones[])` + `schemeFromSeed(seed, variant, dark, contrastLevel)` | seed, variant (tonal-spot, vibrant, expressive, neutral, fidelity, content, monochrome) | primary/secondary/tertiary/neutral/neutral-variant/error palettes with Material rotations table above; optional full role map |
| A7 | `contrast(fg, bg, 'wcag2'|'apca'|fn)` | colors | ratio or signed Lc; `meets(level)`; keep APCA behind a pluggable function (license) |
| A8 | `onColor(bg, {min, prefer, tintHue})` | background | text color: white/black or tinted near-black with minimum contrast; apply Radix rule (white unless Lc<40 -> OKLCH 0.25 tinted) |
| A9 | `pairs(bg, {roles})` | background color, target ratios for text/secondary/border | list of fg colors with ratios (Radix 11/12 style) |
| A10 | `harmony(color, type, space='oklch')` | base color; complementary, split, analogous, triadic, tetradic; spread angle | array of colors, same L and C then gamut-mapped; allow `space='hsl'` for parity |
| A11 | `harmonize(color, toward, maxDeg=15, factor=0.5)` | custom color + brand source | hue rotated toward source by min(diff*0.5, 15), L and C preserved (Material rule, in OKLCH rather than HCT) |
| A12 | `darkVariant(scale|palette, strategy)` | scale | 'mirror' (step n <-> N+1-n), 'tone-swap' (Material), or 'lightness-invert' in OKLCH with chroma reduction near extremes; optional vibration guard: cap C and lighten primary |
| A13 | `semanticPalette({brand, mode, contrast})` | brand color | the roles JSON in 1.7 (primary, neutral tinted from brand hue with chroma ~0.01-0.03, success, warning, danger, info with harmonize(), surface/on-surface, outline, with ratios) |
| A14 | `validate(palette)` | palette | report of pairs under thresholds, monotonic lightness, gamut clipping, neighbor deltaE (OK) distance |
| A15 | `inverse(color, mode)` | color; 'rgb' (255-c) or 'lightness' (L->1-L keep H, C reduced) | color |

Suggested neutral recipe: tinted neutral = brand hue, C = 0.005-0.03, using the Tailwind neutral L curve (98.5 ... 14.5).

## 3. Evidence list

| ID | Claim | Conf. | Source | URL | Type | Date |
|---|---|---|---|---|---|---|
| B01 | Tailwind v4 palette defined as `oklch(L% C H)` with 11 steps 50-950; blue L 97 ... 28.2, C peak 0.245 at 600, hue 254.6 -> 267.9 | high | tailwindcss theme.css | https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/theme.css | code | read 2026-10-30 |
| B02 | Yellow hue drifts 102 -> 54 from 50 to 950; amber 95 -> 45.6; chroma bell shape (aggregate table) | high | same, my computation | same | code | 2026-10-30 |
| B03 | Tailwind does not document its derivation; DeltaE2000 reverse-engineering exists | medium | Frana article via search | https://dev.to/matfrana/the-mystery-of-tailwind-colors-v4-hjh | blog/search | 2025? |
| B04 | Evil Martians fitted L list and fixed C list per step to Tailwind | medium | Evil Martians | https://evilmartians.com/chronicles/better-dynamic-themes-in-tailwind-with-oklch-color-magic | blog | ? |
| B05 | Radix 12 steps and their purposes | high | Radix docs | https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale | doc | ? |
| B06 | Radix steps 11/12 guaranteed Lc 60/90 on step 2; step 9 white text except sky, mint, lime, yellow, amber | high | same | same | doc | ? |
| B07 | Radix custom generator algorithm (nearest-scale mixing in OKLCH, bezier easing, step 9 = input, hover rule, APCA text rule) | high | radix-ui/website generate-radix-colors.tsx | https://github.com/radix-ui/website/blob/main/components/generate-radix-colors.tsx | code | main, read 2026-10-30 |
| B08 | Radix ships separate dark scales (`xxxDark`) | high | same (imports) | same | code | |
| B09 | TonalPalette.fromHueAndChroma, key color search, tone 99 yellow special case | high | MCU tonal_palette.ts | https://github.com/material-foundation/material-color-utilities/blob/main/typescript/palettes/tonal_palette.ts | code | |
| B10 | Variant -> palette (hue, chroma) table incl. rotation tables | high | MCU dynamic_scheme.ts | https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/dynamic_scheme.ts | code | |
| B11 | 2025 spec changes chroma (TonalSpot 32/26, Vibrant 74, Expressive 48/36) and adds ContrastCurve/ToneDeltaPair | high | MCU color_spec_2025.ts | https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2025.ts | code | |
| B12 | Role tones (primary 40/80, surface 98/6, container 90/30, outline 50/60) | high | MCU color_spec_2021.ts | https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2021.ts | code | |
| B13 | Tone delta 40 => >=3:1, 50 => >=4.5:1 | medium | Google HCT code comment and Material blog (via search; not read directly) | https://material.io/blog/science-of-color-design | blog/search | 2022-02-17 |
| B14 | Blend.harmonize rotates hue by min(diff*0.5, 15) deg, keeps chroma and tone | high | MCU blend.ts | https://github.com/material-foundation/material-color-utilities/blob/main/typescript/blend/blend.ts | code | |
| B15 | Contrast.ratioOfYs = (lighter+5)/(darker+5) with Y 0-100 | high | MCU contrast.ts | https://github.com/material-foundation/material-color-utilities/blob/main/typescript/contrast/contrast.ts | code | |
| B16 | Leonardo: 3000-sample scale + binary search per target ratio; spaces list; negative ratios; contrast multiplier | high | @adobe/leonardo-contrast-colors 1.1.0 (npm pack) | https://www.npmjs.com/package/@adobe/leonardo-contrast-colors | code | |
| B17 | Leonardo license Apache-2.0 | high | package LICENSE | same | code | |
| B18 | Carbon: 10 grades per hue; grade-distance table for 4.5/3; theme layering | medium | Carbon docs (page extract partial) | https://carbondesignsystem.com/elements/color/overview/ | doc | |
| B19 | Primer: 0-9 scales, grays 0-13 inverted for dark, functional token pairing rules, nine themes | medium | Primer docs / primitives | https://primer.style/product/getting-started/foundations/color-usage/ ; https://github.com/primer/primitives | doc | |
| B20 | Primer Prism archived 2024-12-10, builds on Leonardo/ColorBox/Palx | high | primer/prism | https://github.com/primer/prism | doc | 2024-12-10 |
| B21 | Open Props colors: 19 hues x 13 steps hex | medium | props.colors.css | https://github.com/argyleink/open-props/blob/main/src/props.colors.css | code | |
| B22 | Harmonizer: OKLCH + APCA/WCAG per-level contrast, APCACH | medium | evilmartians/harmonizer README | https://github.com/evilmartians/harmonizer | doc | |
| B23 | Atmos: OKLCH, easing, hue transitions light->dark, WCAG2+APCA | low | vendor pages | https://atmos.style/shade-generator | vendor | |
| B24 | Huetone credits APCA + CSS WG conversions; working space not stated | low | ardov/huetone README | https://github.com/ardov/huetone | doc | |
| B25 | uicolors.app algorithm undocumented | medium (absence) | site | https://uicolors.app/ | doc | |
| B26 | WCAG 3 WD 10 Sep 2026: contrast algorithm "yet to be determined", placeholders, assumes size/weight factor | high | W3C | https://www.w3.org/TR/wcag-3.0/ | spec | 2026-09-10 |
| B27 | APCA marked exploratory early 2023, absent from July 2023 WD; completion ~2030 | medium-high | Roselli | https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html | blog | 2026-04 |
| B28 | APCA constants 0.0.98G-4g; apca-w3 0.1.9; "being evaluated" | high | Myndex/apca-w3 | https://github.com/Myndex/apca-w3 | doc | algorithm 2021-02-15 |
| B29 | APCA license: W3 compliant-code-only, patent pending, naming restriction, AGPLv3 otherwise; GitHub NOASSERTION | high | LICENSE.md | https://github.com/Myndex/apca-w3/blob/master/LICENSE.md | doc | 2019-2023 |
| B30 | APCA Lc guide 15/30/45/60/75/90 | high | APCA in a Nutshell | https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell | doc | |
| B31 | Bridge-PCA maps Lc 60/75/90 to 3/4.5/7; polarity-sensitive; beta | medium | npm / search | https://www.npmjs.com/package/bridge-pca | doc | |
| B32 | contrast-color(): white/black only, algorithm UA-defined, advises against WCAG 2 ratio alone, must meet AA-large | high | CSS Color 5 | https://www.w3.org/TR/css-color-5/ | spec | |
| B33 | contrast-color Baseline 2026 (since Apr 2026), mid-tone limitations | medium | MDN | https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/contrast-color | doc | 2026 |
| B34 | Oklab hue linearity vs CIELAB/CIELUV/HSV purple shift; lightness RMS 0.20 vs 1.70; data CAM16-generated | high | Ottosson | https://bottosson.github.io/posts/oklab/ | blog (author) | 2020 |
| B35 | HSL lightness inconsistent across hues; OKLCH hold c/h change l; LCH blue hue shift 270-330 | high | Evil Martians OKLCH article | https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl | blog | |
| B36 | Harmonies are hue rotations; OKLCH fixed L,C rotation keeps perceived lightness; gamut caveat | medium | search roundup | https://www.stefanjudis.com/blog/oklch-perceived-lightness | blog | |
| B37 | Abney/Bezold-Brucke definitions; direction disagrees between sources; no measured design magnitudes | low | Wikipedia + search | https://en.wikipedia.org/wiki/Abney_effect | search | |
| B38 | Dark mode: saturated colors vibrate/fail 4.5:1, #121212 surface, elevation by lighter surfaces | medium | Material 2 dark theme guidance via search | https://m2.material.io/design/color/dark-theme | doc/search | |
| B39 | Radix warns saturated gray backgrounds in dark mode clash | high | Radix composing a palette | https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette | doc | |
| B40 | colorjs.io supplies deltaEOK, contrastAPCA used by Radix generator | high | generate-radix-colors.tsx | see B07 | code | |

## 4. Contradictions and open questions

1. APCA/WCAG 3 timeline: Roselli says removed from July 2023 draft; one May 2026 blog says pulled "as of April 2026"; W3C draft (Sept 2026) only says "to be determined" and does not mention APCA in the portion I read (first 100k of 373k characters). Treat the primary W3C text as authoritative; I did not read the whole document.
2. APCA license vs ecosystem use: license says compliant code only and web use only, yet MIT libs (colorjs.io, Radix, Harmonizer) ship APCA. Legal status for an MIT npm library is unresolved. Needs counsel or conservative design (WCAG 2 default, pluggable APCA).
3. Bezold-Brucke direction conflicts across sources; no measured magnitudes for dark yellow. Tailwind's hue-drift data (empirical, hand-tuned) is the only concrete number set found.
4. Huetone working space, uicolors.app and Atmos algorithms, Open Props derivation, Carbon and Primer color space: not verified from primary sources.
5. Material m3.material.io pages are JS-rendered, so docs could not be read; Material claims come from source code and a search snippet of the blog (B13). Material tone->role table for 2025 spec not enumerated (only 2021 roles listed).
6. HSL vs OKLCH harmony: only practitioner explanations; no controlled study found. DeltaPhi contrast not researched.
7. Spec 2026 in MCU repo: exists but not analysed; may change tone/chroma values.
8. Tailwind: the repo's theme.css now includes extra grays (mauve, olive, mist, taupe) beyond v4.0; aggregates above exclude all grays.
