import Colorjs from 'colorjs.io'
import { toGamut as culoriGamut } from 'culori'
import { convert, deltaEOK, equals, fromArgb, inGamut, parse, toArgb, toGamut } from './index.js'
import type { Color } from './types.js'

describe('inGamut', () => {
	test('sRGB colors are in sRGB', () => {
		expect(inGamut(parse('#336699'))).toBe(true)
		expect(inGamut(parse('hsl(200 50% 50%)'))).toBe(true)
	})

	test('wide colors are not', () => {
		expect(inGamut(parse('color(display-p3 0 1 0)'))).toBe(false)
		expect(inGamut(parse('color(display-p3 0 1 0)'), 'display-p3')).toBe(true)
		expect(inGamut(parse('color(display-p3 0 1 0)'), 'rec2020')).toBe(true)
		expect(inGamut(parse('oklch(0.9 0.4 150)'), 'display-p3')).toBe(false)
	})

	test('epsilon admits rounding noise', () => {
		const edge: Color = { colorSpace: 'srgb', components: [1 + 1e-9, 0, 0] }
		expect(inGamut(edge)).toBe(true)
		expect(inGamut(edge, 'srgb', 0)).toBe(false)
	})
})

describe('toGamut', () => {
	test('returns an in-gamut color as it is', () => {
		const color = parse('#336699')
		expect(toGamut(color)).toBe(color)
	})

	test('clip clamps each channel and keeps the original space and alpha', () => {
		const result = toGamut(parse('color(display-p3 0 1 0 / 0.5)'), { method: 'clip' })
		expect(result.colorSpace).toBe('display-p3')
		expect(result.alpha).toBe(0.5)
		expect(inGamut(result)).toBe(true)
	})

	test('css maps into the gamut', () => {
		const result = toGamut(parse('oklch(0.7 0.4 150)'))
		expect(result.colorSpace).toBe('oklch')
		expect(inGamut(result)).toBe(true)
		// Chroma is reduced; the result is clipped, so lightness and hue stay close, not equal.
		expect(result.components[0]).toBeCloseTo(0.7, 1)
		expect(result.components[2]).toBeCloseTo(150, -1)
		expect(result.components[1] as number).toBeLessThan(0.4)
	})

	test('css maps into display-p3', () => {
		const result = toGamut(parse('oklch(0.7 0.4 150)'), { gamut: 'display-p3' })
		expect(inGamut(result, 'display-p3')).toBe(true)
	})

	test('lightness at or past the ends goes to white or black', () => {
		for (const v of convert(toGamut(parse('oklch(1.2 0.3 20)')), 'srgb').components as number[])
			expect(v).toBeCloseTo(1, 12)
		expect(convert(toGamut(parse('oklch(-0.1 0.3 20 / 0.5)')), 'srgb')).toMatchObject({ alpha: 0.5 })
		for (const v of convert(toGamut(parse('oklch(-0.1 0.3 20)')), 'srgb').components as number[])
			expect(v).toBeCloseTo(0, 12)
	})

	test('a color so close to the gamut that clipping is invisible is clipped', () => {
		const result = toGamut(parse('color(srgb 1.001 0.5 0.5)'))
		expect(inGamut(result)).toBe(true)
		expect(result.components[0]).toBe(1)
	})

	test('maps a sweep of wide colors into the gamut', () => {
		for (let l = 0.1; l < 1; l += 0.1) {
			for (let h = 0; h < 360; h += 20) {
				for (const gamut of ['srgb', 'display-p3'] as const) {
					expect(inGamut(toGamut(parse(`oklch(${l} 0.37 ${h})`), { gamut }), gamut)).toBe(true)
				}
			}
		}
	})

	test('agrees with colorjs.io css gamut mapping', () => {
		for (const css of [
			'oklch(0.7 0.4 150)',
			'oklch(0.5 0.35 300)',
			'color(display-p3 0 1 0)',
			'lch(60 130 40)',
			'oklch(0.9 0.3 100)'
		]) {
			const ours = convert(toGamut(parse(css)), 'srgb').components as number[]
			const theirs = new Colorjs(css).toGamut({ space: 'srgb', method: 'css' }).to('srgb').coords
			ours.forEach((v, i) => {
				expect(v).toBeCloseTo(theirs[i] as number, 3)
			})
		}
	})

	test('stays within a small distance of culori clamp mapping', () => {
		const color = parse('oklch(0.7 0.4 150)')
		const theirs = culoriGamut('rgb', 'oklch')({ mode: 'oklch', l: 0.7, c: 0.4, h: 150 })
		const ours = convert(toGamut(color), 'srgb').components as number[]
		// culori maps by chroma reduction in OKLCH as well, with another tolerance.
		expect(Math.abs(ours[0] - theirs.r)).toBeLessThan(0.1)
	})
})

describe('deltaEOK', () => {
	test('is 0 for the same color and symmetric', () => {
		const a = parse('#336699')
		const b = parse('#336698')
		expect(deltaEOK(a, a)).toBe(0)
		expect(deltaEOK(a, b)).toBeCloseTo(deltaEOK(b, a), 12)
		expect(deltaEOK(a, b)).toBeGreaterThan(0)
	})

	test('measures across spaces', () => {
		expect(deltaEOK(parse('white'), parse('oklab(1 0 0)'))).toBeLessThan(1e-6)
		expect(deltaEOK(parse('black'), parse('white'))).toBeCloseTo(1, 4)
	})

	test('agrees with colorjs.io', () => {
		const theirs = new Colorjs('#336699').deltaE(new Colorjs('#aa5500'), 'OK')
		expect(deltaEOK(parse('#336699'), parse('#aa5500'))).toBeCloseTo(theirs, 6)
	})
})

describe('equals', () => {
	test('same color, with and without alpha written out', () => {
		expect(equals(parse('red'), { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 })).toBe(true)
	})

	test('compares across spaces in the first one', () => {
		expect(equals(parse('red'), parse('hsl(0 100% 50%)'))).toBe(true)
		expect(equals(parse('red'), parse('hsl(0 100% 51%)'))).toBe(false)
	})

	test('alpha differences and epsilon', () => {
		expect(equals(parse('rgb(0 0 0 / 0.5)'), parse('black'))).toBe(false)
		expect(equals(parse('rgb(0 0 0 / 0.5)'), parse('rgb(0 0 0 / 0.5000001)'))).toBe(true)
		expect(equals(parse('rgb(0 0 0 / 0.5)'), parse('rgb(0 0 0 / 0.5000001)'), 0)).toBe(false)
	})

	test('none equals only none', () => {
		const a: Color = { colorSpace: 'hsl', components: [null, 50, 50] }
		expect(equals(a, { ...a, components: [null, 50, 50] })).toBe(true)
		expect(equals(a, { ...a, components: [0, 50, 50] })).toBe(false)
		expect(equals({ ...a, components: [0, 50, 50] }, a)).toBe(false)
	})
})

describe('ARGB', () => {
	test('fromArgb', () => {
		expect(fromArgb(0xff336699)).toEqual({ colorSpace: 'srgb', components: [0.2, 0.4, 0.6], alpha: 1 })
		expect(fromArgb(-1).alpha).toBe(1)
		expect(fromArgb(0x80000000).alpha).toBeCloseTo(0.502, 3)
	})

	test('toArgb is unsigned and round trips', () => {
		expect(toArgb(parse('#336699'))).toBe(0xff336699)
		expect(toArgb(fromArgb(0x80ff0102))).toBe(0x80ff0102)
		expect(toArgb({ colorSpace: 'srgb', components: [2, -1, null], alpha: 0 })).toBe(0x00ff0000)
		expect(toArgb({ colorSpace: 'srgb', components: [null, null, 1] })).toBe(0xff0000ff)
	})

	test('toArgb wants srgb', () => {
		expect(() => toArgb(parse('oklch(0.5 0.1 10)'))).toThrow('needs an srgb color, got "oklch"')
	})
})
