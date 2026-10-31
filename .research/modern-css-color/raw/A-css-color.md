# A: Modern CSS color: what a library must parse, represent, convert

Research date: 2026-10-30. All spec quotes were fetched from w3.org/TR and drafts.csswg.org on that date (local copies of the stripped text are in `raw/dl/`). Source types: SPEC, MDN, WEBSTATUS (web-platform-dx API), ISSUE, BLOG (maintainer).

## 0. Spec status snapshot (verified 2026-10-30)
| Module | Status | Date | Note |
|---|---|---|---|
| CSS Color 4 | Candidate Recommendation Draft (CRD) | 29 Oct 2026 | Latest CR *Snapshot* linked from the doc is 5 Jul 2022 (CR-css-color-4-20220705). CRD is a draft that tracks the ED closely. Not a Recommendation. |
| CSS Color 5 | Working Draft | 29 Oct 2026 (prior WD 13 Jan 2026) | Contains color-mix, relative color, light-dark, contrast-color, @color-profile, device-cmyk |
| CSS Color 6 | Editor's Draft, "Not Ready For Implementation" | 8 Oct 2026 | Contains an *extended* contrast-color() and color-layers(). NOT published to /TR (w3.org/TR/css-color-6 returns 404). |
| CSS Color HDR 1 | Working Draft | 26 Oct 2026 (prior WD 3 Mar 2026) | dynamic-range-limit, ictcp(), jzazbz(), jzczhz(), color-hdr(), rec2100-* spaces |

Surprise: the status of Color 5 in the task brief ("Level 5 has contrast-color with algorithm choice") is out of date. contrast-color() with algorithm options moved to Level 6.

## 1. CSS Color 4 findings

### 1.1 Table of functions and spaces (all Color 4 unless noted; Baseline from WEBSTATUS API)
| Form | Syntax (modern) | Components / ranges (% reference) | White point | Gamut | Level | Baseline |
|---|---|---|---|---|---|---|
| named colors | 148 keywords, ASCII case-insensitive | n/a | D65 (sRGB) | sRGB | 4 (from 3) | widely (2018) |
| hex | #rgb #rgba #rrggbb #rrggbbaa | 8-bit | D65 | sRGB | 4 (4/8 digit new) | widely |
| rgb()/rgba() | `rgb(R G B / A)`; legacy `rgb(R, G, B, A)` | R,G,B: number 0-255 or %, 0%=0 100%=255; alpha number or % | D65 | sRGB, may exceed 0-1 range before clamp | 4 | widely (2022-07) |
| hsl()/hsla() | `hsl(H S L / A)`; legacy commas (percent only S,L) | H deg-ish, S,L 0-100 (% or number in modern); S<0 clamped to 0 | D65 | sRGB | 4 | widely |
| hwb() | `hwb(H W B / A)` no legacy | W,B 0-100; if W+B>=100 achromatic gray = W/(W+B) | D65 | sRGB | 4 | widely (2024-10 "widely") |
| lab() | `lab(L a b / A)` | L 0-100 (% 0..100); a,b number, 100% = 125 | D50 | unbounded | 4 | widely (2025-11) |
| lch() | `lch(L C H / A)` | L 0-100; C 100% = 150; H deg | D50 | unbounded | 4 | widely |
| oklab() | `oklab(L a b / A)` | L 0-1 (100%=1); a,b 100% = 0.4 | D65 | unbounded | 4 | widely (2025-11) |
| oklch() | `oklch(L C H / A)` | L 0-1; C 100% = 0.4; H deg | D65 | unbounded | 4 | widely (MDN: since May 2023) |
| color(srgb) | `color(srgb r g b / A)` | number 0-1, 100%=1 | D65 | sRGB (extended range allowed) | 4 | widely (2023-05; webstatus "color()") |
| color(srgb-linear) | same | 0-1 | D65 | sRGB | 4 | widely |
| color(display-p3) | same | 0-1 | D65 | P3 | 4 | widely |
| color(a98-rgb) | same | 0-1 | D65 | Adobe RGB | 4 | widely |
| color(prophoto-rgb) | same | 0-1 | D50 | ProPhoto (imaginary primaries) | 4 | widely |
| color(rec2020) | same | 0-1 | D65 | Rec.2020 | 4 | widely |
| color(xyz-d50) / color(xyz-d65) / color(xyz) | X Y Z | 0-1 (100%=1), `xyz` is alias of `xyz-d65` | D50 / D65 | unbounded | 4 | widely |
| color(display-p3-linear) | listed in Color 5 `<rectangular-color-space>` and MDN; verify in Color 4 | 0-1 | D65 | P3 | 5 (interpolation); MDN lists for color() | see open questions |
| color(rec2100-pq/hlg/linear) | | | | HDR | HDR-1 (MDN lists them) | not Baseline; draft |
| transparent | keyword = rgba(0,0,0,0) | | | | 4 | widely |
| currentcolor | keyword (case-insens.), resolves at used-value time; interpolable using used value | | | | 4 | widely |
| system colors | Canvas, CanvasText, LinkText, Field, ... AccentColor, AccentColorText, etc. | environment-dependent | | | 4 | widely (2018 webstatus "System colors"; newer ones like AccentColor may be later: unverified) |
| deprecated system colors | ActiveBorder etc. | | | | 4 (kept for compat) | |
| color-mix() | see section 2 | | | | 5 | widely 2023-05 (MDN, webstatus) |
| relative color (`from`) | see section 2 | | | | 5 | newly, 2024-09-16 |
| light-dark() | see section 2 | | | | 5 | newly, 2024-05-13 |
| contrast-color() | | | | | 5 | newly, 2026-04-10 |
| device-cmyk() | | | | | 5 | no known browser support (unverified) |
| @color-profile | | | | | 5 | no browser support known (unverified) |

Hue units: `<hue>` = number (deg implied) or `<angle>` (deg, grad, rad, turn). Hue 0deg = sRGB red in hsl/hwb. (SPEC, hsl section: "angle 0deg represents sRGB primary red".)

Legacy vs modern syntax: only rgb()/rgba()/hsl()/hsla() have legacy comma syntax. Legacy forms cannot use `none`, cannot mix numbers/percents (legacy rgb: all percentages or all numbers), and use comma before alpha. hwb/lab/lch/oklab/oklch/color() have no legacy syntax. In modern syntax rgba()=rgb() and hsla()=hsl() are aliases. (SPEC §4.4/§5.)

### 1.2 Missing components (`none`)
- Any component of non-legacy syntax can be `none`. A missing component behaves as 0 (0, 0%, 0deg) for everything except interpolation. (SPEC §4.4)
- Serialization of a missing component: legacy syntax shows 0; other syntax shows `none`. (SPEC §4.4)
- Interpolation (§13.3): before converting to the interpolation space, find "analogous components" (e.g., hsl H is analogous to lch/oklch H; hsl S ~ C; L ~ L; R/G/B ~ X/Y/Z-ish sets per spec table). If a missing component has an analogue in the interpolation space it is *carried forward* as missing, then filled in from the other color's value ("fill in missing components with the other color's component values"). If both are missing, result is missing. Alpha is its own analogue. Steps: powerless->missing, convert, re-insert carried-forward missing, fill, hue fix-up, **premultiply**, linear interpolate, unpremultiply. (SPEC §13)
- Worked example in spec: `color-mix(in hsl, white 30%, green 70%)`: white has missing hue in hsl so takes green's hue.
- Gray-out trick: interpolate with `oklch(none 0 none)`.
- Calculations on a `none` value treat it as 0 (Color 5, relative color).

### 1.3 Percentage vs number ranges
See table. Key gotcha from Color 5: in relative `rgb(from rgb(0 0 0 / 60%) alpha 153 153 / 0.9)`, channel keywords resolve to numbers in the function's *native number range* (r,g,b 0-255; alpha 0-1), not percents.

## 2. CSS Color 5
- **color-mix()**: `color-mix([in <color-space> <hue-method>?,]? <color> <pct>?, <color> <pct>?, ...)`. As of the current WD the `in` clause is optional and **defaults to oklab** (Color 5 changelog: "Default to oklab for color-mix(), allow color-interpolation-method to be omitted (Issue 10484)"). Older text/impls required `in`. Supports 2+ items (list). Allowed spaces: srgb, srgb-linear, display-p3, display-p3-linear, a98-rgb, prophoto-rgb, rec2020, lab, oklab, xyz/xyz-d50/xyz-d65 (rectangular); hsl, hwb, lch, oklch (polar); custom `<dashed-ident>` via @color-profile. Hue methods: `shorter` (default) | `longer` | `increasing` | `decreasing`, followed by `hue`. Polar mixing with >2 items is order-dependent (pairwise).
- **Percentage normalization (§3.2, §3.3)**: each percent 0-100, negatives invalid. Omitted percents are filled (if both omitted, 50/50). Sum is then normalized to 100 ("forced normalization"); if sum < 100, remainder is "leftover", and `alpha mult = 1 - leftover` multiplies the result's alpha (e.g. `purple 30%, plum 30%` -> alpha 0.6). If sum > 100, scaled down. Spec example: `purple 80%, plum 80%` equals 50/50. Progress for each pairwise step = b% / (a%+b%) (0.5 if sum is 0). Interpolation uses premultiplied alpha; "do not multiply the interpolated alpha by the alpha multiplier" (a separate note) (SPEC §3.3 notes).
- **Relative color syntax**: `<fn>(from <color> c1 c2 c3 [/ a])` for rgb, hsl, hwb, lab, lch, oklab, oklch, color(). Origin is converted to the target function's space; channel keywords (r g b / h s l / h w b / l a b / l c h / x y z / alpha) become `<number>`s usable in calc(). Missing origin components: keywords resolve to `none` but math on them treats as 0 (SPEC §4.2 text near line 1522 of local copy). hsl channels s,l are numbers 0-100 (not %); hue is in degrees. Browsers disagreed early: Safari 16.4 required `deg` units (MDN). Serialization: a relative color serializes as a resolved color in its own function's space (SPEC §11.3, §11.2; not read in detail).
- **light-dark(<color>, <color>)**: picks by used `color-scheme` (needs `color-scheme: light dark` to switch). Level 5 also defines `<light-dark-color>`; the image form (`light-dark(<image>,<image>)`) is mentioned by MDN with uneven support. A library cannot resolve it without a scheme input: model as a deferred/conditional value.
- **contrast-color(<color>) (Color 5 WD)**: resolves to **white or black only**, whichever gives maximum contrast when the input is the solid background; tie resolves to white. Algorithm is **UA-defined**. Spec advises *not* simply using the WCAG 2.1 1.4.3 ratio ("known issues") but results should still meet WCAG 2.1 AA large text. "Future versions expected to introduce more control." (SPEC, Color 5 §8, ED/WD 29 Oct 2026.) MDN says it commonly aims for AA 4.5:1, notes mid-tone failure (#2277d3 -> black).
- **@color-profile + custom `<dashed-ident>` color spaces + device-cmyk()**: `@color-profile --name { src: url(...icc); components: ...}`; use as `color(--name c1 c2 ...)`. ICC-based, requires profile loading and a CMM: out of scope for a zero-dep library except as an opaque/unsupported type. `device-cmyk(c m y k)` is explicitly "uncalibrated... no colorimetric basis" with a spec-given fallback conversion. No relative device-cmyk() syntax (SPEC). Relative alpha: `alpha(from <color> / x)` also in Color 5.

## 3. Color 6 and HDR drafts (ALL DRAFTS, do not implement against them as stable)
- **Color 6 ED (8 Oct 2026), "Not Ready For Implementation"**: `contrast-color([<color> && [tbd-fg | tbd-bg] && <target-contrast>?] , <color>#)` with `<target-contrast> = wcag2 | wcag2(<number> | [aa|aaa] && large?)`. Keyword names `tbd-fg`/`tbd-bg` are literally placeholders. aa=4.5, aa large=3, aaa=7, aaa large=4.5. Default candidates white, black; contrast via WCAG 2 luminance ratio (Yl+0.05)/(Yd+0.05). Also `color-layers([<blend-mode>,]? <color>#)` which composites with source-over. Examples in the spec still have "@@" TODOs.
- **Color HDR 1 WD (26 Oct 2026)**: `dynamic-range-limit: standard | constrained | no-limit` and `dynamic-range-limit-mix()`; `color(rec2100-pq|rec2100-hlg|rec2100-linear ...)`; `ictcp()`, `jzazbz()`, `jzczhz()`; `color-hdr(<color> <number>?, <color> <number>?)` (headroom multiplier). `alpha()` function listed in its `<color-function>` extension. Browser support: not assessed beyond webstatus not listing Baseline; treat as none. (Marked: draft.)

## 4. Browser support (Baseline via webstatus API, cross-checked with MDN)
| Feature | Baseline | low date | first versions |
|---|---|---|---|
| color() | widely | 2023-05-09 (widely 2025-11-09) | Safari 15, Chrome/Edge 111, Firefox 113 |
| oklab/oklch | widely | 2023-05-09 | (MDN page agrees: since May 2023) |
| lab/lch | widely | 2023-05-09 | |
| hwb | widely | 2022-04-28 | |
| color-mix() | widely | 2023-05-09 | Chrome 111, Safari 16.2, Firefox 113 |
| relative color | newly | 2024-09-16 | Chrome 125, Firefox 128, Safari 18 |
| light-dark() (color) | newly | 2024-05-13 | Firefox 120, Chrome 123, Safari 17.5 |
| contrast-color() | newly | 2026-04-10 | Safari 26 (2025-09), Firefox 146 (2025-12), Chrome/Edge 147 (2026-04) |
| gamut mapping (webstatus id `gamut-mapping`) | not Baseline | | see section 6 |
Widely-available dates assume Baseline's 30-month rule; "newly" features reach "widely" 30 months after low date.

## 5. Conversion math
Pipeline (SPEC §11.2 "Algorithm for Converting Colors", CRD): prepare (powerless->missing, polar->rectangular); missing->0; undo transfer function to linear light; matrix to XYZ at source white; if white points differ adapt with **linear Bradford**; matrix XYZ->dest; apply dest transfer function; css-gamut-map if dest is a physical RGB output; if dest is polar convert rectangular->polar (may yield missing hue).
- White points: D50 = [0.3457/0.3585, 1, (1-0.3457-0.3585)/0.3585]; D65 = [0.3127/0.3290, 1, ...] (4-digit chromaticities) (SPEC §19 sample code).
- Exact equivalences given by spec: `#7654CD` = `lab(44.36% 36.05 -58.99)` = `color(xyz-d50 0.2005 0.14089 0.4472)` = `color(xyz-d65 0.21661 0.14602 0.59452)`; white: xyz-d50 `0.9643 1 0.8251`, xyz-d65 `0.9505 1 1.089`. Note white D65 `lab(100.1154% ...)`-type results exceed 100 L, must not be clamped.
- Transfer functions: sRGB piecewise (threshold 0.04045), extended for negatives by sign reflection (the spec's sample `lin_sRGB` keeps sign) so out-of-gamut values round-trip. Others in §19: a98 gamma 563/256, prophoto 1.8 with linear toe, rec2020 piecewise (spec's own constants).
- **Sample code**: CSS Color 4 **§19 "Sample code for Color Conversions"** (non-normative; includes `D50_to_D65`, `XYZ_to_OKLab`, powerless-handling JS). Fragment `#color-conversion-code`.
- **Oklab**: Ottosson's post (BLOG, 23 Dec 2020; matrices updated 2021-01-25 for higher-precision sRGB matrix and exact D65) gives M1/M2 (XYZ D65 -> LMS -> cbrt -> Lab). The spec's sample code does NOT use Ottosson's printed matrices: it uses "XYZ<->LMS matrices recalculated for consistent reference white (csswg-drafts#6642) and recalculated for 64-bit precision (color.js PR #357)": XYZtoLMS rows `[0.8190224379967030, 0.3619062600528904, -0.1288737815209879]`, `[0.0329836539323885, 0.9292868615863434, 0.0361446663506424]`, `[0.0481771893596242, 0.2642395317527308, 0.6335478284694309]` and LMStoOKLab row0 `[0.2104542683093140, 0.7936177747023054, -0.0040720430116193]`. Ottosson's printed M1 row0 is `0.8189330101 0.3618667424 -0.1288597137`. A library should use the CSS-spec matrices (and ideally compute the sRGB->Oklab matrix from them) to get identical results to browsers; the difference is ~1e-4 in L/a/b but visible when achromatic: Ottosson's white maps to a,b ~1e-5 off zero.
- Precision: use float64; clamp nothing in intermediate steps; allow negatives and >1 values.

## 6. Gamut mapping
- **Current Color 4 text (CRD 29 Oct 2026) defines THREE algorithms, implementation picks any**: (1) Binary Search with local MINDE, (2) EdgeSeeker (Alexey Ardov, color.js; LUT of max-chroma per hue), (3) Ray Trace. All do constant-L, constant-hue chroma reduction in OkLCh, relative colorimetric. L>=1 -> white; L<=0 -> black. (SPEC §14.2.) This differs from older descriptions that give just the binary search.
- Binary-search algorithm (SPEC §14.2.2 pseudocode): non-RGB-bounded dest (xyz, lab, lch, oklab, oklch) -> just convert; JND = **0.02** (deltaEOK), **epsilon = 0.0001**; clip(color) = convert and clamp each component; if deltaEOK(clipped, current) < JND return clipped; binary search chroma min=0..max=origin chroma until max-min <= epsilon; at each step if in gamut raise min, else if clip is within JND return clipped, else lower max. For HSL/HWB inGamut means in sRGB.
- **Why plain clipping is wrong** (SPEC §14.1 and ISSUE interop#1394): clipping each channel changes hue and lightness unpredictably. Spec shows `color(display-p3 1 1 0)` -> sRGB `color(srgb 1 1 -0.3463)`; chroma reduction gives `oklch(0.96476 0.21094 110.23)`. Lea Verou's example: `oklch(0.97 0.2235 258.41)` is outside every display gamut and clipping turns near-white into blue; also a contrast/accessibility hazard (ISSUE).
- Spec also notes why CIE LCH is a poor mapping space (hue curvature 270-330 deg, blue->purple) and why simple Oklch chroma reduction can over-reduce light yellow/cyan (hence local clip).
- **Critique**: csswg-drafts#7071 "Gamut Mapping with Oklch - Odd Results" (Isaac Muse / facelessuser, 2022-02-18, closed): Oklch chroma reduction gave worse results than Lch for some green->blue interpolations; Chris Lilley (svgeesus) acknowledged interpolation in polar spaces produces out-of-gamut intermediates and non-real colors; Romain Menke noted luminosity shifts in the teal region. Related open issues (listed by commenter in interop#1394): csswg-drafts #9449, #10579, #14069 (titles not fetched).
- **Raytrace**: now normative alternative in the spec (§14.2.4-ish "Ray Trace Gamut Mapping"), implemented in colorjs.io and by Isaac Muse (coloraide). Details of the algorithm text not extracted here (open item).
- **What browsers do today**: per web-platform-tests/interop#1394 (Lea Verou, opened 2026-09-14, open): "Without gamut mapping (i.e. currently in most UAs), this is displayed via converting to RGB, and clipping RGB coordinates"; "so far only Firefox has shipped an implementation" (the same body also says Firefox "has implemented GM behind a flag" - internal inconsistency, flagged below); "Chrome and WebKit are reportedly looking into it"; previously rejected from Interop 2025 (romainmenke #443) for lack of test infrastructure. WPT canvas tests exist (`canvas-srgb-gamut-mapping.html`, `canvas-display-p3-gamut-mapping.html`). Implication: round-tripping a library's gamut-mapped output through a browser may differ; offering both `clip` and `css-gamut-map` is justified.

## 7. Serialization (SPEC §16, CRD)
- Alpha: omitted if 1 after clamp [0,1]. Legacy alpha: 8-bit int -> find integer pct 0..100 with round(pct*2.55)=alpha -> `pct/100` (e.g. 237 -> 0.93), else `round(alpha/0.255)/1000` (236 -> 0.92549); at least 2 decimals, round toward +infinity. Modern alpha: number, leading zero, trailing zeros removed, 6 decimals, round up.
- sRGB family (hex, rgb(), rgba(), hsl(), hwb(), named, system, transparent) -> serializes as legacy **`rgb(r, g, b)` / `rgba(r, g, b, a)`** with components as numbers 0-255 (fractions allowed, trailing zeros dropped, e.g. `rgb(218, 165, 32)`; `hwb(740deg 20% 30% / 50%)` -> `rgba(178.5, 93.5, 51, 0.5)`), comma+one space. Declared value of keyword colors keeps the keyword (transparent declared -> `transparent`, computed -> `rgba(0, 0, 0, 0)`).
- **Missing components in sRGB forms**: `rgb(none 0 0)` -> `color(srgb none 0 0)` (components 0-1); `hsl()/hwb()` with none serialize as modern `hsl(H S% L% / A)` / `hwb(...)` with `none`.
- HTML-compatible serialization (canvas fillStyle): opaque 8-bit sRGB -> lowercase `#rrggbb`; otherwise CSS serialization (e.g. `#ff00ffed` -> `rgba(255, 0, 255, 0.93)`; `lab(29% 39 20)` -> `lab(29 39 20)`).
- lab/lch: space-separated, L,a,b,C as numbers (percent converted using reference ranges), trailing zeros removed, e.g. `lab(56.2% 0.000 66.88%)` -> `lab(56.2 0 83.6)`; precision must round-trip L 0-100 and a,b +-127 at >=16 bit (about 3 decimals). Same for oklab/oklch (`oklab(54.0% -0.10 -0.02)` -> `oklab(0.54 -0.1 -0.02)`; `oklch(56.43% 0.0900 123.40)` -> `oklch(0.5643 0.09 123.4)`), alpha as ` / 0.93`, percent never emitted.
- color(): serialized as `color(<space> r g b [/ a])`, numbers, not percents (read from §16.5; exact precision text not extracted).
- Decimal point is always "."; `none` always lowercase; no thousands separator.
- For a library: keep two representations: "declared/authored" form (for lossless roundtrip) and numeric components. Precision: store float64, serialize with chosen significant digits (browsers use ~6 significant for color(); not verified per browser).

## 8. Powerless components and achromatic hue
- Definition (SPEC §4.4.1): a component whose value doesn't affect the rendered color. Manually specified powerless components act as normal; **only components produced by conversion** are set to missing (`none`) when powerless, plus chroma/saturation is zeroed when small positive and <= epsilon (negatives not clamped).
- Powerless hue epsilons from spec tables: hsl: S <= 0.001 (S in 0-100 scale); lch: C <= 0.0015; oklch: C <= 0.000004 (value not re-extracted: verify against §9.4 table); hwb: W+B >= 100 (with epsilon rule, sets hue powerless, W and B adjusted via the listed steps). hsl: S = 0 -> H powerless.
- In `lch`/`oklch` conversion sample code, hue becomes NaN (JS sample) when chroma small; a library should use `null`/NaN for "missing".
- Comparison (§12): colors in different spaces are equal iff neither has missing components and they match in Oklab within **epsilon 0.00001**; missing equals only missing.
- Practical consequence for tests: `oklch` of `#808080` must have hue missing, and mixing `white` into green in HSL/OKLCH must adopt green's hue.

## Evidence list
| ID | Claim | Conf. | Source label | URL | Type | Date |
|---|---|---|---|---|---|---|
| A01 | Color 4 is a CR Draft dated 29 Oct 2026; last linked CR Snapshot 2022-07-05 | high | CSS Color 4 | https://www.w3.org/TR/css-color-4/ | SPEC | 2026-10-29 |
| A02 | Color 5 is a WD, 29 Oct 2026; prior WD 13 Jan 2026 | high | CSS Color 5 | https://www.w3.org/TR/css-color-5/ | SPEC | 2026-10-29 |
| A03 | Color 6 is ED 8 Oct 2026, "Not Ready For Implementation"; no /TR publication (404) | high | CSS Color 6 | https://drafts.csswg.org/css-color-6/ | SPEC | 2026-10-08 |
| A04 | Color HDR 1 is a WD 26 Oct 2026 (prev 3 Mar 2026) | high | CSS Color HDR 1 | https://www.w3.org/TR/css-color-hdr-1/ | SPEC | 2026-10-26 |
| A05 | contrast-color() in Color 5: returns white or black only, UA-defined algorithm, tie->white, advised not to use WCAG2 ratio simply, must still meet AA large | high | Color 5 section 8 | https://www.w3.org/TR/css-color-5/#contrast-color | SPEC | 2026-10-29 |
| A06 | Color 6 contrast-color(): candidates list, tbd-fg/tbd-bg, wcag2()/aa/aaa mappings 4.5/3/7/4.5, color-layers() | high | Color 6 | https://drafts.csswg.org/css-color-6/#contrast-color | SPEC | 2026-10-08 |
| A07 | HDR draft adds dynamic-range-limit, ictcp, jzazbz, jzczhz, color-hdr(), rec2100-* | high | HDR 1 | https://www.w3.org/TR/css-color-hdr-1/ | SPEC | 2026-10-26 |
| A08 | color-mix percentage normalization: sum to 100, leftover becomes alpha multiplier (purple 30% plum 30% -> alpha 0.6); default hue method shorter; default space oklab | high | Color 5 section 3 + changelog | https://www.w3.org/TR/css-color-5/#color-mix | SPEC | 2026-10-29 |
| A09 | Hue methods shorter/longer/increasing/decreasing | high | Color 5 section 9 / Color 4 13.5 | https://www.w3.org/TR/css-color-5/#interpolation | SPEC | 2026-10-29 |
| A10 | Interpolation: powerless->missing, carry forward analogous missing comps, fill from other color, premultiply | high | Color 4 section 13 | https://www.w3.org/TR/css-color-4/#interpolation | SPEC | 2026-10-29 |
| A11 | `none`: missing comps behave as 0 except interpolation; serialized as none except legacy | high | Color 4 section 4.4 | https://www.w3.org/TR/css-color-4/#missing | SPEC | 2026-10-29 |
| A12 | Powerless components set to missing only when from conversion; epsilons hsl S<=0.001, lch C<=0.0015 | high | Color 4 4.4.1, tables | https://www.w3.org/TR/css-color-4/#powerless | SPEC | 2026-10-29 |
| A13 | oklch epsilon value | low | (not re-extracted) | https://www.w3.org/TR/css-color-4/#ok-lab | SPEC | n/a |
| A14 | Conversion algorithm (linearize, XYZ, linear Bradford, dest, gamut map, polar) | high | Color 4 section 11.2 | https://www.w3.org/TR/css-color-4/#color-conversion | SPEC | 2026-10-29 |
| A15 | Sample code is section 19 "Sample code for Color Conversions" (non-normative) | high | Color 4 section 19 | https://www.w3.org/TR/css-color-4/#color-conversion-code | SPEC | 2026-10-29 |
| A16 | Spec Oklab matrices recalculated for consistent white and 64-bit precision (csswg-drafts#6642, color.js PR 357) | high | Color 4 sample code comments | https://www.w3.org/TR/css-color-4/#color-conversion-code | SPEC | 2026-10-29 |
| A17 | Ottosson matrices M1/M2; updated 2021-01-25 for higher-precision sRGB matrix and exact D65; published 2020-12-23 | high | Oklab post | https://bottosson.github.io/posts/oklab/ | BLOG | 2020-12-23 |
| A18 | Gamut mapping: three algorithms (binary search w/ local MINDE, EdgeSeeker, Ray Trace); JND 0.02, epsilon 0.0001; L>=1 white, L<=0 black | high | Color 4 section 14 | https://www.w3.org/TR/css-color-4/#css-gamut-mapping | SPEC | 2026-10-29 |
| A19 | CIE LCH hue curvature problems 270-330 deg; OkLCh avoids; simple chroma reduction can over-reduce light yellow/cyan | high | Color 4 section 14.1 | https://www.w3.org/TR/css-color-4/#gamut-mapping | SPEC | 2026-10-29 |
| A20 | Browsers: most UAs clip; only Firefox shipped GM; Chrome/WebKit looking into it (but text also says Firefox "behind a flag") | medium | interop#1394 | https://github.com/web-platform-tests/interop/issues/1394 | ISSUE (Lea Verou) | 2026-09-14 |
| A21 | Oklch gamut-mapping critique: odd results vs Lch in some interpolations; Lilley acknowledged polar-space intermediates out of gamut | high | csswg-drafts#7071 | https://github.com/w3c/csswg-drafts/issues/7071 | ISSUE | 2022-02-18 |
| A22 | Serialization: sRGB family -> rgb()/rgba() legacy commas, 0-255 numbers; none cases -> color(srgb ...) or modern hsl/hwb | high | Color 4 section 16.2 | https://www.w3.org/TR/css-color-4/#serializing-sRGB-values | SPEC | 2026-10-29 |
| A23 | Alpha serialization: legacy 0.93/0.92549 rule; modern 6 decimals, round up | high | Color 4 section 16.1 | https://www.w3.org/TR/css-color-4/#serializing-alpha-values | SPEC | 2026-10-29 |
| A24 | lab/lch/oklab/oklch serialize as numbers, trailing zeros removed; precision >= 16-bit | high | Color 4 16.3-16.4 | https://www.w3.org/TR/css-color-4/#serializing-lab-lch | SPEC | 2026-10-29 |
| A25 | Color equality: Oklab epsilon 0.00001 for different spaces; missing equals only missing | high | Color 4 section 12 | https://www.w3.org/TR/css-color-4/#color-comparison | SPEC | 2026-10-29 |
| A26 | Baseline: color() widely (low 2023-05-09; Chrome 111, Safari 15, FF 113) | high | webstatus color-function | https://api.webstatus.dev/v1/features/color-function | WEBSTATUS | 2026-10-30 |
| A27 | Baseline: color-mix widely (2023-05-09) | high | webstatus color-mix | https://api.webstatus.dev/v1/features/color-mix | WEBSTATUS | 2026-10-30 |
| A28 | Baseline: relative color newly 2024-09-16 (Chrome 125, FF 128, Safari 18) | high | webstatus relative-color | https://api.webstatus.dev/v1/features/relative-color | WEBSTATUS | 2026-10-30 |
| A29 | Baseline: light-dark newly 2024-05-13 | high | webstatus light-dark; MDN | https://api.webstatus.dev/v1/features/light-dark | WEBSTATUS/MDN | 2026-10-30 |
| A30 | Baseline: contrast-color newly 2026-04-10 (Safari 26, FF 146, Chrome 147); MDN notes mid-tone caveat | high | webstatus; MDN | https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/contrast-color | WEBSTATUS/MDN | 2026-10-30 |
| A31 | Baseline: oklab/oklch widely (2023-05-09), lab/lch widely, hwb widely (2022-04-28) | high | webstatus oklab, lab, hwb | https://api.webstatus.dev/v1/features/oklab | WEBSTATUS | 2026-10-30 |
| A32 | color-mix on MDN: defaults to oklab if no space; percents inferred; sum<100 adds alpha | high | MDN | https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix | MDN | 2026-10-30 |
| A33 | Safari 16.4 early relative-color needed `deg` in calc; use @supports | medium | MDN relative colors | https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors | MDN | 2026-10-30 |
| A34 | color() predefined list per MDN includes display-p3-linear, rec2100-pq/hlg/linear | medium | MDN color() | https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color | MDN | 2026-10-30 |
| A35 | device-cmyk(): uncalibrated, no relative syntax; @color-profile defines custom spaces via ICC | high | Color 5 | https://www.w3.org/TR/css-color-5/#cmyk-colors | SPEC | 2026-10-29 |
| A36 | Relative color: channel keywords resolve to numbers in the function's native range (rgb 0-255), none treated as 0 in math | high | Color 5 section 4 | https://www.w3.org/TR/css-color-5/#relative-colors | SPEC | 2026-10-29 |

## Contradictions and open questions
1. Interop#1394 says both "only Firefox has shipped an implementation" and "Firefox has implemented GM behind a flag". Unresolved; check wpt.fyi results for `canvas-srgb-gamut-mapping.html` and Firefox release notes before claiming browser behavior (A20).
2. The task framed contrast-color() as possibly having algorithm choice in Level 5. Verified: Level 5 = white/black, UA-defined algorithm; the algorithm-selection syntax (`wcag2()`, `tbd-fg`) is only in Level 6 ED, with placeholder keywords. Do not implement the Level 6 syntax; implement a WCAG-ratio black/white picker as an explicitly non-normative helper.
3. Spec vs Ottosson matrices differ in the ~4th decimal; the CSS spec explicitly deviates from the blog (A16, A17). Choose spec matrices to match browsers.
4. Level 4 is only a CR *Draft*; behavior (e.g. gamut-mapping algorithm choice, serialization details such as color(srgb ...) for rgb(none...)) changed recently (the serialization of none in rgb() is described with Color 5 cross-reference). Pin tests to the 2026-10-29 text and re-check before release.
5. Not verified: oklch powerless epsilon value, exact system color list/AccentColor Baseline, `display-p3-linear` in Color 4 vs 5, Ray Trace algorithm details, color() precision as implemented by each browser, whether any browser supports @color-profile/device-cmyk(), and the three open gamut-mapping issues (#9449, #10579, #14069).
6. Hue handling in the spec sample code gives NaN vs the prose "missing"; a TS library should pick `null` or `NaN` consistently.
