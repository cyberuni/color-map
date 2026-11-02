# Why @colordx/core is faster than color-map (November 2026)

## Question

Why is @colordx/core 7.3.0 about 3.7x faster at parse, 4.7x at gamut mapping and 2.5x at mix than color-map, while color-map is about 2x faster at toCss?

## Scope

**In scope:**
- Whether the benchmark in `packages/color-map/scripts/bench.mjs` compares the two libraries fairly.
- Whether the outputs of the two libraries are numerically equivalent.
- The mechanisms behind each gap, ranked by gain, cost and accuracy risk.

**Out of scope:**
- Changing any code. This topic is research only.
- Other libraries on the Compare page.

## Source angles

- **Benchmark harness:** `packages/color-map/scripts/bench.mjs`, reproduced on Node 26.7 on a Ryzen 7 5800X.
- **color-map source:** `packages/color-map/src/color` at the #289 merge (155d4eb).
- **colordx source:** tag @colordx/core@7.3.0 (commit 1c57334), its README, changelog and commit log.
- **Executed probes:** equivalence checks, ablation ports and CPU profiles, kept in `scripts/`.

## Findings

The findings are in `conclusion.md` (mechanisms M1 to M7 and the fairness notes B1 to B4). The claims behind them are in `evidence.md`.

- The benchmark is a fair like-for-like and the outputs match to about 1e-13.
- The gap is engineering plus one part scope. It is not an accuracy trade.
- Recommended order of work: M2 (mix), M1 (gamut), M3 (parse).

## Scripts

`scripts/` holds the probes and their output. Run each from the repo root with Node after building `packages/color-map`; each resolves the package from its own location.

- `equiv.mjs`: output equivalence for parse, gamut and mix, and the names rejected by colordx.
- `ablate.mjs`: per-kind parse rates, the linear-sRGB gamut port and the mix baseline.
- `ablate2.mjs`: the charCode hex port and the mix port without `none` handling.
- `prof1.mjs`: a loop for CPU profiling `parse(rgb())`.
- `results.txt`: the output of one run of `equiv.mjs` and `ablate.mjs`/`ablate2.mjs`. Rates vary a little between runs, so `conclusion.md` quotes the figures from the run it was written from.

## Contradictions

- None found. The figures in `scripts/results.txt` differ slightly from those in `conclusion.md` because they come from separate runs (see `changes.md`).

## Open questions

- Whether the ports keep their gain once validation, error handling and the full API surface are added.
- Whether fuzzed edge cases (achromatic, L at 0 or 1, NaN, huge chroma) still match.
