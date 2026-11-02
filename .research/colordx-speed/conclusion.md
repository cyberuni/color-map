# Conclusion: Why @colordx/core is faster than color-map

## Last updated

November 2026

## Status

M1, M2 and M3 were adopted in #293. Measured after the change: parse 1.31M to 3.11M ops/s, toGamut 274k to 1.25M, mix 1.11M to 3.28M. Colordx is now level on gamut, color-map is 1.2x ahead on mix, and colordx is still 1.6x ahead on parse. The findings below are the record from before that change and are kept as written.

## Question

Why is @colordx/core 7.3.0 about 3.7x faster at parse, 4.7x at gamut mapping and 2.5x at mix than color-map, while color-map is about 2x faster at toCss?

## Verdict

The benchmark is a fair like-for-like. Same seeded inputs for both libraries, a fresh construction inside every timed call (no pre-made instances), 300 ms warmup, 5 samples, one child process per library (packages/color-map/scripts/bench.mjs). I reproduced the three gaps (parse 1.34M vs 4.98M, toGamut 274k vs 1.38M, mix 1.06M vs 3.00M ops/s). Running toGamut alone gives the same 274k as in the full run, so there is no cross-operation JIT pollution. Two small skews exist and neither explains the gap (see "Fairness notes").

The outputs are numerically the same. For gamut mapping, 39 out-of-sRGB oklch inputs gave identical sRGB (max difference 0.000 of 255, max dEOK 1e-15). For mix in oklab the max difference is 3e-13 of 255. For parse of the strings both accept it is 2e-13. Colordx runs the same CSS Color 4 section 13.2 chroma bisection (JND 0.02, epsilon 1e-4) as color-map. So the gap is not an accuracy trade and not a different algorithm. It is representation and engineering.

Most of the gap is engineering, with one part scope. (1) Engineering: color-map pushes every conversion through a generic XYZ-D65 hub of 15 spaces, with a fresh array or object for each step, and parses CSS with regexes, split and map. Colordx keeps one sRGB-byte representation, uses hand-fused formulas, and parses with a char-code scanner into shared module-level scratch. (2) Scope: color-map's mix carries `none` and powerless hues (CSS Color 4 section 4.4), which cost about 45% of its mix time. Colordx reads `none` as 0. Colordx also parses fewer things (no named colors without the names plugin, no `color-mix()`, no relative color), keeps the result only in sRGB, and rounds alpha to 3 decimals. color-map's toCss is faster because colordx must first round-trip oklch to sRGB bytes and back before printing.

Ablations show color-map could close or beat each gap without changing results: a specialised linear-sRGB port of color-map's own toGamut algorithm ran 5.9x faster than color-map (1.65M vs 0.28M, colordx 1.23M), and gave the same output to 2e-13. A mix without the `none` machinery ran 4.1x faster (4.38M vs 1.06M) with identical output.

## Reference material

### R1. Mechanisms, ranked by gain / cost / accuracy risk

Paths: CM = `packages/color-map/src/color` (commit 1519b69, the #289 branch). CDX = colordx tag @colordx/core@7.3.0 (commit 1c57334), https://github.com/dkryaklin/colordx/tree/%40colordx/core%407.3.0.

Recommended order of work: M2, then M1, then M3.

Run environment: color-map at the #289 merge (155d4eb; branch commit 1519b69), Node 26.7, Ryzen 7 5800X. The scripts in `scripts/` and the output in `scripts/results.txt` were run on that commit and that Node version.

| ID | Mechanism | Evidence | Measured effect | Type | Gain for color-map | Cost | Accuracy risk |
|---|---|---|---|---|---|---|---|
| M1 | Gamut bisection runs on generic hub conversions. Each iteration: `componentsIn(current,'srgb')` (oklch to XYZ to sRGB, with 3 pow), `clipped()` allocs a Color, `deltaEOKWith` converts both colors to oklab through XYZ (3 pow decode, trig, hypot) and allocates arrays. Colordx stays in linear sRGB: `oklabToLinear` (1 matrix, 3 cubes) and `linearSrgbToOklab` (no gamma encode or decode), hue trig hoisted out of the loop (commit 9764cf2). | CM gamut.ts:228-271, convert.ts:20-27, compare.ts:55-59, spaces.ts, rgb.ts:13-18, oklab.ts:5-11, polar.ts:6-13. CDX src/gamut.ts:412-482, colorModels/oklab.ts:100-116, 50-59. CPU profile of color-map toGamut: toXyz/fromXyz/transfer/clipped are the top self-time entries. | Port of color-map's algorithm in linear sRGB with scratch buffers and oklch output: 1.65M ops/s vs color-map 0.28M (5.9x) and colordx 1.23M. Output diff 2e-13. About 5.9 bisection iterations per call. | Engineering | Largest: gamut 4-6x | Medium: a private linear-sRGB fast path inside `toGamutWith` for the srgb target (and a similar one per RGB gamut); keep the generic path for other gamuts | None shown (clip commutes with the monotone transfer function; verified) |
| M2 | Mix pays for `none` carrying and powerless-hue detection on every call: `convertKeepingNone` maps components with `string.indexOf` and closures, `carry()` allocates 2-tuples per component, `prepare` checks POWERLESS. | CM mix.ts:317-325, 340-350, 373-375, 404-426. Profile: the indexOf map callback 32% self, convertKeepingNone 12%, mixWith 9%, prepare 5%. CDX plugins/mix.ts:38-49 (no none handling; `none` parses as 0, README line 743). | Mix with inputs already in oklab: color-map 6.0M ops/s, so the cost is in the pre-step, not the interpolation. A mix with `convert` x2 and plain math (no none or powerless): 4.38M vs 1.06M (4.1x), same output. | Mostly scope (a feature color-map has and colordx lacks), partly engineering | Large: mix 3-4x | Low: skip the analogous-component map when neither input has a `null` component, skip the powerless check when the target space has no entry in POWERLESS (oklab) | None: semantics unchanged when no `null` is present |
| M3 | Parsing uses a regex plus `split('/')`, `.map(trim)`, `split(/\s+/)`, `.filter`, then a per-channel NUMBER regex, `slice`, `Number()`. Hex uses a regex test, spread, map and join, then parseInt on slices. Colordx dispatches on the first char code, scans digits by char code into shared module-level state (`SC`, `_p`) with no per-call allocation, builds numbers by hand, and decodes hex with `hexDigit`. | CM parse.ts:4, 30-46, 84-92, 96-133, 141-153. CDX src/scan.ts:12-77, 102-154, src/parse.ts:297-314, colorModels/hex.ts:15-54; commit b49f64c "parse every color function with one shared scanner instead of per-format regexes". Profile of color-map parse(rgb()): `functional` 40% self, `channel` 26%, GC 8%. | By kind (color-map vs colordx): hex 6.3M vs 27.8M, rgb() 0.91M vs 5.03M, oklch() 1.03M vs 3.30M, hsl() 1.26M vs 6.53M. A charCode hex port (equal output) runs 51.9M (caveat: V8 may scalar-replace the result in a micro-loop). | Engineering | Large for parse-heavy use: 3-5x | Medium: a hand-written scanner for `#hex` and the legacy and space `rgb/hsl/hwb/lab/lch/oklab/oklch/color()` forms; the error messages that `fail()` produces need keeping. Fuzz it against the regex parser. | Low if fuzzed against the current parser |
| M4 | Single canonical representation. Colordx converts to sRGB (0-255, unrounded) at construction and every operation starts from it; hot byte-to-linear uses a 256-entry lookup table (commit 258737d). color-map re-derives through XYZ for each op and uses `**2.4` per channel. | CDX colordx.ts:18-32, transfer.ts:59-67. CM transfer.ts:3-4, matrices.ts, convert.ts:5-7. | Not isolated. Single-step conversions are about equal (srgb to oklab: color-map 9.2M vs colordx 7.4M incl. constructor; compare.json shows color-map ahead on 5 of 8 conversions, colordx ahead on oklch to srgb and oklab to srgb), so the benefit is seen on multi-step ops (M1) and on 8-bit inputs. | Engineering plus design (limits to sRGB-centred use) | Small to medium; a byte LUT helps only `#hex` inputs | Low | Low. A LUT must reproduce `srgbToLinear` exactly (it does in colordx: built from the same function) |
| M5 | Direct, fused formulas instead of `Space` objects with `toXyz`/`fromXyz` through `multiply()` that returns a new 3-array each time; the `find()` Map lookup per conversion. | CM convert.ts:13-27, math.ts:7-9, spaces.ts, oklab.ts, rgb.ts. Profile: `find` convert.js 4.7% in gamut, multiply and GC 8% | Part of M1 and M2. Generic conversions are not slow by themselves (color-map matches culori on conversions, 5.8-8.8M ops/s). | Engineering | Small beyond M1 | High if redone across 15 spaces | Low |
| M6 | Scope differences that make colordx cheaper without being better: `none` read as 0, no named colors without the names plugin (4 of the 64 benchmark strings are rejected quickly), no `color-mix()` or relative color (its roadmap), result kept in sRGB (color-map returns the original space, so one more conversion), alpha rounded to 3 decimals in the constructor (CDX colordx.ts:31), mapped channels snapped to 0 and 255 within 0.5 (CDX colordx.ts:42-53), channels bounded at 1e6, in-gamut test tolerance 5e-4 for `inGamut` (gamut.ts:380-383). | See cells | Small: per-kind parse ratios (3.2-5.5x) all exceed the aggregate 3.7x, so the 4 rejected strings do not inflate it. | Does less | None (not adoptable; would change results) | n/a | High |
| M7 | toCss: color-map is faster because `roundTo` avoids string building (`toFixed`), and the colordx bench path round-trips oklch to sRGB bytes and back before printing. | CM serialize.ts:23-38. CDX colordx.ts:148-155, helpers.ts:5-8. | color-map 5.5M vs colordx 2.7M | Engineering (color-map ahead) | None | n/a | n/a |

### R2. Fairness notes (the benchmark itself)

- B1. The colordx adapter wraps plain objects in `colordx()` per call, so construction and conversion are inside the timed region (bench.mjs:149-157). The SKILL.md trap is avoided.
- B2. Output types differ. Colordx gamut mapping returns sRGB; color-map returns the original space (one extra oklab to oklch conversion). The port in M1 included that conversion and still beat colordx, so this is not the cause. For mix, colordx returns sRGB (extra gamma encode), color-map returns oklab; this favours color-map slightly.
- B3. 4 of 64 parse strings (named colors) are rejected by colordx (names plugin not loaded); a fast fail. Per-kind ratios show the effect is small.
- B4. Colordx's oklch() parse converts to sRGB at parse (it does more work per string than color-map's parse for that kind) and still wins; color-map keeps the author's space.

## Confidence

High that the benchmark is fair and the outputs are equivalent (reproduced runs, direct diffs). High on M1 and M2 (ablation ports produce the same output and reach or beat colordx). Medium on M3 (profile and per-kind rates, but no regex-to-scanner port beyond hex). Medium-low on the exact share of M4/M5.

## Strongest support

Reproduction of the three gaps; port ablations that match the existing outputs; profiles; colordx's own perf commits (9764cf2, b49f64c, 258737d, 4372210) naming these exact techniques.

## Strongest counterevidence

Single-step conversions are not slower in color-map (it matches or beats colordx on several), so the generic-hub design is not slow per se. Ports are micro-benchmarks that skip validation, error handling and the full API surface; real gains in the library will be somewhat smaller.

## Not supported

Any claim that colordx trades accuracy for speed in gamut mapping or mix: the outputs match to 1e-13 on the sampled inputs. The hex port's 51.9M figure should not be used as a target.

## Thin evidence

Only 64 seeded inputs per check; no fuzzing of edge cases (achromatic, L at 0 or 1, NaN, huge chroma). No check of other Node versions or machines (the benchmark ran on Node 26.7 on a Ryzen 7 5800X; colordx's README numbers are from an Apple M5 Pro on Node 24). The colordx author's own posts were not found; the evidence comes from its source, changelog, commit log and README.

## Recheck triggers

Colordx releases adding `none` handling or `color-mix()` (its roadmap), which would shrink the scope difference. Re-run after any color-map change that touches convert.ts or gamut.ts.
