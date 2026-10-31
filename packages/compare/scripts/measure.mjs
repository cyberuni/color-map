// Measures color-map against other color libraries and writes the numbers the
// website's Compare page renders: browser size (gzip), speed, and the run's
// environment. Nothing is installed globally. Competitors are pinned
// devDependencies of this private package, so color-map's published
// dependencies are untouched.
//
//   pnpm --filter color-map build           (color-map's esm build is measured)
//   pnpm --filter color-map-compare measure
//
// Writes apps/website/src/data/compare.json. Commit the file after a run.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkgDir = resolve(here, '..')
const root = resolve(pkgDir, '../..')
const outFile = resolve(root, 'apps/website/src/data/compare.json')

// Read the installed version from disk: several packages hide package.json behind "exports".
const installed = (name) => JSON.parse(readFileSync(join(pkgDir, 'node_modules', name, 'package.json'), 'utf8')).version

// One entry file per scenario. "convert" parses #3b82f6, converts it to oklch and
// serializes it (colord has no oklch, so it goes to hsl). "whole" re-exports the
// package, which is what a bundler keeps when it cannot tree-shake.
const ENTRIES = {
	'color-map': {
		convert: `import { parse, convert, toCss } from 'color-map/color'
console.log(toCss(convert(parse('#3b82f6'), 'oklch')))`,
		narrow: `import { createConverter, srgb, oklch } from 'color-map/color'
console.log(createConverter(srgb, oklch)([0.23, 0.51, 0.96]))`,
		whole: `export * from 'color-map/color'
export * from 'color-map/scale'
export * from 'color-map/palette'
export * from 'color-map/export'`
	},
	culori: {
		convert: `import { parse, oklch, formatCss } from 'culori'
console.log(formatCss(oklch(parse('#3b82f6'))))`,
		whole: `export * from 'culori'`
	},
	'colorjs.io': {
		convert: `import { ColorSpace, sRGB, OKLCH, parse, to, serialize } from 'colorjs.io/fn'
ColorSpace.register(sRGB)
ColorSpace.register(OKLCH)
console.log(serialize(to(parse('#3b82f6'), 'oklch')))`,
		whole: `export * from 'colorjs.io/fn'`
	},
	'chroma-js': {
		convert: `import chroma from 'chroma-js'
console.log(chroma('#3b82f6').oklch())`
	},
	'@texel/color': {
		convert: `import { convert, sRGB, OKLCH } from '@texel/color'
console.log(convert([0.23, 0.51, 0.96], sRGB, OKLCH))`,
		whole: `export * from '@texel/color'`
	},
	colord: {
		convert: `import { colord } from 'colord'
console.log(colord('#3b82f6').toHslString())`,
		whole: `export * from 'colord'`
	}
}

const tmp = join(pkgDir, '.entries')
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })
const config = []
for (const [lib, scenarios] of Object.entries(ENTRIES)) {
	for (const [scenario, source] of Object.entries(scenarios)) {
		const file = join(tmp, `${lib.replace(/[^a-z0-9]/gi, '_')}-${scenario}.js`)
		writeFileSync(file, `${source}\n`)
		config.push({ name: `${lib}|${scenario}`, path: file, gzip: true })
	}
}
const configFile = join(tmp, 'size-limit.json')
writeFileSync(configFile, JSON.stringify(config))

console.error('measuring sizes...')
const sizeOut = execFileSync(join(pkgDir, 'node_modules/.bin/size-limit'), ['--json', '--config', configFile], {
	cwd: pkgDir,
	encoding: 'utf8',
	maxBuffer: 1 << 26
})
const sizes = {}
for (const row of JSON.parse(sizeOut)) {
	const [lib, scenario] = row.name.split('|')
	;(sizes[lib] ??= {})[scenario] = row.size
}
rmSync(tmp, { recursive: true, force: true })

console.error('running the speed benchmark...')
const benchOut = execFileSync(process.execPath, ['scripts/bench.mjs', '--json'], {
	cwd: resolve(root, 'packages/color-map'),
	encoding: 'utf8',
	maxBuffer: 1 << 26
})
const bench = JSON.parse(benchOut)

const sizeLimitVersion = installed('size-limit')
const data = {
	generatedAt: new Date().toISOString().slice(0, 10),
	versions: Object.fromEntries(
		['color-map', 'culori', 'colorjs.io', 'chroma-js', '@texel/color', 'colord', 'lightningcss'].map((n) => [
			n,
			n === 'color-map'
				? JSON.parse(readFileSync(join(root, 'packages/color-map/package.json'), 'utf8')).version
				: installed(n)
		])
	),
	method: {
		sizeTool: `size-limit ${sizeLimitVersion} with @size-limit/preset-small-lib (minified, gzip)`,
		script: 'packages/compare/scripts/measure.mjs'
	},
	env: { ...bench.env, os: `${os.type()} ${os.release()}` },
	sizes,
	speed: bench.results
}
mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, `${JSON.stringify(data, null, '\t')}\n`)
console.error(`wrote ${outFile}`)
