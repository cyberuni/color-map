# Measured browser sizes (gzip bytes), 2026-10-31, color-map main e03bf9f
Method: size-limit 14.3.0 + @size-limit/preset-small-lib (rolldown, minified, gzip), one entry file per scenario, tree-shaken named imports, entry files below. Versions: culori 4.0.2, colorjs.io 0.7.1 (colorjs.io/fn), chroma-js 3.2.0, @texel/color 1.1.11, colord 2.10.0, color-map = packages/color-map at main (esm build).
Scenario "convert": parse '#3b82f6', convert to oklch, serialize (colord: to hsl, it has no oklch). "whole": export * from the package.

| library | convert scenario | whole package / every entry |
| --- | ---: | ---: |
| color-map | 5229 | 11938 (export * from /color, /scale, /palette, /export) |
| culori | 12264 | 19003 |
| colorjs.io/fn | 16139 | 26690 |
| chroma-js | 14133 | single import, not tree-shakeable |
| @texel/color | 1555 | 7671 |
| colord | 1825 (hsl only) | 1892 |
| lightningcss | not measured: native Rust binary, not a browser library |

These are the previous readings; the pod must re-measure and use its own numbers.

## Entry files (one per scenario)
cm-convert:      import { parse, convert, toCss } from '<abs>/packages/color-map/esm/color/index.js'; console.log(toCss(convert(parse('#3b82f6'), 'oklch')))
cm-all:          export * from esm/color, esm/scale, esm/palette, esm/export index.js
culori-convert:  import { parse, oklch, formatCss } from 'culori'; console.log(formatCss(oklch(parse('#3b82f6'))))
culori-all:      export * from 'culori'
colorjs-convert: import { ColorSpace, sRGB, OKLCH, parse, to, serialize } from 'colorjs.io/fn'; ColorSpace.register(sRGB); ColorSpace.register(OKLCH); console.log(serialize(to(parse('#3b82f6'), 'oklch')))
colorjs-all:     export * from 'colorjs.io/fn'
chroma-convert:  import chroma from 'chroma-js'; console.log(chroma('#3b82f6').oklch())
texel-convert:   import { convert, sRGB, OKLCH } from '@texel/color'; console.log(convert([0.23,0.51,0.96], sRGB, OKLCH))
texel-all:       export * from '@texel/color'
colord-convert:  import { colord } from 'colord'; console.log(colord('#3b82f6').toHslString())
colord-all:      export * from 'colord'

## color-map's own narrower budgets (packages/color-map/package.json "size-limit")
402 B old API; 1.13 kB two-space convert via createConverter (no CSS parser); 6.5 kB full core; 10.04 kB "everything" (named subset). The 5229 B above is higher because `parse` pulls in the CSS parser and every space it can read.
