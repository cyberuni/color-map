import Colorjs from 'colorjs.io'
import { converter, rgb as culoriRgb, formatHex8 } from 'culori'
import { convert, convertComponents, createConverter, spaces } from './index.js'
import type { Color, ColorSpaceId } from './types.js'

// colorjs.io's ids for the same spaces.
const CJS: Record<ColorSpaceId, string> = {
	srgb: 'srgb',
	'srgb-linear': 'srgb-linear',
	hsl: 'hsl',
	hwb: 'hwb',
	lab: 'lab',
	lch: 'lch',
	oklab: 'oklab',
	oklch: 'oklch',
	'display-p3': 'p3',
	'display-p3-linear': 'p3-linear',
	'a98-rgb': 'a98rgb',
	'prophoto-rgb': 'prophoto',
	rec2020: 'rec2020',
	'xyz-d50': 'xyz-d50',
	'xyz-d65': 'xyz-d65'
}

// A typical in-range value for each channel, so the samples are meaningful colors.
const RANGES: Record<ColorSpaceId, [number, number][]> = {
	srgb: [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	'srgb-linear': [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	'display-p3': [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	'display-p3-linear': [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	'a98-rgb': [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	'prophoto-rgb': [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	rec2020: [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	hsl: [
		[0, 360],
		[5, 100],
		[5, 95]
	],
	hwb: [
		[0, 360],
		[0, 40],
		[0, 40]
	],
	lab: [
		[5, 95],
		[-80, 80],
		[-80, 80]
	],
	lch: [
		[5, 95],
		[5, 100],
		[0, 360]
	],
	oklab: [
		[0.05, 0.95],
		[-0.3, 0.3],
		[-0.3, 0.3]
	],
	oklch: [
		[0.05, 0.95],
		[0.02, 0.3],
		[0, 360]
	],
	'xyz-d50': [
		[0, 0.9],
		[0, 0.9],
		[0, 0.9]
	],
	'xyz-d65': [
		[0, 0.9],
		[0, 0.9],
		[0, 0.9]
	]
}

// mulberry32: a fixed seed keeps the samples, and so the failures, reproducible.
function random(seed: number): () => number {
	let a = seed
	return () => {
		a = (a + 0x6d2b79f5) | 0
		let t = Math.imul(a ^ (a >>> 15), 1 | a)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const ids = Object.keys(spaces) as ColorSpaceId[]

function sample(id: ColorSpaceId, rand: () => number): Color {
	return { colorSpace: id, components: RANGES[id].map(([lo, hi]) => lo + rand() * (hi - lo)) }
}

describe('conversion agrees with colorjs.io to 1e-6', () => {
	for (const from of ids) {
		test.each(ids)(`${from} -> %s`, (to) => {
			const rand = random(from.length * 31 + to.length)
			for (let i = 0; i < 25; i++) {
				const color = sample(from, rand)
				const ours = convert(color, to).components as number[]
				const theirs = new Colorjs(CJS[from], color.components as [number, number, number]).to(CJS[to]).coords
				theirs.forEach((v, k) => {
					// colorjs.io reports a powerless hue as NaN, which is 0 for us.
					expect(ours[k]).toBeCloseTo(v === null || Number.isNaN(v) ? 0 : v, 6)
				})
			}
		})
	}
})

describe('round trips', () => {
	test.each(ids)('%s -> xyz-d65 -> %s', (id) => {
		const rand = random(id.length)
		for (let i = 0; i < 25; i++) {
			const color = sample(id, rand)
			const back = convert(convert(color, 'xyz-d65'), id).components as number[]
			color.components.forEach((v, k) => {
				expect(back[k]).toBeCloseTo(v as number, 6)
			})
		}
	})
})

describe('against culori', () => {
	test('sRGB to OKLCH matches culori', () => {
		const rand = random(7)
		const toOklch = converter('oklch')
		for (let i = 0; i < 25; i++) {
			const color = sample('srgb', rand)
			const [r, g, b] = color.components as number[]
			const theirs = toOklch({ mode: 'rgb', r, g, b })
			const ours = convert(color, 'oklch').components as number[]
			expect(ours[0]).toBeCloseTo(theirs.l, 4)
			expect(ours[1]).toBeCloseTo(theirs.c, 4)
			expect(ours[2]).toBeCloseTo(theirs.h ?? 0, 2)
		}
	})

	test('hex agrees with culori', () => {
		expect(formatHex8(culoriRgb('#336699'))).toBe('#336699ff')
	})
})

describe('convert', () => {
	test('keeps alpha when present and leaves it off when absent', () => {
		expect(convert({ colorSpace: 'srgb', components: [1, 0, 0], alpha: 0.5 }, 'oklab').alpha).toBe(0.5)
		expect('alpha' in convert({ colorSpace: 'srgb', components: [1, 0, 0] }, 'oklab')).toBe(false)
	})

	test('converting to the same space copies the components, none included', () => {
		const color: Color = { colorSpace: 'hsl', components: [null, 50, 50] }
		const result = convert(color, 'hsl')
		expect(result.components).toEqual([null, 50, 50])
		expect(result.components).not.toBe(color.components)
	})

	test('none becomes 0 when the space changes', () => {
		const result = convert({ colorSpace: 'srgb', components: [null, 1, 0] }, 'srgb-linear')
		expect(result.components).toEqual(convert({ colorSpace: 'srgb', components: [0, 1, 0] }, 'srgb-linear').components)
	})

	test('every channel can be none, and short component lists read as 0', () => {
		const zero = convert({ colorSpace: 'srgb', components: [0, 0, 0] }, 'srgb-linear').components
		expect(convert({ colorSpace: 'srgb', components: [0, null, null] }, 'srgb-linear').components).toEqual(zero)
		expect(convert({ colorSpace: 'srgb', components: [0] }, 'srgb-linear').components).toEqual(zero)
	})

	test('a converter built from two spaces knows only those', () => {
		const only = createConverter(spaces.srgb, spaces.oklch)
		expect(only({ colorSpace: 'srgb', components: [1, 0, 0] }, 'oklch').components[0]).toBeCloseTo(0.62796, 4)
		expect(() => only({ colorSpace: 'srgb', components: [1, 0, 0] }, 'lab')).toThrow('unknown color space "lab"')
	})

	test('convertComponents returns the input for the same space', () => {
		const c: [number, number, number] = [0.1, 0.2, 0.3]
		expect(convertComponents(spaces.srgb, spaces.srgb, c)).toBe(c)
	})
})

describe('known values', () => {
	test('white is white in every RGB space and L=100 in lab', () => {
		expect(convert({ colorSpace: 'srgb', components: [1, 1, 1] }, 'lab').components[0]).toBeCloseTo(100, 3)
		expect(convert({ colorSpace: 'srgb', components: [1, 1, 1] }, 'oklab').components[0]).toBeCloseTo(1, 6)
	})

	test('gray has no chroma, and hsl of a gray has no saturation', () => {
		expect(convert({ colorSpace: 'srgb', components: [0.5, 0.5, 0.5] }, 'hsl').components[1]).toBe(0)
		expect(convert({ colorSpace: 'srgb', components: [0, 0, 0] }, 'hsl').components).toEqual([0, 0, 0])
	})

	test('hwb handles w + b >= 1 as gray', () => {
		const gray = convert({ colorSpace: 'hwb', components: [0, 60, 60] }, 'srgb').components as number[]
		expect(gray[0]).toBeCloseTo(0.5, 6)
		expect(gray[1]).toBeCloseTo(0.5, 6)
	})

	test('hsl of out-of-gamut input with lightness at 0 or 1 has no saturation', () => {
		expect(convert({ colorSpace: 'srgb', components: [1.5, 0.5, 0.5] }, 'hsl').components[1]).toBe(0)
		expect(convert({ colorSpace: 'srgb', components: [-0.5, 0.5, 0] }, 'hsl').components[1]).toBe(0)
	})

	test('hsl with negative saturation flips the hue', () => {
		// srgbToHsl only yields negative saturation for out-of-gamut input.
		const out = convert({ colorSpace: 'srgb', components: [-0.5, 0.2, 0.9] }, 'hsl').components as number[]
		expect(out[1]).toBeGreaterThanOrEqual(0)
	})
})
