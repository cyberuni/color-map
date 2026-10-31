# color-map

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

[![Github NodeJS][github-nodejs]][github-action-url]
[![Codecov][codecov-image]][codecov-url]

[![Semantic Release][semantic-release-image]][semantic-release-url]

[![Visual Studio Code][vscode-image]][vscode-url]

Color map generator with no dependency.

Inspired from [`colormap`](https://github.com/bpostlethwaite/colormap).

## `createColors(from, to, shades, alpha?)`

```ts
import { createColors } from 'color-map'

// creates array of [r,g,b,a]
const rgbaRange = createColors([0, 0, 255], [0, 255, 128], 72, [0, 1])

// creates array of [r,g,b,1]
const rgbRange = createColors([0, 0, 255], [0, 255, 128], 72)
```

## `rgbHex(rgb)`

```ts
import { rgbHex } from 'color-map'

rgbHex([0, 128, 255]) // '#0080ff'
rgbHex([0, 128, 255, 0.3]) // '#0080ff'
```

## `rgbaString(rgba)`

```ts
import { rgbaString } from 'color-map'

rgbaString([0, 128, 255, 0.2]) // 'rgba(0,128,255,0.2)`

```

## `createColorsFromMap(colormap, shades, alpha?)`

```ts
import { createColorsFromMap, ColorMap } from 'color-map'

const summer: ColorMap = [{ index: 0, rgb: [0,128,102] }, { index: 1, rgb: [255,255,102] }]

const colors = createColorsFromMap(summer, 60)
```

## The `color-map` command

The package ships a command for agents, with no extra install and no runtime dependency:

```sh
npx color-map palette '#3b82f6'
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

### For agents

- JSON Schemas for every command's arguments and options ship in `schemas/` (for example `color-map/schemas/scale.schema.json`) and print with `color-map schema <command>`.
- The `color-map` agent skill ships in this package as a plugin for Claude Code, Cursor, Codex and Copilot CLI (`plugin.json`, `skills/color-map`).
- [`llms.txt`](./llms.txt) maps the commands.

The command is a separate bundle (`bin/color-map.js`) that inlines its parser. No library entry point loads it, so importing `color-map` costs nothing for it.

## Contribute

```sh
# after fork and clone
npm install

# begin making changes
git checkout -b <branch>
npm run watch

# after making change(s)
git commit -m "<commit message>"
git push

# create PR
```

[codecov-image]: https://codecov.io/gh/cyberuni/color-map/branch/main/graph/badge.svg
[codecov-url]: https://codecov.io/gh/cyberuni/color-map
[downloads-image]: https://img.shields.io/npm/dm/color-map.svg?style=flat
[downloads-url]: https://npmjs.org/package/color-map
[github-nodejs]: https://github.com/cyberuni/color-map/actions/workflows/pull-request.yml/badge.svg
[github-action-url]: https://github.com/cyberuni/color-map/actions
[npm-image]: https://img.shields.io/npm/v/color-map.svg?style=flat
[npm-url]: https://npmjs.org/package/color-map
[semantic-release-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[vscode-image]: https://img.shields.io/badge/vscode-ready-green.svg
[vscode-url]: https://code.visualstudio.com/
