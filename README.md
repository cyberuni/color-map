# color-map

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

[![Github NodeJS][github-nodejs]][github-action-url]
[![Codecov][codecov-image]][codecov-url]

[![Visual Studio Code][vscode-image]][vscode-url]
[![Wallaby.js][wallaby-image]][wallaby-url]

Color map generator with no dependency.

Inspired from [`colormap`](https://github.com/bpostlethwaite/colormap).

## Library

```ts
import { parse, toCss, convert, semanticPalette, toTailwindTheme } from 'color-map'

toCss(convert(parse('#3b82f6'), 'oklch')) // oklch(0.62308 0.18801 259.81453)
toTailwindTheme(semanticPalette({ brand: '#3b82f6', mode: 'light' })) // an @theme { ... } block
```

`color-map` re-exports the subpaths `color-map/color`, `color-map/scale`, `color-map/palette` and `color-map/tokens`. With a bundler, the root costs the same bytes as a subpath. Code that runs without a bundler can import a subpath to load less. See the [library docs](https://cyberuni.github.io/color-map/library/) for the full API.

## Legacy API

The original API lives in `color-map/legacy`. The root `color-map` still exports it in 2.x, marked deprecated, and stops in 3.0.

### `createColors(from, to, shades, alpha?)`

```ts
import { createColors } from 'color-map/legacy'

// creates array of [r,g,b,a]
const rgbaRange = createColors([0, 0, 255], [0, 255, 128], 72, [0, 1])

// creates array of [r,g,b,1]
const rgbRange = createColors([0, 0, 255], [0, 255, 128], 72)
```

### `rgbHex(rgb)`

```ts
import { rgbHex } from 'color-map/legacy'

rgbHex([0, 128, 255]) // '#0080ff'
rgbHex([0, 128, 255, 0.3]) // '#0080ff'
```

### `rgbaString(rgba)`

```ts
import { rgbaString } from 'color-map/legacy'

rgbaString([0, 128, 255, 0.2]) // 'rgba(0,128,255,0.2)`

```

### `createColorsFromMap(colormap, shades, alpha?)`

```ts
import { createColorsFromMap, ColorMap } from 'color-map/legacy'

const summer: ColorMap = [{ index: 0, rgb: [0,128,102] }, { index: 1, rgb: [255,255,102] }]

const colors = createColorsFromMap(summer, 60)
```

## Demo website

`apps/website` is an Astro + Starlight site with a color converter, a `color-mix()` playground and a palette builder. It builds against the workspace copy of `color-map`.

```sh
pnpm web dev     # serve locally
pnpm web build   # static build into apps/website/dist
```

Internal links in the site's Markdown need the `/color-map/` base prefix, and new pages need a `sidebar` entry in `apps/website/astro.config.mjs`.

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
[vscode-image]: https://img.shields.io/badge/vscode-ready-green.svg
[vscode-url]: https://code.visualstudio.com/
[wallaby-image]: https://img.shields.io/badge/wallaby.js-configured-green.svg
[wallaby-url]: https://wallabyjs.com
