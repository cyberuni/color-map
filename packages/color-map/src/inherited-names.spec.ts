import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { run } from './cli/testing.js'
import { findContrast, meets, mix, parse, parseExpr, resolve } from './color/index.js'
import { toCssVariables, toDTCG, toTailwindTheme } from './export/index.js'
import { harmony } from './palette/index.js'
import { createScale } from './scale/index.js'

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
			expect(() => meets('#000', '#fff', name)).toThrow('Unknown contrast level')
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
			expect(() => createScale({ seed: '#3b82f6', steps: name as 'even' })).toThrow()
		})
		test('as a harmony scheme', () => {
			expect(() => harmony('#3b82f6', name as 'split')).toThrow('unknown harmony scheme')
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
				['mix', 'red', 'blue', '--in', name]
			]) {
				const { code, err } = await run(...argv)
				expect(code, argv.join(' ')).not.toBe(0)
				expect(err, argv.join(' ')).not.toContain('TypeError')
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
