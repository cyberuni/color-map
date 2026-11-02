import {
	type Color,
	contrast,
	createContrast,
	createDeltaEOK,
	createEquals,
	createFindContrast,
	createInGamut,
	createMeets,
	createMix,
	createOnColor,
	createToGamut,
	createToHex,
	deltaEOK,
	displayP3,
	equals,
	findContrast,
	hsl,
	inGamut,
	lch,
	meets,
	mix,
	oklch,
	onColor,
	parse,
	rec2020,
	srgb,
	toGamut,
	toHex
} from './index.js'

// Each narrow helper must give exactly what the full one gives, over colors in
// the spaces it was built with.
const samples = [
	'#336699',
	'#3b82f680',
	'white',
	'black',
	'hsl(200 50% 50%)',
	'hsl(none 0% 50%)',
	'oklch(0.7 0.4 150)',
	'oklch(0.9 0.4 150 / 0.5)',
	'oklch(1.2 0.1 40)',
	'oklch(-0.1 0.1 40)',
	'color(display-p3 0 1 0)',
	'lch(60 120 30)'
].map(parse)

const unknownSpace = /unknown color space "(display-p3|hsl|oklch)"/

describe('createToHex', () => {
	test('matches toHex', () => {
		const narrow = createToHex(hsl, oklch, displayP3, lch)
		for (const color of samples) expect(narrow(color)).toBe(toHex(color))
	})

	test('adds srgb itself', () => {
		expect(createToHex()(parse('#336699'))).toBe('#336699')
	})

	test('throws for a space it was not given, naming it', () => {
		expect(() => createToHex()(parse('hsl(200 50% 50%)'))).toThrow(unknownSpace)
	})
})

describe('createInGamut', () => {
	const narrow = createInGamut(hsl, oklch, displayP3, lch, rec2020)

	test('matches inGamut', () => {
		for (const color of samples) {
			expect(narrow(color)).toBe(inGamut(color))
			expect(narrow(color, 'display-p3')).toBe(inGamut(color, 'display-p3'))
			expect(narrow(color, 'rec2020', 0)).toBe(inGamut(color, 'rec2020', 0))
		}
	})

	test('throws for a gamut it was not given, naming it', () => {
		expect(() => createInGamut(oklch)(parse('oklch(0.7 0.1 40)'), 'display-p3')).toThrow(unknownSpace)
	})
})

describe('createToGamut', () => {
	const narrow = createToGamut(hsl, displayP3, lch)

	test('matches toGamut, with either method and gamut', () => {
		for (const color of samples) {
			expect(narrow(color)).toEqual(toGamut(color))
			expect(narrow(color, { method: 'clip' })).toEqual(toGamut(color, { method: 'clip' }))
			expect(narrow(color, { gamut: 'display-p3' })).toEqual(toGamut(color, { gamut: 'display-p3' }))
		}
	})

	test('adds srgb, oklch and oklab itself', () => {
		const color = parse('oklch(0.7 0.4 150)')
		expect(createToGamut()(color)).toEqual(toGamut(color))
	})

	test('throws for a space it was not given, naming it', () => {
		expect(() => createToGamut()(parse('color(display-p3 0 1 0)'))).toThrow(unknownSpace)
	})
})

describe('createDeltaEOK and createEquals', () => {
	test('match deltaEOK and equals', () => {
		const distance = createDeltaEOK(srgb, hsl, oklch, displayP3, lch)
		const same = createEquals(srgb, hsl, oklch, displayP3, lch)
		for (const a of samples)
			for (const b of samples) {
				expect(distance(a, b)).toBe(deltaEOK(a, b))
				expect(same(a, b)).toBe(equals(a, b))
				expect(same(a, b, 0.1)).toBe(equals(a, b, 0.1))
			}
	})

	test('createDeltaEOK adds oklab itself; createEquals adds nothing', () => {
		const a = parse('oklab(0.5 0.1 0.1)')
		const b = parse('oklab(0.6 0 0.1)')
		expect(createDeltaEOK()(a, b)).toBe(deltaEOK(a, b))
		expect(() => createDeltaEOK()(parse('#336699'), b)).toThrow(/unknown color space "srgb"/)
		expect(createEquals()(a, a)).toBe(true)
		expect(() => createEquals()(parse('oklch(0.7 0.1 40)'), a)).toThrow(/unknown color space "oklab"/)
	})
})

describe('createMix', () => {
	const narrow = createMix(srgb, hsl, oklch, displayP3, lch)

	test('matches mix, in any space and hue method', () => {
		for (const a of samples)
			for (const b of samples) {
				expect(narrow(a, b)).toEqual(mix(a, b))
				expect(narrow(a, b, 0.25, { in: 'oklch', hue: 'longer' })).toEqual(
					mix(a, b, 0.25, { in: 'oklch', hue: 'longer' })
				)
				expect(narrow(a, b, 0.7, { in: 'hsl' })).toEqual(mix(a, b, 0.7, { in: 'hsl' }))
			}
	})

	test('adds oklab itself', () => {
		const [a, b] = [parse('oklab(0.5 0.1 0.1)'), parse('oklab(0.6 0 0.1)')]
		expect(createMix()(a, b)).toEqual(mix(a, b))
	})

	test('throws for an `in` space it was not given, naming it', () => {
		expect(() => createMix(srgb)(parse('red'), parse('blue'), 0.5, { in: 'oklch' })).toThrow(unknownSpace)
	})
})

describe('the narrow contrast helpers', () => {
	const spaces = [hsl, oklch, displayP3, lch]
	const apca = (fg: Color, bg: Color): number => contrast(fg, bg) * (toHex(fg) < toHex(bg) ? 1 : -1)

	test('createContrast and createMeets match contrast and meets', () => {
		const narrow = createContrast(...spaces)
		const narrowMeets = createMeets(...spaces)
		for (const fg of samples)
			for (const bg of samples) {
				expect(narrow(fg, bg)).toBe(contrast(fg, bg))
				expect(narrow(fg, bg, apca)).toBe(contrast(fg, bg, apca))
				expect(narrowMeets(fg, bg, 'AA')).toBe(meets(fg, bg, 'AA'))
				expect(narrowMeets(fg, bg, 3, apca)).toBe(meets(fg, bg, 3, apca))
			}
	})

	test('createOnColor and createFindContrast match onColor and findContrast', () => {
		const narrowOn = createOnColor(...spaces)
		const narrowFind = createFindContrast(...spaces)
		for (const bg of samples) {
			expect(narrowOn(bg)).toEqual(onColor(bg))
			expect(narrowOn(bg, { target: 7, chroma: 0.1 })).toEqual(onColor(bg, { target: 7, chroma: 0.1 }))
			expect(narrowFind(bg, 4.5)).toEqual(findContrast(bg, 4.5))
			expect(narrowFind(bg, 3, { hue: 30, chroma: 0.1, direction: 'lighter' })).toEqual(
				findContrast(bg, 3, { hue: 30, chroma: 0.1, direction: 'lighter' })
			)
		}
	})

	test('add the spaces WCAG 2 and gamut mapping need', () => {
		const [fg, bg] = [parse('#336699'), parse('white')]
		expect(createContrast()(fg, bg)).toBe(contrast(fg, bg))
		expect(createMeets()(fg, bg, 'AA')).toBe(meets(fg, bg, 'AA'))
		expect(createOnColor()(fg)).toEqual(onColor(fg))
		expect(createFindContrast()(bg, 4.5)).toEqual(findContrast(bg, 4.5))
	})

	test('throw for a space or name they do not know', () => {
		expect(() => createContrast()(parse('hsl(200 50% 50%)'), parse('white'))).toThrow(unknownSpace)
		expect(() => createContrast()(parse('red'), parse('white'), 'apca' as never)).toThrow(
			/unknown contrast algorithm "apca"/
		)
		expect(() => createMeets()(parse('red'), parse('white'), 'AAAA')).toThrow(/unknown contrast level "AAAA"/)
		expect(() => createOnColor()(parse('oklch(0.7 0.1 40)'))).not.toThrow()
	})
})
