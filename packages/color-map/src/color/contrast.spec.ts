import Colorjs from 'colorjs.io'
import { type Color, contrast, findContrast, meets, onColor, parse, resolve, wcag2 } from './index.js'

const gray = (v: number): Color => ({ colorSpace: 'srgb', components: [v, v, v] })

describe('contrast (wcag2)', () => {
	test('black on white is 21', () => {
		expect(contrast('black', 'white')).toBeCloseTo(21, 3)
		expect(contrast('white', 'black')).toBeCloseTo(21, 3)
		expect(contrast('red', 'red')).toBe(1)
	})

	test('known pairs', () => {
		expect(contrast('#777', 'white')).toBeCloseTo(4.48, 2)
		expect(contrast('#767676', '#fff')).toBeCloseTo(4.54, 2)
	})

	test('agrees with colorjs.io on random colors', () => {
		for (let i = 0; i < 50; i++) {
			const a = gray(Math.random())
			const b: Color = { colorSpace: 'display-p3', components: [Math.random(), Math.random(), Math.random()] }
			const expected = new Colorjs('srgb', a.components as [number, number, number]).contrast(
				new Colorjs('p3', b.components as [number, number, number]),
				'WCAG21'
			)
			expect(contrast(a, b)).toBeCloseTo(expected, 1)
		}
	})

	test('a translucent foreground is laid over the background', () => {
		const half: Color = { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 }
		expect(contrast(half, 'white')).toBeCloseTo(contrast(gray(0.5), 'white'), 9)
		expect(contrast({ ...half, alpha: null }, 'white')).toBe(1)
		expect(contrast({ ...half, alpha: 1 }, 'white')).toBeCloseTo(21, 3)
	})

	test('takes a custom function', () => {
		expect(contrast('red', 'blue', () => 7)).toBe(7)
	})
})

describe('meets', () => {
	test('names and numbers', () => {
		expect(meets('#767676', 'white', 'AA')).toBe(true)
		expect(meets('#777', 'white', 'AA')).toBe(false)
		expect(meets('#777', 'white', 'AA-large')).toBe(true)
		expect(meets('#777', 'white', 4.4)).toBe(true)
		expect(meets('black', 'white', 'AAA', wcag2)).toBe(true)
	})

	test('names the bad level', () => {
		expect(() => meets('black', 'white', 'AAAA')).toThrow('Unknown contrast level "AAAA"; use one of AA')
		expect(() => meets('black', 'white', 'x', () => 1)).toThrow('Unknown contrast level "x"')
	})

	test('compares a signed measure by magnitude', () => {
		expect(meets('black', 'white', 60, () => -75)).toBe(true)
	})
})

describe('onColor', () => {
	test('white on dark backgrounds', () => {
		expect(onColor('navy')).toEqual({ colorSpace: 'srgb', components: [1, 1, 1] })
	})

	test('tinted near-black on light backgrounds', () => {
		const bg = parse('#ffe066')
		const text = onColor(bg)
		expect(text.colorSpace).toBe('oklch')
		expect(contrast(text, bg)).toBeGreaterThanOrEqual(4.5)
		expect(text.components[0]).toBe(0.2)
	})

	test('picks the better of the two when neither reaches the target', () => {
		const mid = parse('#808080')
		const text = onColor(mid, { target: 7 })
		expect(contrast(text, mid)).toBeGreaterThanOrEqual(contrast('white', mid))
		expect(onColor('#bbb', { target: 21 })).not.toEqual(gray(1))
		expect(onColor('#777', { target: 21, chroma: 0 })).toEqual(gray(1))
	})

	test('takes a custom measure and target', () => {
		expect(onColor('white', { contrast: () => 10, target: 5 })).toEqual(gray(1))
	})
})

describe('findContrast', () => {
	test.each([
		['white', 4.5],
		['black', 4.5],
		['#3b82f6', 4.5],
		['#ffe066', 3],
		['#123456', 12]
	])('on %s reaches %s and reports the ratio', (bg, target) => {
		for (const chroma of [0, 0.1]) {
			const r = findContrast(bg, target, { chroma, hue: 250 })
			expect(r.met).toBe(true)
			expect(r.contrast).toBeGreaterThanOrEqual(target)
			expect(r.contrast).toBeCloseTo(contrast(r.color, bg), 12)
		}
	})

	test('finds the closest, not the extreme', () => {
		const r = findContrast('white', 4.5)
		expect(r.contrast).toBeLessThan(4.6)
	})

	test('uses the hue of bg by default and the other side when needed', () => {
		const r = findContrast('#777', 4.4, { direction: 'lighter' })
		expect(r.met).toBe(true)
		expect(r.color.components[0]).toBeGreaterThan(0.57)
		// White gives 4.48 on #777, so a target of 4.6 can only be met darker.
		const dark = findContrast('#777', 4.6, { direction: 'lighter' })
		expect(dark.met).toBe(true)
		expect(dark.color.components[0]).toBeLessThan(0.57)
		expect(findContrast('#777', 4.6).met).toBe(true)
	})

	test('reports the best effort when the target is out of reach', () => {
		const r = findContrast('#777', 30)
		expect(r.met).toBe(false)
		expect(r.contrast).toBeGreaterThan(4)
		const dark = findContrast('#222', 30, { direction: 'darker' })
		expect(dark.met).toBe(false)
	})
})

describe('resolve contrast-color()', () => {
	test('still picks white or black', () => {
		expect(resolve('contrast-color(white)')).toEqual(gray(0))
		expect(resolve('contrast-color(navy)')).toEqual(gray(1))
	})
})
