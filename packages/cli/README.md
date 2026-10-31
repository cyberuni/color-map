# color-map-cli

Color tools for agents, on top of [`color-map`](https://github.com/cyberuni/color-map). The command is `color-map`.

```sh
npx color-map-cli palette '#3b82f6'
```

Output is [TOON](https://github.com/toon-format/toon) by default, with `--format json` for JSON. It follows the [AXI](https://github.com/kunchenguid/axi) principles: essential fields by default and `--full` for the rest, precomputed contrast ratios, explicit empty results, coded errors with exit codes (1 failed, 2 wrong call), no prompts, and a suggested next command after each result.

| Command | What it does |
| --- | --- |
| `convert <color> --to <space>` | convert to any CSS color space, optionally gamut-mapped |
| `mix <a> <b>` | mix as `color-mix()` does |
| `contrast <fg> <bg>` | WCAG 2 ratio with AA and AAA verdicts |
| `find-contrast <bg> --target 4.5` | find a color that reaches a ratio |
| `scale <seed>` | a Tailwind, Radix, tone or even scale, a brand scale, or a contrast scale |
| `palette <brand>` | a semantic palette; every text pair carries its ratio |
| `harmony <color>` | complementary, split, analogous, triadic or tetradic colors |
| `export [color]` | CSS variables, DTCG JSON or a Tailwind v4 theme |
| `schema [command]` | the JSON Schema of a command's options |

Contrast is WCAG 2.

## For agents

- JSON Schemas for every command's arguments and options ship in `schemas/` (for example `color-map-cli/schemas/scale.schema.json`) and print with `color-map schema <command>`.
- The `color-map` agent skill ships in this package as a plugin for Claude Code, Cursor, Codex and Copilot CLI (`plugin.json`, `skills/color-map`).
- [`llms.txt`](./llms.txt) maps the commands.

## Development

`pnpm verify` builds, type-checks, runs depcheck, runs the tests at 100% coverage and checks that `llms.txt` is current. `pnpm llms` regenerates it; `pnpm build` regenerates `schemas/`.
