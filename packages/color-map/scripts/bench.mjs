// Runtime benchmark: color-map against culori and colorjs.io on the same
// operations and the same inputs. Run `pnpm build` first, then `pnpm bench`.
//
//   node scripts/bench.mjs                 all libraries, all operations
//   node scripts/bench.mjs --filter mix    operations whose name contains "mix"
//   node scripts/bench.mjs --lib ./old-esm color-map from another build, to compare
//   node scripts/bench.mjs --only culori   one library
//   node scripts/bench.mjs --json          machine-readable output
//
// Each library runs in its own child process, so one library's JIT state does
// not slow another. Each operation cycles through 64 varied inputs, made before
// timing starts. A run is 5 samples of about 300 ms after a warm-up; the table
// shows the median ops/sec and the spread between the slowest and fastest
// sample. colorjs.io is measured through its procedural API (`colorjs.io/fn`),
// its fastest; culori converters are made once, outside the timed loop.
import { execFileSync } from 'node:child_process'
import os from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const opt = (name) => {
	const i = args.indexOf(name)
	return i === -1 ? undefined : args[i + 1]
}
const LIBS = ['color-map', 'culori', 'colorjs.io']
const SAMPLES = 5
const SAMPLE_MS = 300
const WARMUP_MS = 300
const N = 64

// --- inputs, the same for every library (seeded, so every run sees the same) ---
let seed = 42
const rand = () => {
	seed = (seed * 1664525 + 1013904223) >>> 0
	return seed / 2 ** 32
}
const srgbIn = Array.from({ length: N }, () => [rand(), rand(), rand()])
// Wide chroma, so about half fall outside sRGB and toGamut has work to do.
const oklchIn = Array.from({ length: N }, () => [0.15 + rand() * 0.8, rand() * 0.35, rand() * 360])
const oklabIn = oklchIn.map(([l, c, h]) => [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)])
const labIn = Array.from({ length: N }, () => [5 + rand() * 90, rand() * 160 - 80, rand() * 160 - 80])
const p3In = Array.from({ length: N }, () => [rand(), rand(), rand()])
const hex = (n) =>
	Math.round(n * 255)
		.toString(16)
		.padStart(2, '0')
const STRINGS = [
	...srgbIn.slice(0, 16).map(([r, g, b]) => `#${hex(r)}${hex(g)}${hex(b)}`),
	...srgbIn
		.slice(16, 32)
		.map(([r, g, b]) => `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)} / 0.5)`),
	...oklchIn.slice(0, 16).map(([l, c, h]) => `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`),
	...srgbIn.slice(32, 40).map((_, i) => `hsl(${i * 45} ${40 + i * 5}% ${30 + i * 5}%)`),
	...['rebeccapurple', 'tomato', 'cornflowerblue', 'darkolivegreen'],
	...p3In.slice(0, 4).map(([r, g, b]) => `color(display-p3 ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)})`)
]

// --- adapters: each library's own color objects and calls ---
async function adapters(name, lib) {
	if (name === 'color-map') {
		const base = pathToFileURL(`${resolve(lib)}/`).href
		const c = await import(new URL('color/index.js', base).href)
		const s = await import(new URL('scale/index.js', base).href)
		const p = await import(new URL('palette/index.js', base).href)
		const make = (colorSpace) => (v) => ({ colorSpace, components: [...v] })
		return {
			make: {
				srgb: make('srgb'),
				oklch: make('oklch'),
				oklab: make('oklab'),
				lab: make('lab'),
				p3: make('display-p3')
			},
			ops: {
				parse: (s) => c.parse(s),
				'srgb -> oklch': (x) => c.convert(x, 'oklch'),
				'oklch -> srgb': (x) => c.convert(x, 'srgb'),
				'srgb -> oklab': (x) => c.convert(x, 'oklab'),
				'oklab -> srgb': (x) => c.convert(x, 'srgb'),
				'srgb -> lab': (x) => c.convert(x, 'lab'),
				'lab -> srgb': (x) => c.convert(x, 'srgb'),
				'srgb -> display-p3': (x) => c.convert(x, 'display-p3'),
				'display-p3 -> srgb': (x) => c.convert(x, 'srgb'),
				'toCss (oklch)': (x) => c.toCss(x),
				'toHex (srgb)': (x) => c.toHex(x),
				'toGamut css (oklch)': (x) => c.toGamut(x),
				'mix oklab': (x, y) => c.mix(x, y, 0.5),
				'contrast wcag2': (x, y) => c.contrast(x, y),
				'findContrast 4.5': (x) => c.findContrast(x, 4.5),
				'createScale tailwind-11': (x) => s.createScale({ seed: x }),
				semanticPalette: (x) => p.semanticPalette({ brand: x })
			}
		}
	}
	if (name === 'culori') {
		const k = await import('culori')
		const to = {
			oklch: k.converter('oklch'),
			oklab: k.converter('oklab'),
			lab: k.converter('lab'),
			rgb: k.converter('rgb'),
			p3: k.converter('p3')
		}
		const gamut = k.toGamut('rgb', 'oklch')
		const make = (mode, keys) => (v) => ({ mode, [keys[0]]: v[0], [keys[1]]: v[1], [keys[2]]: v[2] })
		return {
			make: {
				srgb: make('rgb', 'rgb'),
				oklch: make('oklch', 'lch'),
				oklab: make('oklab', 'lab'),
				lab: make('lab', 'lab'),
				p3: make('p3', 'rgb')
			},
			ops: {
				parse: (s) => k.parse(s),
				'srgb -> oklch': (x) => to.oklch(x),
				'oklch -> srgb': (x) => to.rgb(x),
				'srgb -> oklab': (x) => to.oklab(x),
				'oklab -> srgb': (x) => to.rgb(x),
				'srgb -> lab': (x) => to.lab(x),
				'lab -> srgb': (x) => to.rgb(x),
				'srgb -> display-p3': (x) => to.p3(x),
				'display-p3 -> srgb': (x) => to.rgb(x),
				'toCss (oklch)': (x) => k.formatCss(x),
				'toHex (srgb)': (x) => k.formatHex(x),
				'toGamut css (oklch)': (x) => gamut(x),
				// culori has no one-call mix: an interpolator is built per pair, as color-mix() would.
				'mix oklab': (x, y) => k.interpolate([x, y], 'oklab')(0.5),
				'contrast wcag2': (x, y) => k.wcagContrast(x, y)
			}
		}
	}
	const j = await import('colorjs.io/fn')
	for (const sp of [j.sRGB, j.sRGB_Linear, j.HSL, j.OKLab, j.OKLCH, j.Lab, j.LCH, j.P3, j.XYZ_D65, j.XYZ_D50])
		j.ColorSpace.register(sp)
	const make = (space) => (v) => ({ space, coords: [...v], alpha: 1 })
	return {
		make: { srgb: make(j.sRGB), oklch: make(j.OKLCH), oklab: make(j.OKLab), lab: make(j.Lab), p3: make(j.P3) },
		ops: {
			parse: (s) => j.parse(s),
			'srgb -> oklch': (x) => j.to(x, j.OKLCH),
			'oklch -> srgb': (x) => j.to(x, j.sRGB),
			'srgb -> oklab': (x) => j.to(x, j.OKLab),
			'oklab -> srgb': (x) => j.to(x, j.sRGB),
			'srgb -> lab': (x) => j.to(x, j.Lab),
			'lab -> srgb': (x) => j.to(x, j.sRGB),
			'srgb -> display-p3': (x) => j.to(x, j.P3),
			'display-p3 -> srgb': (x) => j.to(x, j.sRGB),
			'toCss (oklch)': (x) => j.serialize(x),
			'toHex (srgb)': (x) => j.serialize(x, { format: 'hex' }),
			// colorjs.io's toGamut writes the result into its input; a fresh copy keeps every call mapping.
			'toGamut css (oklch)': (x) =>
				j.toGamut({ space: x.space, coords: [...x.coords], alpha: 1 }, { space: j.sRGB, method: 'css' }),
			'mix oklab': (x, y) => j.mix(x, y, 0.5, { space: j.OKLab }),
			'contrast wcag2': (x, y) => j.contrastWCAG21(x, y)
		}
	}
}

// Which inputs each operation takes.
const INPUT = {
	parse: 'strings',
	'srgb -> oklch': 'srgb',
	'oklch -> srgb': 'oklch',
	'srgb -> oklab': 'srgb',
	'oklab -> srgb': 'oklab',
	'srgb -> lab': 'srgb',
	'lab -> srgb': 'lab',
	'srgb -> display-p3': 'srgb',
	'display-p3 -> srgb': 'p3',
	'toCss (oklch)': 'oklch',
	'toHex (srgb)': 'srgb',
	'toGamut css (oklch)': 'oklch',
	'mix oklab': 'srgb2',
	'contrast wcag2': 'srgb2',
	'findContrast 4.5': 'srgb',
	'createScale tailwind-11': 'srgb',
	semanticPalette: 'srgb'
}
const OPS = Object.keys(INPUT)

function measure(fn, xs, ys) {
	let sink = 0
	const n = xs.length
	const run = (iterations) => {
		for (let k = 0; k < iterations; k++) {
			const i = k % n
			const r = ys ? fn(xs[i], ys[i]) : fn(xs[i])
			sink += typeof r === 'number' ? r : r === undefined ? 0 : 1
		}
	}
	// Calibrate a batch to about 10 ms, then warm up.
	let batch = 1
	for (;;) {
		const t = performance.now()
		run(batch)
		if (performance.now() - t > 10) break
		batch *= 2
	}
	const until = performance.now() + WARMUP_MS
	while (performance.now() < until) run(batch)
	const rates = []
	for (let s = 0; s < SAMPLES; s++) {
		let count = 0
		const start = performance.now()
		let now = start
		while (now - start < SAMPLE_MS) {
			run(batch)
			count += batch
			now = performance.now()
		}
		rates.push((count * 1000) / (now - start))
	}
	rates.sort((a, b) => a - b)
	// Keeps the results alive, so the engine cannot skip the work.
	globalThis.benchSink = sink
	return { hz: rates[2], min: rates[0], max: rates[SAMPLES - 1] }
}

async function child(name, lib, filter) {
	const a = await adapters(name, lib)
	const inputs = {
		strings: STRINGS,
		srgb: srgbIn.map(a.make.srgb),
		oklch: oklchIn.map(a.make.oklch),
		oklab: oklabIn.map(a.make.oklab),
		lab: labIn.map(a.make.lab),
		p3: p3In.map(a.make.p3)
	}
	const pairsB = [...inputs.srgb.slice(1), inputs.srgb[0]]
	const out = {}
	for (const op of OPS) {
		if (filter && !op.includes(filter)) continue
		const fn = a.ops[op]
		if (!fn) continue
		const kind = INPUT[op]
		out[op] = kind === 'srgb2' ? measure(fn, inputs.srgb, pairsB) : measure(fn, inputs[kind])
	}
	process.stdout.write(JSON.stringify(out))
}

const print = (line) => process.stdout.write(`${line}\n`)
const fmt = (hz) =>
	hz >= 1e6 ? `${(hz / 1e6).toFixed(2)} M` : hz >= 1e3 ? `${(hz / 1e3).toFixed(1)} k` : `${hz.toFixed(1)} `

async function main() {
	const filter = opt('--filter')
	const lib = opt('--lib') ?? fileURLToPath(new URL('../esm', import.meta.url))
	if (opt('--child')) return child(opt('--child'), lib, filter)
	const self = fileURLToPath(import.meta.url)
	const results = {}
	const libs = opt('--only') ? [opt('--only')] : LIBS
	for (const name of libs) {
		const extra = filter ? ['--filter', filter] : []
		const raw = execFileSync(process.execPath, [self, '--child', name, '--lib', lib, ...extra], {
			encoding: 'utf8',
			maxBuffer: 1 << 24
		})
		results[name] = JSON.parse(raw)
	}
	const env = { node: process.version, cpu: os.cpus()[0]?.model.trim(), platform: `${os.platform()} ${os.arch()}` }
	if (args.includes('--json')) return void process.stdout.write(`${JSON.stringify({ env, results }, null, 2)}\n`)
	print(`Node ${env.node}, ${env.cpu}, ${env.platform}. ops/sec, median of ${SAMPLES} (spread min..max).\n`)
	print(`| operation | ${libs.join(' | ')} |`)
	print(`| --- | ${libs.map(() => '---:').join(' | ')} |`)
	for (const op of OPS) {
		if (filter && !op.includes(filter)) continue
		const cells = libs.map((n) => {
			const r = results[n][op]
			return r ? `${fmt(r.hz)} (±${(((r.max - r.min) / r.hz) * 50).toFixed(0)}%)` : 'n/a'
		})
		print(`| ${op} | ${cells.join(' | ')} |`)
	}
}

await main()
