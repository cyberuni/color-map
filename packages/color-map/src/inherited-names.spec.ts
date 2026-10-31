import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { run } from './cli/testing.js'
import { contrast, findContrast, meets, mix, parse, parseExpr, resolve } from './color/index.js'
import { toCssVariables, toDTCG, toTailwindTheme } from './export/index.js'
import { darkVariant, harmony, semanticPalette, validate } from './palette/index.js'
import { createContrastScale, createScale, scaleFromBrand } from './scale/index.js'

// A name that a caller writes must be looked up as a name, never as a property
// of Object.prototype. Each of these is an inherited property of every object.
const CANNOT_PARSE = /^color-map: cannot parse/
const NAMES = ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf']

describe.each(NAMES)('the name "%s"', (name) => {
	describe('in parse', () => {
		test('as a color() space', () => {
			expect(() => parse(`color(${name} 1 2 3)`)).toThrow(CANNOT_PARSE)
		})
		test('as a function', () => {
			expect(() => parse(`${name}(1 2 3)`)).toThrow(CANNOT_PARSE)
			expect(() => parse(`${name}(1, 2, 3)`)).toThrow(CANNOT_PARSE)
		})
		test('as an angle unit', () => {
			expect(() => parse(`hsl(10${name} 50% 50%)`)).toThrow(CANNOT_PARSE)
		})
		test('as a color name', () => {
			expect(() => parse(name)).toThrow('not a color')
		})
	})

	describe('in parseExpr, resolve and calc', () => {
		test('as an interpolation space', () => {
			expect(() => parseExpr(`color-mix(in ${name}, red, blue)`)).toThrow('needs "in <space>"')
		})
		test('as a color() space of a relative color', () => {
			expect(() => parseExpr(`color(from red ${name} r g b)`)).toThrow('unknown color space')
		})
		test('as a channel keyword', () => {
			expect(() => resolve(`rgb(from red calc(${name}) g b)`)).toThrow(CANNOT_PARSE)
		})
		test('as a unit in calc()', () => {
			expect(() => resolve(`rgb(from red calc(1${name}) g b)`)).toThrow(CANNOT_PARSE)
		})
		test('as a system color', () => {
			expect(() => resolve(name)).toThrow('not a color')
		})
	})

	describe('in the color functions', () => {
		test('as a contrast level', () => {
			expect(() => meets('#000', '#fff', name)).toThrow('color-map: unknown contrast level')
		})
		test('as a mix space', () => {
			expect(() => mix('red', 'blue', 0.5, { in: name as 'oklab' })).toThrow('unknown color space')
		})
		test('as a color space of the color itself', () => {
			const odd = { colorSpace: name as 'srgb', components: [0, 0, 0] }
			expect(mix(odd, odd, 0.5, { in: name as 'srgb' })).toEqual(odd)
			expect(() => findContrast(odd, 4.5)).toThrow('unknown color space')
		})
	})

	describe('in the scale and palette', () => {
		test('as a scale preset', () => {
			expect(() => createScale({ seed: '#3b82f6', steps: name as 'even' })).toThrow(
				`color-map: unknown scale preset "${name}"; use one of tailwind-11, radix-12, tone-13, even`
			)
		})
		test('as a harmony scheme', () => {
			expect(() => harmony('#3b82f6', name as 'split')).toThrow(
				`color-map: unknown harmony scheme "${name}"; use one of complementary, split, analogous, triadic, tetradic`
			)
		})
		test('as a harmony space', () => {
			expect(() => harmony('#3b82f6', 'split', { space: name as 'hsl' })).toThrow(
				`color-map: unknown harmony space "${name}"; use one of oklch, lch, hsl, hwb`
			)
		})
		test('as a dark variant strategy', () => {
			expect(() => darkVariant([], name as 'mirror')).toThrow(
				`color-map: unknown dark variant strategy "${name}"; use one of mirror, tone-swap, lightness-invert`
			)
		})
		test('as a palette or brand scale mode', () => {
			const expected = `color-map: unknown mode "${name}"; use one of light, dark`
			expect(() => semanticPalette({ brand: 'red', mode: name as 'dark' })).toThrow(expected)
			expect(() => scaleFromBrand('red', { mode: name as 'dark' })).toThrow(expected)
		})
		test('as a contrast algorithm', () => {
			const expected = `color-map: unknown contrast algorithm "${name}"; use one of wcag2`
			const algo = name as 'wcag2'
			expect(() => contrast('#000', '#fff', algo)).toThrow(expected)
			expect(() => meets('#000', '#fff', 4.5, algo)).toThrow(expected)
			expect(() => findContrast('#fff', 4.5, { contrast: algo })).toThrow(expected)
			expect(() => semanticPalette({ brand: 'red', contrast: algo })).toThrow(expected)
			expect(() => validate({ roles: {} }, { contrast: algo })).toThrow(expected)
			expect(() => createContrastScale({ seed: 'red', background: '#fff', targets: [3], contrast: algo })).toThrow(
				expected
			)
		})
		test('as a mix hue method', () => {
			expect(() => mix('hsl(10 50% 50%)', 'hsl(200 50% 50%)', 0.5, { in: 'hsl', hue: name as 'shorter' })).toThrow(
				`color-map: unknown hue method "${name}"; use one of shorter, longer, increasing, decreasing`
			)
		})
	})

	describe('in the exporters', () => {
		const tree = JSON.parse(`{"${name}": {"${name}": "red"}, "other": "blue"}`)
		test('as a token or group name, DTCG writes it as an ordinary key', () => {
			const dtcg = toDTCG(tree)
			expect(Object.keys(dtcg).sort()).toEqual([name, 'other'].sort())
			expect(Object.keys(dtcg[name] as object)).toEqual([name])
			expect(JSON.parse(JSON.stringify(dtcg))[name][name].$value.colorSpace).toBe('srgb')
			expect(({} as Record<string, unknown>).$type).toBeUndefined()
			expect(Object.hasOwn(Object.prototype, '$type')).toBe(false)
			expect(Object.keys(Object.prototype)).toEqual([])
		})
		test('as a token name, CSS and Tailwind print it', () => {
			const slug = name
				.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
				.replace(/_+/g, '')
				.toLowerCase()
			expect(toCssVariables(tree)).toContain(`--color-${slug}-${slug}: rgb(255, 0, 0);`)
			expect(toTailwindTheme(tree)).toContain(`--color-${slug}-${slug}:`)
		})
	})

	describe('in the CLI', () => {
		test('as a command', async () => {
			const { code, err } = await run(name)
			expect(code).not.toBe(0)
			expect(err).not.toContain('TypeError')
		})
		test('as a color space, scale preset and harmony scheme', async () => {
			for (const argv of [
				['convert', 'red', '--to', name],
				['scale', 'red', '--preset', name],
				['harmony', 'red', '--scheme', name],
				['mix', 'red', 'blue', '--in', name],
				['mix', 'red', 'blue', '--hue', name],
				['export', 'red', '--to', name],
				['export', 'red', '--source', name],
				['palette', 'red', '--mode', name]
			]) {
				const { code, out, err } = await run(...argv)
				const text = out + err
				expect(code, argv.join(' ')).toBe(2)
				expect(text, argv.join(' ')).toContain('code: invalid-value')
				expect(text, argv.join(' ')).toContain(`value: ${name}`)
				expect(text, argv.join(' ')).toContain('allowed for --')
				expect(text, argv.join(' ')).not.toContain('TypeError')
			}
		})
		test('as the command schema asks for', async () => {
			const { code, out, err } = await run('schema', name)
			expect(code).not.toBe(0)
			expect(out + err).toContain('no command named')
		})
		test('as a token name in a --tokens file', async () => {
			const file = join(mkdtempSync(join(tmpdir(), 'color-map-')), 'tokens.json')
			writeFileSync(file, `{"${name}": {"${name}": "red"}}`)
			const { code, out } = await run('export', '--tokens', file, '--to', 'dtcg')
			expect(code).toBe(0)
			expect(out).toContain('"$type": "color"')
			expect(({} as Record<string, unknown>).$type).toBeUndefined()
		})
	})
})
