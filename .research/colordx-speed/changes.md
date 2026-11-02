# Changes: Why @colordx/core is faster than color-map

## 2026-11-02

- **What changed:** initial research, saved into the repo from a finished draft. `conclusion.md`, `evidence.md`, the ablation scripts and `results.txt` were added.
- **Why:** the owner asked why @colordx/core beats color-map in the benchmark, and whether the benchmark is fair.
- **Material change to the conclusion:** yes. This is the first conclusion.
- **Triggering evidence:** E01 to E04 (reproduction, equivalence and ablations).
- **Notes on the move into the repo:** claims and figures are unchanged from the draft. Absolute paths became repo-relative, the scripts resolve the package from their own location, and the headings follow the research layout contract. `results.txt` is one run; its rates differ slightly from the figures in the conclusion (for example toGamut 0.29M against 0.28M, and the hex port 54.59M against 51.9M). The conclusion keeps the draft's figures.
