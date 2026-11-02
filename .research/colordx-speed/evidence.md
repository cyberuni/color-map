# Evidence: Why @colordx/core is faster than color-map

Measurements were taken on color-map at the #289 merge (155d4eb), Node 26.7, Ryzen 7 5800X. `source.url` for local runs points at the script in this folder.

## E01

- claim_id: E01
- claim: The benchmark is a fair like-for-like. Same seeded inputs, a fresh construction in every timed call, 300 ms warmup, 5 samples, one child process per library. The three gaps reproduce (parse 1.34M vs 4.98M, toGamut 274k vs 1.38M, mix 1.06M vs 3.00M ops/s), and toGamut alone gives the same 274k as the full run, so there is no cross-operation JIT pollution.
- date: 2026-11-02
- status: active
- confidence: high
- source.label: packages/color-map/scripts/bench.mjs, reproduced
- source.url: https://github.com/cyberuni/color-map/blob/main/packages/color-map/scripts/bench.mjs
- source.type: BENCHMARK
- notes: the colordx adapter wraps plain objects in `colordx()` per call (bench.mjs:149-157), so construction is timed. Fairness notes B1 to B4 are in `conclusion.md`.

## E02

- claim_id: E02
- claim: The outputs are numerically the same. Gamut: 39 of 64 inputs were out of sRGB and gave identical sRGB (max difference 0.000 of 255, max dEOK 1e-15). Mix in oklab: max difference 3e-13 of 255. Parse of strings both accept: 2e-13. Colordx runs the same CSS Color 4 section 13.2 chroma bisection (JND 0.02, epsilon 1e-4).
- date: 2026-11-02
- status: active
- confidence: high
- source.label: equiv.mjs
- source.url: scripts/equiv.mjs
- source.type: EXECUTED_PROBE
- notes: only 64 seeded inputs per check; no edge-case fuzzing. Output in `scripts/results.txt`.

## E03

- claim_id: E03
- claim: A specialised linear-sRGB port of color-map's own toGamut algorithm ran 5.9x faster than color-map (1.65M vs 0.28M ops/s, colordx 1.23M) with the same output to 2e-13, at about 5.9 bisection iterations per call. A mix with two `convert` calls and plain math (no `none` or powerless handling) ran 4.1x faster (4.38M vs 1.06M) with identical output. With inputs already in oklab, color-map mix runs 6.0M ops/s.
- date: 2026-11-02
- status: active
- confidence: high
- source.label: ablate.mjs and ablate2.mjs
- source.url: scripts/ablate.mjs
- source.type: EXECUTED_PROBE
- notes: supports M1 and M2. The ports skip validation, error handling and the full API surface, so gains in the library will be somewhat smaller. `scripts/results.txt` is a separate run (5.7x, 1.67M).

## E04

- claim_id: E04
- claim: Parse rates by kind (color-map vs colordx): hex 6.3M vs 27.8M, rgb() 0.91M vs 5.03M, oklch() 1.03M vs 3.30M, hsl() 1.26M vs 6.53M. Per-kind ratios (3.2 to 5.5x) all exceed the aggregate 3.7x, so the 4 named colors that colordx rejects do not inflate it. A charCode hex port runs 51.9M with equal output.
- date: 2026-11-02
- status: active
- confidence: medium
- source.label: ablate.mjs and ablate2.mjs
- source.url: scripts/ablate.mjs
- source.type: EXECUTED_PROBE
- notes: the hex port figure may be inflated because V8 can scalar-replace the result in a micro-loop; it is not a target. No regex-to-scanner port beyond hex was built.

## E05

- claim_id: E05
- claim: CPU profiles point at the mechanisms. color-map toGamut: toXyz, fromXyz, transfer and clipped are the top self-time entries; `find` in convert.js is 4.7% and multiply plus GC 8%. Mix: the indexOf map callback 32% self, convertKeepingNone 12%, mixWith 9%, prepare 5%. Parse of rgb(): `functional` 40% self, `channel` 26%, GC 8%.
- date: 2026-11-02
- status: active
- confidence: medium
- source.label: prof1.mjs and node CPU profiles
- source.url: scripts/prof1.mjs
- source.type: EXECUTED_PROBE
- notes: the profile files themselves were not kept.

## E06

- claim_id: E06
- claim: Colordx's own perf commits name the same techniques: 9764cf2 (linear-sRGB gamut loop with hoisted hue trig), b49f64c ("parse every color function with one shared scanner instead of per-format regexes"), 258737d (256-entry byte-to-linear lookup table), 4372210.
- date: 2026-11-02
- status: active
- confidence: high
- source.label: colordx commit log at @colordx/core@7.3.0
- source.url: https://github.com/dkryaklin/colordx/tree/%40colordx/core%407.3.0
- source.type: SOURCE_CODE
- notes: source locations are listed in the Evidence column of the M1 to M5 rows in `conclusion.md`. The author's own posts were not found.

## E07

- claim_id: E07
- claim: Single-step conversions are not slower in color-map. srgb to oklab runs 9.2M (color-map) vs 7.4M (colordx, including the constructor); compare.json shows color-map ahead on 5 of 8 conversions and level with culori (5.8 to 8.8M ops/s). So the generic hub is not slow per se; the cost shows on multi-step operations.
- date: 2026-11-02
- status: active
- confidence: medium
- source.label: ablate.mjs and the Compare page data
- source.url: scripts/ablate.mjs
- source.type: EXECUTED_PROBE
- notes: weakens M4 and M5 as stand-alone causes.

## E08

- claim_id: E08
- claim: Scope differences make colordx cheaper without being better: `none` read as 0 (README line 743), no named colors without the names plugin, no `color-mix()` or relative color (its roadmap), result kept in sRGB, alpha rounded to 3 decimals (colordx.ts:31), mapped channels snapped to 0 and 255 within 0.5 (colordx.ts:42-53), channels bounded at 1e6, `inGamut` tolerance 5e-4 (gamut.ts:380-383).
- date: 2026-11-02
- status: active
- confidence: high
- source.label: colordx source and README at @colordx/core@7.3.0
- source.url: https://github.com/dkryaklin/colordx/tree/%40colordx/core%407.3.0
- source.type: SOURCE_CODE
- notes: color-map's `none` and powerless-hue handling costs about 45% of its mix time.

## E09

- claim_id: E09
- claim: color-map is faster at toCss (5.5M vs 2.7M) because `roundTo` avoids string building, and the colordx bench path round-trips oklch to sRGB bytes and back before printing.
- date: 2026-11-02
- status: active
- confidence: medium
- source.label: serialize.ts and colordx.ts
- source.url: https://github.com/dkryaklin/colordx/tree/%40colordx/core%407.3.0
- source.type: SOURCE_CODE
- notes: color-map serialize.ts:23-38; colordx colordx.ts:148-155 and helpers.ts:5-8.
