import { contrast, convert, deltaEOK, inGamut, parse, wcag2 } from '../color/index.js'
import type { Color } from '../color/types.js'
import { createScale, tonalPalette } from '../scale/index.js'
import { darkVariant, harmonize, harmony, inverse, semanticPalette, validate } from './index.js'

const hueOf = (c: Color | string, space: 'oklch' | 'hsl' = 'oklch') =>
	convert(typeof c === 'string' ? parse(c) : c, space).components[space === 'hsl' ? 0 : 2] as number
const diff = (a: number, b: number) => ((((b - a + 540) % 360) + 360) % 360) - 180

describe('harmony', () => {
	const base = 'oklch(0.6 0.1 40)'
	test.each([
		['complementary', [0, 180]],
		['split', [0, 150, 210]],
		['analogous', [-30, 0, 30]],
		['triadic', [0, 120, 240]],
		['tetradic', [0, 90, 180, 270]]
	] as const)('%s rotates oklch hue by %j and holds L and C', (scheme, angles) => {
		const out = harmony(base, scheme)
		expect(out).toHaveLength(angles.length)
		angles.forEach((a, i) => {
			expect(Math.abs(diff(40 + a, hueOf(out[i] as Color)))).toBeLessThan(0.5)
			const [l, c] = convert(out[i] as Color, 'oklch').components as number[]
			expect(l).toBeCloseTo(0.6, 2)
			expect(c).toBeCloseTo(0.1, 2)
		})
	})
	test('the base color is returned as given at angle 0', () => {
		const b = parse(base)
		expect(harmony(b, 'complementary')[0]).toBe(b)
	})
	test('hsl space rotates hsl hue; a gray has hue 0', () => {
		expect(hueOf(harmony('hsl(10 80% 50%)', 'triadic', { space: 'hsl' })[1] as Color, 'hsl')).toBeCloseTo(130, 0)
		expect(hueOf(harmony('hsl(10 80% 50%)', 'complementary', { space: 'lch' })[1] as Color)).toBeDefined()
		expect(hueOf(harmony('#808080', 'complementary', { space: 'hsl' })[1] as Color, 'hsl')).toBeCloseTo(180, 0)
	})
	test('rotated colors are mapped into the gamut', () => {
		for (const c of harmony('oklch(0.7 0.3 20)', 'tetradic').slice(1)) expect(inGamut(c, 'srgb')).toBe(true)
	})
	test('an unknown scheme throws', () => {
		expect(() => harmony('red', 'nope' as never)).toThrow('unknown harmony scheme "nope"')
	})
})

describe('harmonize', () => {
	test('moves half the way, at most 15 degrees, keeping L and C', () => {
		const from = 'oklch(0.6 0.1 100)'
		const near = harmonize(from, 'oklch(0.6 0.1 110)')
		expect(hueOf(near)).toBeCloseTo(105, 0)
		const far = harmonize(from, 'oklch(0.6 0.1 200)')
		expect(hueOf(far)).toBeCloseTo(115, 0)
		const [l, c] = convert(far, 'oklch').components as number[]
		expect(l).toBeCloseTo(0.6, 2)
		expect(c).toBeCloseTo(0.1, 2)
	})
	test('goes the short way round and honors max and factor', () => {
		expect(hueOf(harmonize('oklch(0.6 0.1 350)', 'oklch(0.6 0.1 20)'))).toBeCloseTo(5, 0)
		expect(hueOf(harmonize('oklch(0.6 0.1 100)', 'oklch(0.6 0.1 200)', { max: 40, factor: 1 }))).toBeCloseTo(140, 0)
	})
	test('a gray has no hue to move toward or from', () => {
		const none: Color = { colorSpace: 'oklch', components: [0.6, 0, null] }
		expect(hueOf(harmonize('oklch(0.6 0.1 100)', none))).toBeCloseTo(100, 0)
		expect(hueOf(harmonize(none, 'oklch(0.6 0.1 100)'))).toBeCloseTo(15, 0)
	})
})

describe('inverse', () => {
	test('lightness flips OKLCH L, keeping hue and chroma, and alpha', () => {
		const out = inverse('oklch(0.3 0.1 40 / 0.5)')
		const [l, c, h] = convert(out, 'oklch').components as number[]
		expect([l, c, h].map((x) => Math.round(x * 100) / 100)).toEqual([0.7, 0.1, 40])
		expect(out.alpha).toBe(0.5)
	})
	test('rgb flips each channel', () => {
		expect(inverse('#ff8000', 'rgb')).toEqual({ colorSpace: 'srgb', components: [0, 127 / 255, 1] })
	})
	test('black and white swap', () => {
		expect(deltaEOK(inverse('#000'), parse('#fff'))).toBeLessThan(1e-3)
	})
})

describe('darkVariant', () => {
	const light = createScale({ seed: '#3b82f6', steps: 'tailwind-11' })
	test('mirror reverses the scale without changing colors', () => {
		const dark = darkVariant(light, 'mirror')
		expect(dark[0]).toBe(light[10])
		expect(dark[10]).toBe(light[0])
		expect(dark).not.toBe(light)
	})
	test('tone-swap puts each step at tone 100 minus its own, same hue', () => {
		const dark = darkVariant(light)
		dark.forEach((c, i) => {
			expect(inGamut(c)).toBe(true)
			expect(hueOf(c)).toBeCloseTo(hueOf(light[i] as Color), 0)
		})
		expect(contrast(dark[0] as Color, '#000')).toBeLessThan(contrast(light[0] as Color, '#000'))
	})
	test('tone-swap and lightness-invert keep alpha', () => {
		const a = [{ ...parse('#3b82f6'), alpha: 0.4 }, parse('#ffffff')]
		expect(darkVariant(a, 'tone-swap')[0]?.alpha).toBe(0.4)
		expect(darkVariant(a, 'lightness-invert')[0]?.alpha).toBe(0.4)
		expect(darkVariant(a, 'lightness-invert')[1]?.alpha).toBeUndefined()
	})
	test('lightness-invert reflects L inside the scale range, keeping order reversed', () => {
		const dark = darkVariant(light, 'lightness-invert')
		const ls = dark.map((c) => convert(c, 'oklch').components[0] as number)
		expect(ls[0]).toBeCloseTo(convert(light[10] as Color, 'oklch').components[0] as number, 1)
		for (let i = 1; i < ls.length; i++) expect(ls[i]).toBeGreaterThan(ls[i - 1] as number)
	})
	test('hue-less colors are handled and an unknown strategy throws', () => {
		expect(darkVariant([parse('#888')], 'tone-swap')).toHaveLength(1)
		expect(darkVariant([parse('#888')], 'lightness-invert')).toHaveLength(1)
		expect(() => darkVariant(light, 'nope' as never)).toThrow('unknown dark variant strategy "nope"')
	})
})

describe('semanticPalette', () => {
	test.each(['light', 'dark'] as const)('%s: every pair meets its target and records its ratio', (mode) => {
		const p = semanticPalette({ brand: '#3b82f6', mode })
		for (const [name, pair] of Object.entries(p.roles)) {
			expect(pair.ratio, name).toBeGreaterThanOrEqual(pair.target)
			expect(pair.ratio, name).toBeCloseTo(wcag2(pair.fg, pair.bg), 6)
		}
		expect(p.meta).toMatchObject({ mode, contrast: 'wcag2', target: 4.5 })
		expect(p.scales.primary).toHaveLength(13)
		expect(validate(p)).toEqual({ ok: true, issues: [] })
	})
	test('light surface is light, dark surface is dark, and neutrals carry the brand hue', () => {
		const light = semanticPalette({ brand: 'oklch(0.55 0.2 260)' })
		const dark = semanticPalette({ brand: 'oklch(0.55 0.2 260)', mode: 'dark' })
		expect(convert(light.roles.surface.bg, 'oklch').components[0] as number).toBeGreaterThan(0.9)
		expect(convert(dark.roles.surface.bg, 'oklch').components[0] as number).toBeLessThan(0.3)
		expect(hueOf(light.roles.surface.bg)).toBeCloseTo(260, -1)
	})
	test('status colors lean toward the brand hue, by at most 15 degrees', () => {
		const a = semanticPalette({ brand: 'oklch(0.55 0.2 300)' }).roles.danger.bg
		const b = semanticPalette({ brand: 'oklch(0.55 0.2 25)' }).roles.danger.bg
		expect(hueOf(a)).toBeLessThan(hueOf(b))
		expect(Math.abs(diff(hueOf(b), hueOf(a)))).toBeLessThanOrEqual(15.5)
	})
	test('a custom contrast and target are used, and its name is reported', () => {
		const fn = Object.assign((fg: Color, bg: Color) => wcag2(fg, bg), { algorithm: 'mine' })
		const p = semanticPalette({ brand: '#3b82f6', contrast: fn, target: 3 })
		expect(p.meta).toMatchObject({ contrast: 'mine', target: 3 })
		for (const pair of Object.values(p.roles)) expect(pair.ratio).toBeGreaterThanOrEqual(3)
		const anon = semanticPalette({ brand: '#3b82f6', contrast: (a: Color, b: Color) => wcag2(a, b) })
		expect(anon.meta.contrast).toBe('custom')
	})
	test('accepts a Color and a hue-less brand', () => {
		expect(semanticPalette({ brand: parse('#808080') }).roles.primary.ratio).toBeGreaterThan(4.5)
	})
	test('a target the tone gap cannot reach is searched for, and validate reports what stays short', () => {
		const p = semanticPalette({ brand: '#3b82f6', target: 7 })
		expect(p.roles.surface.ratio).toBeGreaterThanOrEqual(7)
		const short = Object.entries(p.roles).filter(([, x]) => x.ratio < x.target)
		expect(short.length).toBeGreaterThan(0)
		expect(validate(p).issues.filter((i) => i.kind === 'contrast')).toHaveLength(short.length)
	})
})

describe('validate', () => {
	test('reports a failing pair with its path', () => {
		const bg = parse('#777')
		const r = validate({
			roles: {
				weak: { bg, fg: parse('#888'), ratio: 9, target: 4.5 },
				other: { bg, fg: parse('#fff'), ratio: 1, target: undefined as never }
			}
		})
		expect(r.ok).toBe(false)
		expect(r.issues.map((i) => [i.kind, i.path])).toContainEqual(['contrast', 'roles.weak'])
		expect(r.issues[0]?.message).toContain('needs 4.5')
	})
	test('uses the option target for pairs without one, and a custom measure', () => {
		const pair = { bg: parse('#000'), fg: parse('#fff') } as never
		expect(validate({ roles: { a: pair } }).ok).toBe(true)
		expect(validate({ roles: { a: pair } }, { target: 30 }).ok).toBe(false)
		expect(validate({ roles: { a: pair } }, { contrast: () => 1 }).ok).toBe(false)
	})
	test('reports scales whose lightness is not steady, including repeated steps', () => {
		const good = tonalPalette(250, 0.1)
		expect(validate({ scales: { good } }).ok).toBe(true)
		const [a, b, c] = [parse('#111'), parse('#999'), parse('#555')] as Color[]
		const bad = validate({ scales: { bumpy: [a, b, c], flat: [a, a, a] } })
		expect(bad.issues.filter((i) => i.kind === 'lightness').map((i) => i.path)).toEqual([
			'scales.bumpy[2]',
			'scales.flat[1]',
			'scales.flat[2]'
		])
	})
	test('reports clipped colors', () => {
		const out: Color = { colorSpace: 'oklch', components: [0.7, 0.4, 150] }
		const r = validate({ roles: { x: { bg: parse('#000'), fg: out, ratio: 20, target: 4.5 } }, scales: { s: [out] } })
		expect(r.issues.map((i) => i.path)).toEqual(['roles.x.fg', 'scales.s[0]'])
		expect(validate({ scales: { s: [out] } }, { gamut: 'prophoto-rgb' }).ok).toBe(false)
		expect(
			validate({ scales: { s: [{ colorSpace: 'oklch', components: [0.7, 0.2, 150] }] } }, { gamut: 'display-p3' }).ok
		).toBe(true)
	})
	test('an empty palette is fine', () => {
		expect(validate({})).toEqual({ ok: true, issues: [] })
	})
})
