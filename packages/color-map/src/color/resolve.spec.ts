import Colorjs from 'colorjs.io'
import { type ColorExpr, convert, equals, mix, parse, parseExpr, resolve, toCss, toHex } from './index.js'

const css = (input: string, context = {}): string => toCss(resolve(input, context))

describe('parseExpr', () => {
	test('a concrete color comes back as a color', () => {
		expect(parseExpr(' RED ')).toEqual(parse('red'))
	})

	test('values that need a context become nodes', () => {
		expect(parseExpr('currentColor')).toEqual({ type: 'currentcolor' })
		expect(parseExpr('ButtonText')).toEqual({ type: 'system', name: 'buttontext' })
		expect(parseExpr('light-dark(white, #000)')).toEqual({
			type: 'light-dark',
			light: parse('white'),
			dark: parse('#000')
		})
		expect(parseExpr('contrast-color(red)')).toEqual({ type: 'contrast-color', color: parse('red') })
	})

	test('color-mix() keeps what was written', () => {
		expect(parseExpr('color-mix(in oklch longer hue, red 30%, 20% blue)')).toEqual({
			type: 'color-mix',
			space: 'oklch',
			hue: 'longer',
			items: [
				{ color: parse('red'), percent: 30 },
				{ color: parse('blue'), percent: 20 }
			]
		})
		expect(parseExpr('color-mix(in xyz, rgb(1 2 3) , currentcolor)')).toEqual({
			type: 'color-mix',
			space: 'xyz-d65',
			items: [{ color: parse('rgb(1 2 3)') }, { color: { type: 'currentcolor' } }]
		})
	})

	test('relative colors keep their channels as text', () => {
		expect(parseExpr('oklch(from red calc(l + 0.1) c h / calc(alpha / 2))')).toEqual({
			type: 'relative',
			fn: 'oklch',
			space: 'oklch',
			from: parse('red'),
			channels: ['calc(l + 0.1)', 'c', 'h'],
			alpha: 'calc(alpha / 2)'
		})
		expect(parseExpr('rgba(from red r g b)')).toMatchObject({ fn: 'rgb', space: 'srgb' })
		expect(parseExpr('hsla(from red h s l)')).toMatchObject({ fn: 'hsl', space: 'hsl' })
		expect(parseExpr('color(from red display-p3 r g b)')).toMatchObject({ fn: 'color', space: 'display-p3' })
	})

	test.each([
		['color-mix(red, blue)', 'needs "in <space>"'],
		['color-mix(in foo, red, blue)', 'needs "in <space>"'],
		['color-mix(in oklch longer, red, blue)', 'invalid hue interpolation'],
		['color-mix(in oklch sideways hue, red, blue)', 'invalid hue interpolation'],
		['foo(from red)', 'unknown function "foo"'],
		['color-mix(in oklch, red)', 'needs two colors, got 1'],
		['color-mix(in oklch, red 10% 20%, blue)', 'invalid color-mix() item'],
		['color-mix(in oklch, 10%, blue)', 'invalid color-mix() item'],
		['color-mix(in oklch, red blue, blue)', 'invalid color-mix() item'],
		['color-mix(in oklch, red -10%, blue)', 'negative percentage'],
		['light-dark(red)', 'needs two colors, got 1'],
		['rgb(from)', 'missing origin color'],
		['color(from red foo r g b)', 'unknown color space "foo"'],
		['rgb(from red r g)', 'expected 3 components, got 2'],
		['rgb(from red r g b 5)', 'expected "/ alpha"'],
		['rgb(from red r g b / 1 2)', 'expected "/ alpha"'],
		['rgb(from red calc(r g b)', 'unbalanced parentheses'],
		['rgb(from red calc(r, g, b)', 'unbalanced parentheses'],
		['color-mix(in oklch, rgb(1 2 3, blue)', 'unbalanced parentheses'],
		['color-mix(in oklch, red) blue', 'not a color'],
		['color-mix(in oklch, red))', 'not a color']
	])('rejects %s', (input, message) => {
		expect(() => parseExpr(input)).toThrow(message)
	})
})

describe('resolve color-mix()', () => {
	test.each([
		['color-mix(in srgb, red, blue)', 'rgb(127.5, 0, 127.5)'],
		['color-mix(in srgb, red 25%, blue)', 'rgb(63.75, 0, 191.25)'],
		['color-mix(in srgb, red, blue 25%)', 'rgb(191.25, 0, 63.75)'],
		['color-mix(in srgb, red 100%, blue 300%)', 'rgb(63.75, 0, 191.25)'],
		['color-mix(in srgb, red 30%, blue 30%)', 'rgba(127.5, 0, 127.5, 0.6)'],
		['color-mix(in srgb, red 0%, blue)', 'rgb(0, 0, 255)'],
		['color-mix(in srgb, transparent, red)', 'rgba(255, 0, 0, 0.5)'],
		['color-mix(in srgb, rgb(0 0 0 / none) 20%, red 20%)', 'rgba(127.5, 0, 0, 0.4)'],
		['color-mix(in hsl, hsl(120deg 40% 40%), hsl(240deg 60% 60%))', 'hsl(180, 50%, 50%)'],
		['color-mix(in hsl longer hue, hsl(120deg 40% 40%), hsl(240deg 60% 60%))', 'hsl(0, 50%, 50%)']
	])('%s', (input, expected) => {
		expect(css(input)).toBe(expected)
	})

	test('rejects percentages that add up to nothing', () => {
		expect(() => resolve('color-mix(in srgb, red 0%, blue 0%)')).toThrow('add up to more than 0')
	})

	test('keeps a none alpha none', () => {
		const m = resolve('color-mix(in srgb, rgb(1 1 1 / none) 20%, rgb(1 1 1 / none) 20%)')
		expect(m.alpha).toBeNull()
	})

	test.each([
		['color-mix(in oklab, #336699, #cc9933)', '#336699', '#cc9933', 0.5, 'oklab'],
		['color-mix(in lch, peru 40%, palegoldenrod)', 'peru', 'palegoldenrod', 0.6, 'lch'],
		['color-mix(in oklch, #336699 30%, #cc9933 70%)', '#336699', '#cc9933', 0.7, 'oklch'],
		[
			'color-mix(in srgb-linear, rgb(255 0 0 / 0.4), rgb(0 0 255 / 0.9))',
			'rgb(255 0 0 / 0.4)',
			'rgb(0 0 255 / 0.9)',
			0.5,
			'srgb-linear'
		],
		[
			'color-mix(in lab, color(display-p3 1 0 0), oklch(0.5 0.1 100))',
			'color(display-p3 1 0 0)',
			'oklch(0.5 0.1 100)',
			0.5,
			'lab'
		]
	])('agrees with colorjs.io for %s', (input, a, b, t, space) => {
		const ours = convert(resolve(input), 'srgb')
		const theirs = Colorjs.mix(a, b, t, { space, premultiplied: true }).to('srgb')
		;(ours.components as number[]).forEach((v, i) => {
			expect(v).toBeCloseTo(theirs.coords[i] as number, 5)
		})
		expect(ours.alpha ?? 1).toBeCloseTo(theirs.alpha, 8)
	})

	test('mixes nested expressions and context', () => {
		const m = resolve('color-mix(in srgb, currentcolor, light-dark(white, black))', {
			currentColor: 'red',
			colorScheme: 'dark'
		})
		expect(toCss(m)).toBe('rgb(127.5, 0, 0)')
		expect(equals(m, mix('red', 'black', 0.5, { in: 'srgb' }))).toBe(true)
	})
})

describe('resolve light-dark(), currentcolor, system colors', () => {
	test('light-dark() follows the color scheme', () => {
		expect(css('light-dark(white, black)')).toBe('rgb(255, 255, 255)')
		expect(css('light-dark(white, black)', { colorScheme: 'light' })).toBe('rgb(255, 255, 255)')
		expect(css('light-dark(white, black)', { colorScheme: 'dark' })).toBe('rgb(0, 0, 0)')
	})

	test('currentcolor and system colors read the context', () => {
		expect(css('currentcolor', { currentColor: '#ff0000' })).toBe('rgb(255, 0, 0)')
		expect(css('currentcolor', { currentColor: parse('lime') })).toBe('rgb(0, 255, 0)')
		expect(css('canvas', { systemColors: { canvas: 'white' } })).toBe('rgb(255, 255, 255)')
	})

	test('a missing entry throws and names the value', () => {
		expect(() => resolve('currentcolor')).toThrow('needs currentColor to resolve')
		expect(() => resolve('canvastext')).toThrow('needs systemColors.canvastext to resolve')
		expect(() => resolve('canvastext', { systemColors: {} })).toThrow('systemColors.canvastext')
		expect(() => resolve('currentcolor', { currentColor: 'currentcolor' })).toThrow('needs currentColor')
	})

	test('takes colors and nodes as they are', () => {
		const red = parse('red')
		expect(resolve(red)).toBe(red)
		const node: ColorExpr = { type: 'light-dark', light: red, dark: parse('blue') }
		expect(resolve(node, { colorScheme: 'dark' })).toEqual(parse('blue'))
	})
})

describe('resolve contrast-color()', () => {
	test.each([
		['white', 'black'],
		['yellow', 'black'],
		['#767676', 'black'],
		['#757575', 'white'],
		['#595959', 'white'],
		['black', 'white'],
		['rebeccapurple', 'white'],
		['lightgray', 'black'],
		['#808080', 'black']
	])('on %s is %s', (background, expected) => {
		expect(toHex(resolve(`contrast-color(${background})`))).toBe(toHex(parse(expected)))
	})
})

describe('resolve relative colors', () => {
	test.each([
		['rgb(from rgb(10 20 30) r g b)', 'rgb(10, 20, 30)'],
		['rgb(from rgb(10 20 30) b g r)', 'rgb(30, 20, 10)'],
		['rgb(from rgb(10 20 30) 255 g b / 0.5)', 'rgba(255, 20, 30, 0.5)'],
		['rgb(from rgb(10 20 30 / 0.4) r g b)', 'rgba(10, 20, 30, 0.4)'],
		['rgb(from rgb(10 20 30 / 0.4) r g b / alpha)', 'rgba(10, 20, 30, 0.4)'],
		['rgb(from rgb(10 20 30 / 0.4) r g b / calc(alpha * 2))', 'rgba(10, 20, 30, 0.8)'],
		['rgb(from rgb(10 20 30) calc(r * 2) calc(g + 5) min(b, 5))', 'rgb(20, 25, 5)'],
		['rgb(from rgb(10 20 30) clamp(15, r, 25) max(g, 50) calc(b / 2))', 'rgb(15, 50, 15)'],
		['rgb(from rgb(10 20 30) calc((r + g) * 2 - 1) calc(-g) calc(+b))', 'rgb(59, -20, 30)'],
		['rgb(from rgb(10 20 30) 50% none 0)', 'rgb(127.5 none 0)'],
		['rgb(from rgb(10 20 30) r g calc(e * 10))', 'rgb(10, 20, 27.1828)'],
		['rgb(from rgb(10 20 30) r g calc(pi * 10))', 'rgb(10, 20, 31.4159)'],
		['hsl(from hsl(120 40% 50%) calc(h + 120) s l)', 'hsl(240, 40%, 50%)'],
		['hsl(from hsl(120 40% 50%) calc(h + 0.5turn) s calc(l / 2))', 'hsl(300, 40%, 25%)'],
		['hsl(from rgb(0 0 0) h s l)', 'hsl(0, 0%, 0%)'],
		['hwb(from hwb(120 10% 20%) h w b)', 'hwb(120 10% 20%)'],
		['lab(from lab(50 20 -30) calc(l + 10) a b)', 'lab(60 20 -30)'],
		['lch(from lch(50 20 30) l c calc(h + 90deg))', 'lch(50 20 120)'],
		['oklab(from oklab(0.5 0.1 -0.1) l a b)', 'oklab(0.5 0.1 -0.1)'],
		['oklch(from oklch(0.5 0.1 100) calc(l * 2) c h)', 'oklch(1 0.1 100)'],
		['color(from color(display-p3 0.2 0.4 0.6) display-p3 calc(r * 2) g b)', 'color(display-p3 0.4 0.4 0.6)'],
		['color(from color(xyz-d65 0.2 0.4 0.6) xyz-d65 z y x)', 'color(xyz-d65 0.6 0.4 0.2)'],
		['color(from color(xyz-d50 0.2 0.4 0.6) xyz-d50 x y z)', 'color(xyz-d50 0.2 0.4 0.6)'],
		['rgb(from oklch(from rgb(10 20 30) l c h) r g b / 1)', 'rgb(10, 20, 30)'],
		['hsl(from currentcolor h s l)', 'hsl(0, 100%, 50%)']
	])('%s', (input, expected) => {
		const result = toCss(resolve(input, { currentColor: 'red' }), { precision: 4 })
		expect(result).toBe(expected)
	})

	test('none components read as 0', () => {
		expect(css('rgb(from rgb(none 20 30) r g b)')).toBe('rgb(0, 20, 30)')
		expect(css('rgb(from rgb(1 2 3 / none) r g b / alpha)')).toBe('rgba(1, 2, 3, 0)')
	})

	test('agrees with colorjs.io for a lightness bump', () => {
		const ours = convert(resolve('oklch(from #3b82f6 calc(l + 0.1) c h)'), 'srgb')
		const base = new Colorjs('#3b82f6').to('oklch')
		const theirs = new Colorjs('oklch', [(base.coords[0] as number) + 0.1, base.coords[1], base.coords[2]]).to('srgb')
		;(ours.components as number[]).forEach((v, i) => {
			expect(v).toBeCloseTo(theirs.coords[i] as number, 5)
		})
	})

	test.each([
		['rgb(from red r x b)', 'unknown keyword "x"'],
		['rgb(from red r g calc(b +))', 'unexpected token ")"'],
		['rgb(from red r g calc(b 2))', 'expected ")" in calc()'],
		['rgb(from red r g calc(b # 2))', 'invalid calc() expression'],
		['rgb(from red r g calc((b)', 'unbalanced parentheses'],
		['rgb(from red r g calc(foo(b)))', 'unknown function "foo"'],
		['rgb(from red r g clamp(1, b))', 'unknown function "clamp"'],
		['rgb(from red r g calc(b * 5px))', 'units other than angles'],
		['rgb(from red r g calc(b / 0))', 'invalid value'],
		['rgb(from red r g calc(b)))', 'expected 3 components, got 5'],
		['rgb(from red r g calc(b *))', 'unexpected token ")"'],
		['rgb(from red r,g b b)', 'unexpected token ","'],
		['rgb(from red r g calc())', 'unexpected token ")"'],
		['rgb(from red r g b+)', 'unfinished calc() expression']
	])('rejects %s', (input, message) => {
		expect(() => resolve(input)).toThrow(message)
	})
})
