import { parse, toCss, toHex } from './index.js'
import type { Color } from './types.js'

describe('toCss', () => {
	test.each<[Color, string]>([
		[{ colorSpace: 'srgb', components: [1, 0, 0] }, 'rgb(255, 0, 0)'],
		[{ colorSpace: 'srgb', components: [1, 0.5, 0], alpha: 0.5 }, 'rgba(255, 127.5, 0, 0.5)'],
		[{ colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 }, 'rgb(255, 0, 0)'],
		[{ colorSpace: 'srgb', components: [null, 0, 0] }, 'rgb(none 0 0)'],
		[{ colorSpace: 'srgb', components: [1, 0, 0], alpha: null }, 'rgb(255 0 0 / none)'],
		[{ colorSpace: 'hsl', components: [120, 100, 50] }, 'hsl(120, 100%, 50%)'],
		[{ colorSpace: 'hsl', components: [120, 100, 50], alpha: 0.25 }, 'hsla(120, 100%, 50%, 0.25)'],
		[{ colorSpace: 'hsl', components: [null, 100, 50] }, 'hsl(none 100% 50%)'],
		[{ colorSpace: 'hwb', components: [120, 10, 20] }, 'hwb(120 10% 20%)'],
		[{ colorSpace: 'lab', components: [50, 40, 59.5] }, 'lab(50 40 59.5)'],
		[{ colorSpace: 'lch', components: [50, 40, 59.5] }, 'lch(50 40 59.5)'],
		[{ colorSpace: 'oklab', components: [0.5, 0.1, -0.1] }, 'oklab(0.5 0.1 -0.1)'],
		[{ colorSpace: 'oklch', components: [0.7, 0.1, 200], alpha: 0.5 }, 'oklch(0.7 0.1 200 / 0.5)'],
		[{ colorSpace: 'display-p3', components: [1, 0, 0] }, 'color(display-p3 1 0 0)'],
		[{ colorSpace: 'xyz-d65', components: [0.1, 0.2, 0.3] }, 'color(xyz-d65 0.1 0.2 0.3)'],
		[{ colorSpace: 'rec2020', components: [0, 0, 0], alpha: 0 }, 'color(rec2020 0 0 0 / 0)'],
		[{ colorSpace: 'srgb', components: [-0.00000001, 0.123456789, 1] }, 'rgb(0, 31.48148, 255)']
	])('%j', (color, css) => {
		expect(toCss(color)).toBe(css)
	})

	test('precision sets the decimals', () => {
		expect(toCss({ colorSpace: 'srgb', components: [0.5, 0.5, 0.5] }, { precision: 0 })).toBe('rgb(128, 128, 128)')
		expect(toCss({ colorSpace: 'oklch', components: [0.123456, 0.1, 10] }, { precision: 2 })).toBe('oklch(0.12 0.1 10)')
	})

	test.each([
		'rgb(10 20 30 / 0.5)',
		'hsl(120 50% 50%)',
		'lab(50 20 -30)',
		'color(a98-rgb 0.1 0.2 0.3)',
		'oklch(none 0.1 20)'
	])('%s survives parse then toCss then parse', (css) => {
		expect(parse(toCss(parse(css)))).toEqual(parse(css))
	})
})

describe('toHex', () => {
	test.each<[Color, string]>([
		[{ colorSpace: 'srgb', components: [1, 0, 0] }, '#ff0000'],
		[{ colorSpace: 'srgb', components: [0.2, 0.4, 0.6], alpha: 0.5 }, '#33669980'],
		[{ colorSpace: 'srgb', components: [2, -1, 0.5] }, '#ff0080'],
		[{ colorSpace: 'oklch', components: [1, 0, 0] }, '#ffffff'],
		[{ colorSpace: 'srgb', components: [1, 0, 0], alpha: null }, '#ff0000']
	])('%j', (color, hex) => {
		expect(toHex(color)).toBe(hex)
	})
})
