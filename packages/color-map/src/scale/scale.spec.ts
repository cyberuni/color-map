import { contrast, deltaEOK, inGamut, parse } from '../color/index.js'
import {
	createContrastScale,
	createScale,
	lstar,
	MATERIAL_TONES,
	scaleFromBrand,
	tonalPalette,
	toneColor
} from './index.js'

// Tailwind v4 blue, 50 to 950, as shipped in theme.css.
const TAILWIND_BLUE = [
	'oklch(97% 0.014 254.604)',
	'oklch(93.2% 0.032 255.585)',
	'oklch(88.2% 0.059 254.128)',
	'oklch(80.9% 0.105 251.813)',
	'oklch(70.7% 0.165 254.624)',
	'oklch(62.3% 0.214 259.815)',
	'oklch(54.6% 0.245 262.881)',
	'oklch(48.8% 0.243 264.376)',
	'oklch(42.4% 0.199 265.638)',
	'oklch(37.9% 0.146 265.522)',
	'oklch(28.2% 0.091 267.935)'
]

describe('createScale', () => {
	test('tailwind-11 rebuilds Tailwind blue within deltaEOK 0.02 per step', () => {
		const scale = createScale({ seed: TAILWIND_BLUE[5] as string })
		expect(scale).toHaveLength(11)
		for (const [i, c] of scale.entries()) expect(deltaEOK(c, parse(TAILWIND_BLUE[i] as string))).toBeLessThan(0.02)
	})

	test('a nearby seed (the v3 blue-500) still stays close to Tailwind blue', () => {
		const scale = createScale({ seed: '#3b82f6' })
		for (const [i, c] of scale.entries()) expect(deltaEOK(c, parse(TAILWIND_BLUE[i] as string))).toBeLessThan(0.05)
	})

	test.each([
		['radix-12', 12],
		['tone-13', 13],
		['even', 11],
		[7, 7]
	] as const)('%s has %i steps, all inside the gamut, light to dark', (steps, n) => {
		for (const gamut of ['srgb', 'display-p3'] as const) {
			const scale = createScale({ seed: 'oklch(0.6 0.2 30)', steps, gamut })
			expect(scale).toHaveLength(n)
			expect(scale.every((c) => inGamut(c, gamut))).toBe(true)
			const l = scale.map(lstar)
			expect(l).toEqual([...l].sort((a, b) => b - a))
		}
	})

	test('a gray seed and a missing hue are fine', () => {
		expect(createScale({ seed: 'gray', steps: 'tone-13' })).toHaveLength(13)
		expect(createScale({ seed: { colorSpace: 'oklch', components: [0.5, 0.1, null] } })).toHaveLength(11)
	})

	test('tone-13 keeps the tone-gap contrast guarantee', () => {
		const scale = createScale({ seed: 'oklch(0.6 0.2 260)', steps: 'tone-13' })
		const tones = [...MATERIAL_TONES].reverse()
		for (let i = 0; i < scale.length; i++)
			for (let j = 0; j < scale.length; j++) {
				const gap = Math.abs((tones[i] as number) - (tones[j] as number))
				const ratio = contrast(scale[i] as never, scale[j] as never)
				if (gap >= 40) expect(ratio).toBeGreaterThanOrEqual(3)
				if (gap >= 50) expect(ratio).toBeGreaterThanOrEqual(4.4)
			}
	})

	test('overrides', () => {
		const lightness = [0.9, 0.5, 0.2]
		const scale = createScale({ seed: 'blue', steps: 3, lightness, chroma: [0, 1, 0], hueShift: 0 })
		expect(scale.map((c) => Math.round((c.components[0] as number) * 10) / 10)).toEqual([0.9, 0.5, 0.2])
		expect(scale[0]?.components[1]).toBeCloseTo(0, 6)
		const shifted = createScale({ seed: 'oklch(0.6 0.05 260)', steps: 3, hueShift: [0, 10, 20] })
		const hues = shifted.map((c) => c.components[2] as number)
		expect(hues[2]! - hues[0]!).toBeCloseTo(20, 1)
	})

	test('rejects bad steps and mismatched arrays', () => {
		expect(() => createScale({ seed: 'blue', steps: 1 })).toThrow('at least 2')
		expect(() => createScale({ seed: 'blue', steps: 2.5 })).toThrow('at least 2')
		expect(() => createScale({ seed: 'blue', steps: 3, lightness: [1] })).toThrow('lightness needs 3 values, got 1')
	})
})

describe('tonalPalette', () => {
	test('lands on each tone', () => {
		for (const hue of [30, 110, 260])
			for (const [i, c] of tonalPalette(hue, 0.15).entries())
				expect(lstar(c)).toBeCloseTo(MATERIAL_TONES[i] as number, 1)
	})

	test('takes custom tones and a gamut; the ends are black and white', () => {
		const [dark, mid, light] = tonalPalette(260, 0.2, [0, 50, 100], { gamut: 'display-p3' })
		expect(dark?.components[0]).toBe(0)
		expect(light?.components[0]).toBe(1)
		expect(inGamut(mid as never, 'display-p3')).toBe(true)
	})

	test('toneColor maps chroma into the gamut', () => {
		expect(inGamut(toneColor(90, 0.4, 260))).toBe(true)
	})
})

describe('createContrastScale', () => {
	test('every step meets its target against the background', () => {
		const steps = createContrastScale({ seed: '#3b82f6', background: 'white', targets: [1.5, 3, 4.5, 7, 12] })
		expect(steps.map((s) => s.name)).toEqual(['0', '1', '2', '3', '4'])
		for (const s of steps) {
			expect(s.met).toBe(true)
			expect(s.contrast).toBeGreaterThanOrEqual(s.target)
			expect(contrast(s.color, 'white')).toBeCloseTo(s.contrast, 9)
		}
	})

	test('named targets on a dark background, going lighter', () => {
		const steps = createContrastScale({
			seed: 'oklch(0.6 0.1 30)',
			background: '#111',
			targets: { text: 7, border: 3 }
		})
		expect(steps.map((s) => s.name)).toEqual(['text', 'border'])
		expect(steps.every((s) => s.met && lstar(s.color) > lstar(parse('#111')))).toBe(true)
	})

	test('an unreachable target reports met false, and a gray seed works', () => {
		const [s] = createContrastScale({ seed: 'gray', background: 'white', targets: [30], direction: 'darker' })
		expect(s?.met).toBe(false)
		const [t] = createContrastScale({
			seed: { colorSpace: 'oklch', components: [0.5, 0, null] },
			background: 'white',
			targets: [4.5]
		})
		expect(t?.met).toBe(true)
	})
})

describe('scaleFromBrand', () => {
	test.each(['#3b82f6', '#e5484d', '#ffe629', 'oklch(0.7 0.25 150)'])('%s lands exactly at step 9', (brand) => {
		for (const mode of ['light', 'dark'] as const) {
			const scale = scaleFromBrand(brand, { mode })
			expect(scale).toHaveLength(12)
			expect(scale[8]).toEqual(parse(brand))
		}
	})

	test('light runs light to dark, dark runs dark to light, and 11 and 12 read on step 1', () => {
		const light = scaleFromBrand('#3b82f6').map(lstar)
		expect(light.slice(0, 9)).toEqual([...light.slice(0, 9)].sort((a, b) => b - a))
		expect(light[9]).toBeLessThan(light[8] as number)
		const dark = scaleFromBrand('#3b82f6', { mode: 'dark' })
		const d = dark.map(lstar)
		expect(d.slice(0, 9)).toEqual([...d.slice(0, 9)].sort((a, b) => a - b))
		expect(d[9]).toBeGreaterThan(d[8] as number)
		expect(contrast(dark[11] as never, dark[0] as never)).toBeGreaterThan(7)
		expect(contrast(scaleFromBrand('#3b82f6')[10] as never, scaleFromBrand('#3b82f6')[1] as never)).toBeGreaterThan(4.5)
	})

	test('a custom background sets step 1; a gray brand and a missing hue work', () => {
		const scale = scaleFromBrand('blue', { background: '#fcfcfd' })
		expect(lstar(scale[0] as never)).toBeCloseTo(lstar(parse('#fcfcfd')), 0)
		expect(scaleFromBrand('gray', { gamut: 'display-p3' })).toHaveLength(12)
		expect(
			scaleFromBrand({ colorSpace: 'oklch', components: [0.5, 0.1, null] }, { background: parse('#fff') })
		).toHaveLength(12)
	})
})
