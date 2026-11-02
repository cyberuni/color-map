import { convert, deltaEOk, inGamut, toGamut } from './index.js'
import type { Color, ColorSpaceId, Component } from './types.js'

/**
 * The generic search of CSS Color 4 section 13.2 as `toGamut` ran before it had
 * a linear-sRGB path for `srgb`: every step through `convert`, `inGamut` and
 * `deltaEOk`. The fast path must agree with it.
 */
function reference(color: Color): Color {
	if (inGamut(color)) return color
	const withAlpha = (c: Color, from: Color): Color => {
		if (from.alpha !== undefined) c.alpha = from.alpha
		return c
	}
	const back = (c: Color): Color => convert(c, color.colorSpace as ColorSpaceId)
	const clipped = (c: Color): Color =>
		withAlpha(
			{
				colorSpace: 'srgb',
				components: convert(c, 'srgb').components.map((v) => Math.min(1, Math.max(0, v as number)))
			},
			c
		)
	const origin = convert(color, 'oklch')
	const [lightness, chroma, hue] = origin.components as [number, number, Component]
	if (lightness >= 1) return back(withAlpha({ colorSpace: 'srgb', components: [1, 1, 1] }, color))
	if (lightness <= 0) return back(withAlpha({ colorSpace: 'srgb', components: [0, 0, 0] }, color))
	const JND = 0.02
	const EPSILON = 0.0001
	let min = 0
	let max = chroma
	let minInGamut = true
	let clip = clipped(origin)
	if (deltaEOk(clip, origin) < JND) return back(clip)
	while (max - min > EPSILON) {
		const mid = (min + max) / 2
		const current = withAlpha({ colorSpace: 'oklch', components: [lightness, mid, hue] }, origin)
		if (minInGamut && inGamut(current)) {
			min = mid
			continue
		}
		clip = clipped(current)
		const e = deltaEOk(clip, current)
		if (e < JND) {
			if (JND - e < EPSILON) return back(clip)
			minInGamut = false
			min = mid
		} else max = mid
	}
	return back(clip)
}

let seed = 11
const rand = () => {
	seed = (seed * 1664525 + 1013904223) >>> 0
	return seed / 2 ** 32
}
const EDGES = [0, 1, -0.5, 1.5, Number.NaN, 1e6, 1e-9, null]
const edgy = (x: number): Component => (rand() < 0.1 ? (EDGES[Math.floor(rand() * EDGES.length)] as Component) : x)
const SPACES = ['oklab', 'lch', 'lab', 'display-p3', 'rec2020', 'srgb', 'hsl', 'xyz-d65', 'a98-rgb'] as const

function sample(): Color {
	const space = rand() < 0.6 ? 'oklch' : SPACES[Math.floor(rand() * SPACES.length)]
	const components =
		space === 'oklch'
			? [edgy(rand()), edgy(rand() < 0.1 ? rand() * 5 : rand() * 0.5), edgy(rand() * 360)]
			: [edgy(rand() * 1.2 - 0.1), edgy(rand() * 1.2 - 0.1), edgy(rand() * 360)]
	const color: Color = { colorSpace: space, components }
	if (rand() < 0.2) color.alpha = edgy(rand() * 1.4 - 0.2)
	return color
}

const same = (x: Component | undefined, y: Component | undefined): boolean =>
	Object.is(x, y) || (typeof x === 'number' && typeof y === 'number' && Math.abs(x - y) <= 1e-7)

describe('toGamut for srgb, against the generic search', () => {
	test.each([
		['achromatic gray', 'oklch', [0.5, 0, 0]],
		['L at 0', 'oklch', [0, 0.3, 120]],
		['L at 1', 'oklch', [1, 0.3, 120]],
		['L above 1', 'oklch', [1.2, 0.3, 120]],
		['L below 0', 'oklch', [-0.2, 0.3, 120]],
		['NaN chroma', 'oklch', [0.6, Number.NaN, 120]],
		['NaN lightness', 'oklch', [Number.NaN, 0.3, 120]],
		['NaN hue', 'oklch', [0.6, 0.3, Number.NaN]],
		['huge chroma', 'oklch', [0.6, 1e6, 200]],
		['none hue', 'oklch', [0.6, 0.4, null]],
		['none chroma', 'oklch', [0.6, null, 90]],
		['none lightness', 'oklch', [null, 0.4, 90]],
		['negative chroma', 'oklch', [0.6, -0.3, 90]],
		['p3 green', 'display-p3', [0, 1, 0]]
	] as const)('%s', (_name, space, components) => {
		const color: Color = { colorSpace: space, components: [...components] }
		const got = toGamut(color)
		const want = reference(color)
		expect(got.colorSpace).toBe(want.colorSpace)
		for (const [i, c] of got.components.entries()) expect(same(c, want.components[i])).toBe(true)
	})

	test.each([[undefined], [0], [0.5], [1], [-1], [2], [Number.NaN], [null]])(
		'out-of-range alpha %s is kept',
		(alpha) => {
			const color: Color = { colorSpace: 'oklch', components: [0.7, 0.4, 150], alpha: alpha as number }
			const got = toGamut(color)
			const want = reference(color)
			expect(Object.is(got.alpha, want.alpha)).toBe(true)
		}
	)

	test('4000 seeded colors, edge cases included', () => {
		for (let i = 0; i < 4000; i++) {
			const color = sample()
			const got = toGamut(color)
			const want = reference(color)
			expect(got.colorSpace).toBe(want.colorSpace)
			expect(Object.is(got.alpha, want.alpha)).toBe(true)
			for (const [j, c] of got.components.entries()) {
				if (!same(c, want.components[j])) expect.soft({ color, got, want }).toBeUndefined()
			}
		}
	})
})
