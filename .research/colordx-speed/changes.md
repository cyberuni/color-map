# Changes: Why @colordx/core is faster than color-map

## 2026-11-02 (after #293)

- **What changed:** a Status section was added to `conclusion.md`. M1, M2 and M3 were adopted in #293, with parse 1.31M to 3.11M, toGamut 274k to 1.25M and mix 1.11M to 3.28M ops/s. The original findings are unchanged and stand as the pre-change record.
- **Why:** trunk moved; #293 implemented the recommended changes.
- **Material change to the conclusion:** no. The findings are unchanged; only the status was added.
- **Triggering evidence:** the #293 measurements.
- **Figure mismatch:** `scripts/results.txt` is a separate run, and rates vary by a few percent from run to run. Three figures differ from the conclusion: the toGamut port (5.7x, 1.67M against 5.9x, 1.65M), the hex port (54.59M against 51.9M) and the gamut gap (4.2x against 4.7x). The conclusion keeps the draft figures.

## 2026-11-02

- **What changed:** initial research, saved into the repo from a finished draft. `conclusion.md`, `evidence.md`, the ablation scripts and `results.txt` were added.
- **Why:** the owner asked why @colordx/core beats color-map in the benchmark, and whether the benchmark is fair.
- **Material change to the conclusion:** yes. This is the first conclusion.
- **Triggering evidence:** E01 to E04 (reproduction, equivalence and ablations).
- **Notes on the move into the repo:** claims and figures are unchanged from the draft. Absolute paths became repo-relative, the scripts resolve the package from their own location, and the headings follow the research layout contract. `results.txt` is one run; its rates differ slightly from the figures in the conclusion (for example toGamut 0.29M against 0.28M, and the hex port 54.59M against 51.9M). The conclusion keeps the draft's figures.
