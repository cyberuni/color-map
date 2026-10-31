import { parse } from '../color/index.js'
import type { Color } from '../color/types.js'
import { semanticPalette } from '../palette/index.js'
import { createScale } from '../scale/index.js'
import { type DtcgColorValue, type DtcgGroup, toCssVariables, toDTCG, toDtcgValue, toTailwindTheme } from './index.js'
import { kebab } from './tokens.js'

// DTCG 2025.10 §color: the component count, and for each space which components are angles or ranges.
const COMPONENTS: Record<string, number> = {}
for (const s of [
	'srgb',
	'srgb-linear',
	'hsl',
	'hwb',
	'lab',
	'lch',
	'oklab',
	'oklch',
	'display-p3',
	'a98-rgb',
	'prophoto-rgb',
	'rec2020',
	'xyz-d65',
	'xyz-d50'
])
	COMPONENTS[s] = 3

function check(group: DtcgGroup): number {
	let leaves = 0
	for (const [name, node] of Object.entries(group)) {
		expect(name).not.toMatch(/^\$|[{}.]/)
		if ('$type' in node) {
			leaves++
			const v = node.$value as DtcgColorValue
			expect(node.$type).toBe('color')
			expect(COMPONENTS[v.colorSpace]).toBe(v.components.length)
			for (const c of v.components) expect(c === 'none' || Number.isFinite(c)).toBe(true)
			if (v.alpha !== undefined) expect(v.alpha === 'none' || (v.alpha >= 0 && v.alpha < 1)).toBe(true)
			if (v.hex !== undefined) expect(v.hex).toMatch(/^#[0-9a-f]{6}$/)
			expect(Object.keys(v).every((k) => ['colorSpace', 'components', 'alpha', 'hex'].includes(k))).toBe(true)
		} else leaves += check(node)
	}
	return leaves
}

const blue = parse('oklch(0.62 0.19 260)')

describe('toDtcgValue', () => {
	test('names the space, the components and an sRGB hex', () => {
		expect(toDtcgValue(parse('#336699'))).toEqual({ colorSpace: 'srgb', components: [0.2, 0.4, 0.6], hex: '#336699' })
	})
	test('prints null as "none" and keeps a non-opaque alpha', () => {
		const v = toDtcgValue({ colorSpace: 'oklch', components: [0.5, 0.1, null], alpha: 0.5 }, { hex: false })
		expect(v).toEqual({ colorSpace: 'oklch', components: [0.5, 0.1, 'none'], alpha: 0.5 })
		expect(toDtcgValue({ colorSpace: 'srgb', components: [0, 0, 0], alpha: null }, { hex: false }).alpha).toBe('none')
	})
	test('an opaque alpha is left out, and the hex has no alpha', () => {
		const v = toDtcgValue({ colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 })
		expect(v.alpha).toBeUndefined()
		expect(toDtcgValue({ colorSpace: 'srgb', components: [1, 0, 0], alpha: 0.5 }).hex).toBe('#ff0000')
	})
	test('an out-of-sRGB color gets a gamut-mapped hex', () => {
		expect(toDtcgValue(parse('color(display-p3 0 1 0)')).hex).toMatch(/^#[0-9a-f]{6}$/)
	})
	test('display-p3-linear is written as display-p3', () => {
		const v = toDtcgValue({ colorSpace: 'display-p3-linear', components: [0.2, 0.2, 0.2] }, { hex: false })
		expect(v.colorSpace).toBe('display-p3')
		expect(v.components[0]).toBeGreaterThan(0.4)
	})
})

describe('toDTCG', () => {
	test('nests groups and marks each leaf as a color', () => {
		const out = toDTCG({ brand: { main: '#336699' }, text: blue })
		expect(Object.keys(out)).toEqual(['brand', 'text'])
		expect((out.brand as DtcgGroup).main).toMatchObject({ $type: 'color', $value: { colorSpace: 'srgb' } })
		expect(check(out)).toBe(2)
	})
	test('survives JSON', () => {
		const out = toDTCG({ a: { colorSpace: 'oklch', components: [0.5, 0.1, null] } })
		expect(JSON.parse(JSON.stringify(out))).toEqual(out)
	})
	test('a semantic palette exports its scales and role pairs, not its measures', () => {
		const out = toDTCG(semanticPalette({ brand: '#3b82f6' }))
		expect(Object.keys(out).sort()).toEqual(['neutral', 'primary', 'roles'])
		expect(Object.keys((out.roles as DtcgGroup).danger as DtcgGroup)).toEqual(['bg', 'fg'])
		expect(Object.keys(out.primary as DtcgGroup)).toHaveLength(13)
		expect(check(out)).toBe(13 * 2 + 9 * 2)
	})
	test('an 11-color scale gets the Tailwind keys', () => {
		const out = toDTCG({ blue: createScale({ seed: '#3b82f6' }) })
		expect(Object.keys(out.blue as DtcgGroup)).toEqual([
			'50',
			'100',
			'200',
			'300',
			'400',
			'500',
			'600',
			'700',
			'800',
			'900',
			'950'
		])
	})
	test('any other array is numbered from 1', () => {
		expect(Object.keys(toDTCG({ s: ['#000', '#fff'] }).s as DtcgGroup)).toEqual(['1', '2'])
	})
	test('a value that is not a color throws with its path', () => {
		expect(() => toDTCG({ a: { b: 5 } } as never)).toThrow('a.b is not a color')
		expect(() => toDTCG(null as never)).toThrow('(root) is not a color')
	})
	test('a single color has no name, so it throws', () => {
		expect(() => toDTCG('#fff')).toThrow('needs a name')
	})
	test('an empty tree is an empty file', () => {
		expect(toDTCG({})).toEqual({})
	})
})

describe('toCssVariables', () => {
	test('writes one custom property per color in :root', () => {
		expect(toCssVariables({ primary: { 500: blue }, bg: '#fff' })).toBe(
			':root {\n\t--color-primary-500: oklch(0.62 0.19 260);\n\t--color-bg: rgb(255, 255, 255);\n}\n'
		)
	})
	test('options set the prefix, the selector, the space and the precision', () => {
		const out = toCssVariables(
			{ brandMain: '#336699' },
			{ prefix: 'ds', selector: '.dark', space: 'oklch', precision: 2 }
		)
		expect(out).toMatch(/^\.dark \{\n\t--ds-brand-main: oklch\(0\.\d+ 0\.\d+ \d+(\.\d+)?\);\n\}\n$/)
	})
	test('an empty prefix leaves the path alone', () => {
		expect(toCssVariables({ a: '#000' }, { prefix: '' })).toContain('--a:')
	})
	test('a name made twice throws', () => {
		expect(() => toCssVariables({ primaryContainer: '#000', 'primary-container': '#fff' })).toThrow(
			'--color-primary-container is produced by more than one token'
		)
	})
})

describe('toTailwindTheme', () => {
	test('writes an @theme block in oklch', () => {
		const out = toTailwindTheme({ primary: { 500: '#3b82f6' } })
		expect(out).toMatch(/^@theme \{\n\t--color-primary-500: oklch\(0\.62\d* 0\.18\d* 259\.\d+\);\n\}\n$/)
	})
	test('keeps the namespace, inline and space options', () => {
		const out = toTailwindTheme({ x: '#3b82f6' }, { namespace: 'brand', inline: true, space: 'srgb' })
		expect(out).toBe('@theme inline {\n\t--brand-x: rgb(59, 130, 246);\n}\n')
	})
	test('a tailwind-11 scale uses Tailwind step names', () => {
		const out = toTailwindTheme({ blue: createScale({ seed: '#3b82f6' }) })
		expect(out).toContain('--color-blue-50:')
		expect(out).toContain('--color-blue-950:')
	})
})

describe('kebab', () => {
	test.each([
		['primaryContainer', 'primary-container'],
		['Primary Container', 'primary-container'],
		['500', '500'],
		['--x--', 'x']
	])('%s → %s', (a, b) => expect(kebab(a)).toBe(b))
})

test('the Color type is accepted as is', () => {
	const c: Color = { colorSpace: 'srgb', components: [0, 0, 0] }
	expect(toCssVariables(c)).toContain('--color:')
})
