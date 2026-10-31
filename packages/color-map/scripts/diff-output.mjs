// Differential check of toCss and toHex: prints a hash of their output over a
// large seeded set of colors, every space, precisions 0 to 10 and the default.
// Run it on two builds; equal hashes mean byte-identical output.
//
//   node scripts/diff-output.mjs [esm-dir] [count]   default ./esm and 200000
//
// To compare against a build from another commit, copy its esm/ somewhere
// (with a package.json of {"type":"module"} above it) and pass that path.
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const dir = resolve(process.argv[2] ?? 'esm')
const count = Number(process.argv[3] ?? 200000)
const { toCss, toHex } = await import(pathToFileURL(`${dir}/color/index.js`).href)

const SPACES = [
	'srgb',
	'srgb-linear',
	'hsl',
	'hwb',
	'lab',
	'lch',
	'oklab',
	'oklch',
	'display-p3',
	'display-p3-linear',
	'a98-rgb',
	'prophoto-rgb',
	'rec2020',
	'xyz-d50',
	'xyz-d65'
]
let seed = 20260101
const rand = () => {
	seed = (seed * 1664525 + 1013904223) >>> 0
	return seed / 2 ** 32
}
const SPECIAL = [
	0,
	-0,
	0.5,
	-0.5,
	1,
	-1,
	0.125,
	0.0000005,
	0.000005,
	1e-7,
	-1e-7,
	1e21,
	1e-21,
	123456789.123456,
	Number.NaN,
	Number.POSITIVE_INFINITY,
	Number.NEGATIVE_INFINITY,
	0.1 + 0.2,
	1.005,
	2.675,
	255,
	127.5
]
const value = () => {
	const r = rand()
	if (r < 0.1) return SPECIAL[Math.floor(rand() * SPECIAL.length)]
	if (r < 0.15) return null
	if (r < 0.6) return rand()
	if (r < 0.8) return (rand() - 0.5) * 400
	if (r < 0.9) return Math.round(rand() * 2e5) / 1e3 + 5e-6 // ties at 5 decimals, nearly
	return (rand() - 0.5) * 10 ** Math.floor(rand() * 12 - 6)
}
const hash = createHash('sha256')
for (let i = 0; i < count; i++) {
	const color = { colorSpace: SPACES[i % SPACES.length], components: [value(), value(), value()] }
	if (rand() < 0.3) color.alpha = rand() < 0.2 ? null : value()
	const precision = i % 12 === 11 ? undefined : i % 12
	let out
	try {
		out = toCss(color, precision === undefined ? undefined : { precision })
		out += toHex(color)
	} catch (e) {
		out = `throws ${e.name}`
	}
	hash.update(out)
	hash.update('\n')
}
process.stdout.write(`${count} colors, sha256 ${hash.digest('hex')}\n`)
