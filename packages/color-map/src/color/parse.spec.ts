import Colorjs from 'colorjs.io'
import { convert, parse } from './index.js'
import { hexOf } from './test-utils.js'

describe('parse', () => {
	test.each([
		['#f00', 'srgb', [1, 0, 0], undefined],
		['#F008', 'srgb', [1, 0, 0], 0x88 / 255],
		['#ff0000', 'srgb', [1, 0, 0], undefined],
		['#ff000080', 'srgb', [1, 0, 0], 0x80 / 255],
		['red', 'srgb', [1, 0, 0], undefined],
		['RebeccaPurple', 'srgb', [0.4, 0.2, 0.6], undefined],
		['transparent', 'srgb', [0, 0, 0], 0],
		['rgb(255 0 0)', 'srgb', [1, 0, 0], undefined],
		['rgb(255, 0, 0)', 'srgb', [1, 0, 0], undefined],
		['rgba(255, 0, 0, 0.5)', 'srgb', [1, 0, 0], 0.5],
		['rgb(100% 50% 0% / 25%)', 'srgb', [1, 0.5, 0], 0.25],
		['rgb(none 0 0 / none)', 'srgb', [null, 0, 0], null],
		['hsl(120deg 100% 50%)', 'hsl', [120, 100, 50], undefined],
		['hsl(120, 100%, 50%)', 'hsl', [120, 100, 50], undefined],
		['hsla(0.5turn, 50%, 50%, 0.3)', 'hsl', [180, 50, 50], 0.3],
		['hsl(100grad 50 50)', 'hsl', [90, 50, 50], undefined],
		['hsl(3.14159265358979rad 50% 50%)', 'hsl', [180, 50, 50], undefined],
		['hwb(120 10% 20%)', 'hwb', [120, 10, 20], undefined],
		['lab(50% 40 59.5)', 'lab', [50, 40, 59.5], undefined],
		['lab(50% 100% -100%)', 'lab', [50, 125, -125], undefined],
		['lch(50 100% 120)', 'lch', [50, 150, 120], undefined],
		['oklab(0.5 0.1 -0.1)', 'oklab', [0.5, 0.1, -0.1], undefined],
		['oklab(50% 100% -50%)', 'oklab', [0.5, 0.4, -0.2], undefined],
		['oklch(70% 0.1 200 / 0.5)', 'oklch', [0.7, 0.1, 200], 0.5],
		['oklch(none none none)', 'oklch', [null, null, null], undefined],
		['color(display-p3 1 0.5 0)', 'display-p3', [1, 0.5, 0], undefined],
		['color(srgb 50% 50% 50% / 50%)', 'srgb', [0.5, 0.5, 0.5], 0.5],
		['color(xyz 0.1 0.2 0.3)', 'xyz-d65', [0.1, 0.2, 0.3], undefined],
		['color(xyz-d50 0.1 0.2 0.3)', 'xyz-d50', [0.1, 0.2, 0.3], undefined],
		['color(prophoto-rgb 1 1 1)', 'prophoto-rgb', [1, 1, 1], undefined],
		['  RGB(1e2 0 0)  ', 'srgb', [100 / 255, 0, 0], undefined],
		['rgb(+.5e1 -5 0)', 'srgb', [5 / 255, -5 / 255, 0], undefined]
	])('%s', (input, colorSpace, components, alpha) => {
		const color = parse(input)
		expect(color.colorSpace).toBe(colorSpace)
		components.forEach((v, i) => {
			if (v === null) expect(color.components[i]).toBeNull()
			else expect(color.components[i]).toBeCloseTo(v, 10)
		})
		expect(color.alpha).toEqual(alpha)
	})

	test('clamps what the spec clamps', () => {
		expect(parse('lab(150 0 0)').components[0]).toBe(100)
		expect(parse('lch(-5 -5 0)').components).toEqual([0, 0, 0])
		expect(parse('oklab(2 0 0)').components[0]).toBe(1)
		expect(parse('hsl(0 -10% 50%)').components[1]).toBe(0)
		expect(parse('rgb(0 0 0 / 2)').alpha).toBe(1)
		expect(parse('rgb(0 0 0 / -1)').alpha).toBe(0)
	})

	test('keeps out-of-gamut rgb', () => {
		expect(parse('rgb(300 0 0)').components[0]).toBeGreaterThan(1)
	})

	test.each([
		['#12', 'invalid hex color'],
		['#12345', 'invalid hex color'],
		['#1234567', 'invalid hex color'],
		['#ggg', 'invalid hex color'],
		['rgb(1 2)', 'expected 3 components, got 2'],
		['rgb(1, 2, 3, 4, 5)', 'expected 3 components, got 5'],
		['rgb(1 2 3 / 4 / 5)', 'more than one "/"'],
		['rgb(1, 2, 3 / 0.5)', 'cannot mix'],
		['rgb(1, none, 3)', '"none" is not allowed'],
		['rgb(1, 2%, 3)', 'mixed numbers and percentages'],
		['hsl(10%, 2%, 3%)', 'mixed numbers and percentages'],
		['lab(1, 2, 3)', 'only for rgb() and hsl()'],
		['color(srgb, 1, 0, 0)', 'only for rgb() and hsl()'],
		['color(foo 1 2 3)', 'unknown color space "foo"'],
		['color()', 'unknown color space'],
		['foo(1 2 3)', 'unknown function "foo"'],
		['rgb(a b c)', 'invalid value "a"'],
		['rgb(1px 2 3)', 'invalid value "1px"'],
		['hsl(10foo 50% 50%)', 'invalid angle "10foo"'],
		['rgb(1 2 3 / x)', 'invalid value "x"'],
		['currentcolor', 'needs a context to resolve'],
		['canvastext', 'needs a context to resolve'],
		['notacolor', 'not a color'],
		['', 'not a color']
	])('rejects %s', (input, message) => {
		expect(() => parse(input)).toThrow(message)
	})

	test('errors name the input', () => {
		expect(() => parse('rgb(a 0 0)')).toThrow('cannot parse "rgb(a 0 0)"')
	})
})

describe('parse agrees with colorjs.io', () => {
	test.each([
		'#336699',
		'#33669980',
		'tomato',
		'rgb(10 200 30 / 0.4)',
		'hsl(210 50% 40%)',
		'hwb(210 11% 21%)',
		'lab(60 30 -20)',
		'lch(60 40 250)',
		'oklab(0.6 0.1 -0.05)',
		'oklch(0.6 0.15 250)',
		'color(display-p3 0.2 0.4 0.9)',
		'color(rec2020 0.2 0.4 0.9)',
		'color(xyz-d65 0.2 0.3 0.4)'
	])('%s', (input) => {
		const ours = parse(input)
		const theirs = new Colorjs(input)
		const space = ours.colorSpace === 'display-p3' ? 'p3' : ours.colorSpace
		const coords = theirs.to(space).coords
		ours.components.forEach((v, i) => {
			expect(v as number).toBeCloseTo(coords[i] as number, 6)
		})
		expect(ours.alpha ?? 1).toBeCloseTo(theirs.alpha, 6)
		expect(hexOf(convert(ours, 'srgb').components as number[])).toBe(hexOf(theirs.to('srgb').coords as number[]))
	})
})
