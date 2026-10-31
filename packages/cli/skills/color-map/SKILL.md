---
name: color-map
description: Build a design-system color palette, scale or token file with the color-map CLI. Use when asked to pick or generate colors from a brand color, make a semantic palette with passing contrast, convert or mix CSS colors, check WCAG contrast, or export colors as CSS variables, DTCG tokens or a Tailwind v4 theme.
---

# color-map

Drive the `color-map` command instead of writing color math by hand. Every result prints as TOON by default; add `--format json` for JSON. Run it with `npx color-map-cli` when it is not installed.

## One prompt to a valid palette

1. Run `color-map palette '<brand color>' [--mode dark]`. The answer lists each role (`primary`, `primaryContainer`, `success`, `warning`, `danger`, `info`, `surface`, `surfaceVariant`, `outline`) with its background, text color and WCAG 2 ratio.
2. Read `failing` and `issues`. `failing: 0` and `issues: "none: ..."` mean every pair meets its target. If not, change `--target` or the brand color and run it again; do not edit hex values by hand.
3. Write the result with `color-map export '<brand color>' --source palette --to css|tailwind|dtcg`. The output is the file content: redirect it to a file.
4. Do both modes when the design has a dark theme: run steps 1 and 3 with `--mode dark`.

## Commands

| Command | Use it to |
| --- | --- |
| `convert <color> --to <space> [--gamut <gamut>]` | change space; `--gamut` maps into a gamut instead of clipping |
| `mix <a> <b> [--amount 0.5] [--in oklab]` | blend as `color-mix()` does |
| `contrast <fg> <bg>` | WCAG 2 ratio with the AA and AAA verdicts |
| `find-contrast <bg> --target 4.5 [--hue H] [--chroma C]` | find a text color that reaches a ratio |
| `scale <seed> [--preset tailwind-11\|radix-12\|tone-13\|even] [--steps N] [--brand] [--targets R ...]` | a scale; `--brand` keeps the seed as step 9; `--targets` with `--background` builds a contrast scale |
| `palette <brand> [--mode] [--target]` | the semantic palette above |
| `harmony <color> --scheme complementary\|split\|analogous\|triadic\|tetradic` | related hues |
| `export [color] --to css\|tailwind\|dtcg [--source palette\|scale] [--tokens file.json]` | write tokens |
| `schema [command]` | print the JSON Schema of a command's options |

Colors are any CSS color: `#3b82f6`, `oklch(0.7 0.15 250)`, `color-mix(in oklab, red, blue)`. Add `--full` for every field. Run `color-map <command> --help` for one command.

## Rules

- Contrast is WCAG 2. There is no other contrast algorithm; do not look for an option for one.
- Pass colors as given; never round-trip them through hex when precision matters. Use `--to oklch` or `--format json`.
- A failed call exits 2 with a coded error (`invalid-color`, `unknown-option`, ...) on stdout. Fix the input named in the error and retry; retrying the same call cannot help.
- Nothing prompts, and an unknown flag fails instead of being ignored.
