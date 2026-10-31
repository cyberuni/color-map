import { type Color, deltaEOK, mix, parse } from '../color/index.js'
import { createColorsFromMap } from '../legacy/index.js'
import { createGradient } from './index.js'

const near = (a: Color, b: Color | string) =>
	expect(deltaEOK(a, typeof b === 'string' ? parse(b) : b)).toBeLessThan(1e-6)

describe('createGradient', () => {
	test('the issue example: 72 oklab colors from blue through lime at 0.6 to yellow', () => {
		const stops = [
			{ color: 'blue', at: 0 },
			{ color: 'lime', at: 0.6 },
			{ color: 'yellow', at: 1 }
		]
		const colors = createGradient(stops, 72, { in: 'oklab' })
		expect(colors).toHaveLength(72)
		expect(colors.every((c) => c.colorSpace === 'oklab')).toBe(true)
		near(colors[0] as Color, 'blue')
		near(colors[71] as Color, 'yellow')
		near(createGradient(stops, 11)[6] as Color, 'lime')
	})

	test('two stops give what mix gives, evenly spaced, in oklab by default', () => {
		const colors = createGradient(['blue', 'lime'], 5)
		expect(colors).toEqual([0, 0.25, 0.5, 0.75, 1].map((t) => mix('blue', 'lime', t)))
	})

	test('in and hue pass through to mix', () => {
		const options = { in: 'oklch', hue: 'longer' } as const
		expect(createGradient(['red', 'blue'], 3, options)[1]).toEqual(mix('red', 'blue', 0.5, options))
		expect(createGradient(['red', 'blue'], 3, options)[1]).not.toEqual(mix('red', 'blue', 0.5, { in: 'oklch' }))
	})

	test('stops can be color objects, bare or in a stop', () => {
		const red = parse('red')
		const blue = parse('blue')
		expect(createGradient([red, { color: blue }], 3)).toEqual(createGradient(['red', 'blue'], 3))
	})

	test('stops without a position spread evenly, as in CSS', () => {
		const colors = createGradient(['red', 'lime', 'blue'], 5)
		near(colors[2] as Color, 'lime')
		// white and gray fall at 0.3 and 0.6, between red at 0 and black at 0.9.
		const run = createGradient([{ color: 'red', at: 0 }, 'white', 'gray', { color: 'black', at: 0.9 }], 11)
		near(run[3] as Color, 'white')
		near(run[6] as Color, 'gray')
		near(run[9] as Color, 'black')
		near(run[10] as Color, 'black')
	})

	test('the first and last colors hold outside the stops', () => {
		const colors = createGradient(
			[
				{ color: 'red', at: 0.25 },
				{ color: 'blue', at: 0.75 }
			],
			5
		)
		near(colors[0] as Color, 'red')
		near(colors[1] as Color, 'red')
		near(colors[3] as Color, 'blue')
		near(colors[4] as Color, 'blue')
	})

	test('a position before an earlier one moves up to it, making a hard stop', () => {
		const colors = createGradient(
			[
				{ color: 'red', at: 0.5 },
				{ color: 'blue', at: 0.2 },
				{ color: 'lime', at: 1 }
			],
			11
		)
		near(colors[4] as Color, 'red')
		near(colors[5] as Color, 'blue')
		near(colors[10] as Color, 'lime')
	})

	test('two stops at one position switch color there, and that sample takes the later stop', () => {
		const colors = createGradient(
			[
				{ color: 'red', at: 0.5 },
				{ color: 'blue', at: 0.5 }
			],
			3
		)
		near(colors[0] as Color, 'red')
		near(colors[1] as Color, 'blue')
		near(colors[2] as Color, 'blue')
	})

	test("alpha comes from each stop's color and is premultiplied", () => {
		const [start, middle, end] = createGradient(['rgb(0 0 255 / 0)', 'rgb(255 0 0)'], 3, { in: 'srgb' })
		expect(start?.alpha).toBe(0)
		// A transparent stop adds no color, so halfway is red at half alpha.
		expect(middle?.alpha).toBe(0.5)
		expect(middle?.components).toEqual([1, 0, 0])
		expect(end).toEqual({ colorSpace: 'srgb', components: [1, 0, 0] })
	})

	test('{ in: "srgb" } comes within rounding of createColorsFromMap', () => {
		const legacy = createColorsFromMap(
			[
				{ index: 0, rgb: [0, 128, 102] },
				{ index: 1, rgb: [255, 255, 102] }
			],
			60
		)
		const colors = createGradient(['rgb(0 128 102)', 'rgb(255 255 102)'], 60, { in: 'srgb' })
		for (const [i, c] of colors.entries()) {
			for (const [k, v] of c.components.entries()) {
				expect(Math.abs((v as number) * 255 - (legacy[i]?.[k] as number))).toBeLessThanOrEqual(0.5)
			}
		}
	})

	test('rejects fewer than 2 stops, a bad count and a bad position', () => {
		expect(() => createGradient(['red'], 5)).toThrow('a gradient needs at least 2 stops, got 1')
		expect(() => createGradient(['red', 'blue'], 1)).toThrow('count must be an integer of at least 2, got 1')
		expect(() => createGradient(['red', 'blue'], 2.5)).toThrow('count must be an integer of at least 2, got 2.5')
		expect(() => createGradient([{ color: 'red', at: Number.NaN }, 'blue'], 5)).toThrow('stop 0 has a position of NaN')
	})
})
