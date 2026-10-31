# Changes: Modern CSS color and design-system palettes for color-map

## 2026-10-30

- **What changed:** initial research. The topic record, evidence log (E01–E96), conclusion and phased plan were created from three parallel strand reports (CSS color, palettes, libraries) plus a synthesis pass.
- **Why:** color-map's last feature release predates modern CSS color. The owner asked for a plan to support every CSS color form, palette generation that an agent can drive, and a demo website.
- **Material change to the conclusion:** yes. This is the first conclusion.
- **Triggering evidence:**
  - E92: an executed probe showing that no major library parses Color 5.
  - E95: the DTCG 2025.10 color shape, verified.
  - E96: the tone-follows-luminance derivation.

## 2026-10-30 (owner review)

- **What changed:** the plan was revised after the owner reviewed questions Q1–Q5.
  - D8 now keeps the existing functions as exact wrappers, with minor releases only. This corrects an earlier 3.0.0 recommendation that had no semver basis.
  - D10 is new: a separate CLI package on clibuilder following axi, a skill shipped with universal-plugin, and no MCP server.
  - The website moved to `apps/website` with a root `web` script.
  - Q1 and Q2 now carry the adoption data and the option comparison.
- **Why:** the owner asked why a major release was needed, chose the website folder, and directed the CLI approach.
- **Material change to the conclusion:** yes (plan only; the research verdict is unchanged).
- **Triggering evidence:** E97–E106. The owner also asked about bundle size and the zero-dependency claim, which led to the per-entry budgets in D9 and to D8 keeping the old functions independent of the core. Asked about add-on packages and the CLI name, which led to D10 naming. Then asked what users gain from add-on packages over using apca-w3 or MCU directly; the answer was little, so D11 now has recipes and fromArgb in place of add-on packages.
