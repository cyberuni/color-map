import Colorjs from 'colorjs.io'
import { converter, interpolate as culoriMix } from 'culori'
import { type Color, type ColorSpaceId, convert, type HueMethod, mix, parse, toCss } from './index.js'

const comps = (c: Color): (number | null)[] => c.components

describe('mix', () => {
	test('defaults to the middle, in oklab', () => {
		const m = mix('red', 'blue')
		expect(m.colorSpace).toBe('oklab')
		expect(m.alpha).toBeUndefined()
		expect(mix('red', 'blue', 0.5, { in: 'srgb' }).components).toEqual([0.5, 0, 0.5])
	})

	test('t is the weight of the second color and may extrapolate', () => {
		const opts = { in: 'srgb' as const }
		expect(mix('black', 'white', 0, opts).components).toEqual([0, 0, 0])
		expect(mix('black', 'white', 1, opts).components).toEqual([1, 1, 1])
		expect(mix('black', 'white', 2, opts).components).toEqual([2, 2, 2])
	})

	test('takes colors as objects too', () => {
		expect(mix(parse('red'), parse('blue'), 0.5, { in: 'srgb' }).components).toEqual([0.5, 0, 0.5])
	})

	test.each([
		['shorter', 10, 350, 0],
		['shorter', 350, 10, 0],
		['shorter', 10, 100, 55],
		['longer', 10, 350, 180],
		['longer', 350, 10, 180],
		['longer', 10, 100, 235],
		['longer', 100, 100, 280],
		['increasing', 10, 350, 180],
		['increasing', 350, 10, 0],
		['decreasing', 10, 350, 0],
		['decreasing', 350, 10, 180]
	] as [HueMethod, number, number, number][])('%s hue from %s to %s is %s', (hue, h1, h2, expected) => {
		const m = mix(
			{ colorSpace: 'hsl', components: [h1, 50, 50] },
			{ colorSpace: 'hsl', components: [h2, 50, 50] },
			0.5,
			{ in: 'hsl', hue }
		)
		expect(m.components[0]).toBeCloseTo(expected, 10)
	})

	test('premultiplies alpha', () => {
		const m = mix('rgb(255 0 0 / 0.5)', 'rgb(0 0 255)', 0.5, { in: 'srgb' })
		expect(m.alpha).toBe(0.75)
		expect(m.components[0]).toBeCloseTo(1 / 3, 10)
		expect(m.components[2]).toBeCloseTo(2 / 3, 10)
	})

	test('divides nothing when the result is fully transparent', () => {
		const m = mix('rgb(255 0 0 / 0)', 'rgb(0 0 255 / 0)', 0.5, { in: 'srgb' })
		expect(m.alpha).toBe(0)
		expect(m.components).toEqual([0, 0, 0])
	})

	test('does not premultiply the hue', () => {
		const m = mix('hsl(0 50% 50% / 0.2)', 'hsl(100 50% 50%)', 0.5, { in: 'hsl' })
		expect(m.components[0]).toBe(50)
	})

	test('none takes the other color value', () => {
		const m = mix('oklch(0.5 none 350)', 'oklch(0.7 0.1 20)', 0.5, { in: 'oklch' })
		expect(comps(m)).toEqual([0.6, 0.1, expect.closeTo(5, 10)])
		expect(comps(mix('oklch(none 0.2 none)', 'oklch(0.7 0.1 none)', 0.5, { in: 'oklch' }))).toEqual([
			0.7,
			expect.closeTo(0.15, 10),
			null
		])
	})

	test('none alpha takes the other alpha, and stays none when both are none', () => {
		expect(mix('rgb(0 0 0 / none)', 'rgb(0 0 0 / 0.4)', 0.5, { in: 'srgb' }).alpha).toBe(0.4)
		expect(mix('rgb(0 0 0 / 0.4)', 'rgb(0 0 0 / none)', 0.5, { in: 'srgb' }).alpha).toBe(0.4)
		const both = mix('rgb(100 0 0 / none)', 'rgb(0 0 0 / none)', 0.5, { in: 'srgb' })
		expect(both.alpha).toBeNull()
		expect(both.components[0]).toBeCloseTo(50 / 255, 10)
	})

	test('none carries to the analogous component in another space', () => {
		const lightnessNone = mix('oklch(none 0.1 100)', 'rgb(0 0 255)', 0.5, { in: 'oklab' })
		expect(lightnessNone.components[0]).toBeCloseTo(convert(parse('rgb(0 0 255)'), 'oklab').components[0] as number, 10)
		const hueNone = mix('hsl(none 50% 50%)', 'oklch(0.5 0.1 200)', 0.5, { in: 'lch' })
		expect(hueNone.components[2]).not.toBeNull()
		const hueCarried = mix('hsl(none 50% 50%)', 'hsl(120 50% 50%)', 0.5, { in: 'oklch' })
		expect(hueCarried.components[2]).not.toBeNull()
		expect(mix('hsl(none 50% 50%)', 'oklch(0.5 0.1 200)', 0.5, { in: 'oklch' }).components[2]).toBe(200)
		expect(mix('rgb(none 0 0)', 'rgb(0 0 0)', 0.5, { in: 'display-p3' }).components[0]).toBeCloseTo(0, 5)
	})
})

describe('mix agrees with colorjs.io', () => {
	test.each([
		['red', 'blue', 0.5, 'srgb', 'shorter'],
		['peru', 'palegoldenrod', 0.6, 'lch', 'shorter'],
		['rgb(255 0 0 / 0.5)', 'rgb(0 0 255)', 0.3, 'srgb', 'shorter'],
		['oklch(0.5 0.2 350)', 'oklch(0.7 0.1 20)', 0.25, 'oklch', 'shorter'],
		['hsl(0 50% 50%)', 'hsl(200 50% 50% / 0.5)', 0.25, 'hsl', 'longer'],
		['oklch(0.5 none 350)', 'oklch(0.7 0.1 20)', 0.5, 'oklch', 'shorter'],
		['hsl(10 50% 50%)', 'hsl(350 50% 50%)', 0.5, 'hsl', 'increasing'],
		['transparent', 'red', 0.5, 'srgb', 'shorter'],
		['#336699', '#cc9933', 0.7, 'oklab', 'shorter'],
		['#336699', '#cc9933', 0.7, 'display-p3', 'shorter'],
		['#336699', '#cc9933', 0.7, 'xyz-d50', 'shorter'],
		['#336699', '#cc9933', 0.2, 'hwb', 'decreasing']
	] as [string, string, number, ColorSpaceId, HueMethod][])('%s + %s in %s', (a, b, t, space, hue) => {
		const ours = mix(a, b, t, { in: space, hue })
		const id = space === 'display-p3' ? 'p3' : space
		const theirs = Colorjs.mix(a, b, t, { space: id, hue, premultiplied: true })
		const expected = theirs.to(id)
		ours.components.forEach((v, i) => {
			const w = expected.coords[i]
			if (v === null) expect(Number.isNaN(w)).toBe(true)
			else if (i === ({ hsl: 0, hwb: 0, lch: 2, oklch: 2 } as Record<string, number>)[space]) {
				const d = Math.abs(((v - (w as number)) % 360) + 360) % 360
				expect(Math.min(d, 360 - d)).toBeLessThan(1e-5)
			} else expect(v).toBeCloseTo(w as number, 5)
		})
		expect(ours.alpha ?? 1).toBeCloseTo(theirs.alpha, 8)
	})

	test('and with culori in oklab', () => {
		const ours = convert(mix('#336699', '#cc9933', 0.4, { in: 'oklab' }), 'srgb').components as number[]
		const theirs = converter('rgb')(culoriMix(['#336699', '#cc9933'], 'oklab')(0.4)) as {
			r: number
			g: number
			b: number
		}
		expect(ours[0]).toBeCloseTo(theirs.r, 5)
		expect(ours[1]).toBeCloseTo(theirs.g, 5)
		expect(ours[2]).toBeCloseTo(theirs.b, 5)
	})
})

describe('serializes mix results', () => {
	test('in srgb', () => {
		expect(toCss(mix('red', 'blue', 0.5, { in: 'srgb' }))).toBe('rgb(127.5, 0, 127.5)')
	})
})
