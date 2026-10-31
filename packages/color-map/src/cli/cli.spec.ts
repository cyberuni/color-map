import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { commands } from './cli.js'
import { run, runJson } from './testing.js'

describe('home', () => {
	test('lists the commands and next steps', async () => {
		const { json, code } = await runJson()
		expect(code).toBe(0)
		expect(json.commands).toEqual([...commands.map((c) => c.name), 'schema'])
		expect(json.help.length).toBeGreaterThan(0)
	})
	test('prints TOON by default', async () => {
		const { out } = await run()
		expect(out).toContain('commands[')
	})
})

describe('convert', () => {
	test('converts to the target space', async () => {
		const { json } = await runJson('convert', '#3b82f6', '--to', 'oklch')
		expect(json.css).toBe('oklch(0.62308 0.18801 259.81453)')
		expect(json.hex).toBe('#3b82f6')
		expect(json.components).toBeUndefined()
	})
	test('--full adds the parts and gamut flags', async () => {
		const { json } = await runJson('convert', 'oklch(0.7 0.3 150)', '--to', 'srgb', '--full')
		expect(json.space).toBe('srgb')
		expect(json.inSrgb).toBe(false)
		expect(json.inDisplayP3).toBe(false)
		expect(json.alpha).toBe(1)
	})
	test('--gamut maps an out-of-gamut color in', async () => {
		const { json } = await runJson('convert', 'oklch(0.7 0.3 150)', '--gamut', 'srgb', '--full')
		expect(json.inSrgb).toBe(true)
	})
	test('prints none components and alpha', async () => {
		const { json } = await runJson('convert', 'oklch(0.7 none 150 / 0.5)', '--to', 'oklch', '--full')
		expect(json.components).toBe('0.7 none 150')
		expect(json.alpha).toBe(0.5)
	})
	test('reads color-mix()', async () => {
		const { json } = await runJson('convert', 'color-mix(in srgb, #000, #fff)')
		expect(json.hex).toBe('#808080')
	})
	test('a bad color is a coded usage error', async () => {
		const { json, code } = await runJson('convert', 'nope')
		expect(code).toBe(2)
		expect(json.code).toBe('invalid-color')
		expect(json.color).toBe('nope')
	})
	test('a non-Error cause is stringified', async () => {
		// currentcolor needs a context, so it fails inside the library
		const { json } = await runJson('convert', 'currentcolor')
		expect(json.reason).toContain('currentColor')
	})
})

describe('mix', () => {
	test('mixes in a space', async () => {
		const { json } = await runJson('mix', '#000', '#fff', '--in', 'srgb')
		expect(json.hex).toBe('#808080')
		expect(json.in).toBe('srgb')
		expect(json.amount).toBe(0.5)
	})
	test('takes an amount and --full', async () => {
		const { json } = await runJson('mix', 'red', 'blue', '--amount', '0.25', '--full')
		expect(json.amount).toBe(0.25)
		expect(json.space).toBe('oklab')
	})
	test('names which color was bad', async () => {
		const { json } = await runJson('mix', 'red', 'nope')
		expect(json.b).toBe('nope')
	})
	test('rejects an amount out of range', async () => {
		const { code } = await run('mix', 'red', 'blue', '--amount', '2')
		expect(code).toBe(2)
	})
})

describe('contrast', () => {
	test('reports the WCAG 2 ratio and verdicts', async () => {
		const { json } = await runJson('contrast', '#000', '#fff')
		expect(json).toMatchObject({ algorithm: 'wcag2', ratio: 21, AA: true, AAA: true })
		expect(json.help).toBeUndefined()
	})
	test('suggests find-contrast when AA fails', async () => {
		const { json } = await runJson('contrast', '#777', '#fff')
		expect(json.AA).toBe(false)
		expect(json['AA-large']).toBe(true)
		expect(json.help[0]).toContain('find-contrast')
	})
	test('has no APCA path', async () => {
		const { code } = await run('contrast', '#000', '#fff', '--contrast', 'apca')
		expect(code).toBe(2)
		expect(commands.map((c) => JSON.stringify(c.options)).join()).not.toMatch(/apca/i)
	})
})

describe('find-contrast', () => {
	test('finds a color that reaches the target', async () => {
		const { json } = await runJson('find-contrast', '#fff', '--target', '7', '--hue', '250', '--chroma', '0.1')
		expect(json.met).toBe(true)
		expect(json.ratio).toBeGreaterThanOrEqual(7)
	})
	test('reports when no color can reach it', async () => {
		const { json } = await runJson('find-contrast', '#808080', '--target', '21', '--direction', 'lighter', '--full')
		expect(json.met).toBe(false)
		expect(json.space).toBeDefined()
	})
})

describe('scale', () => {
	test('a preset gives steps with contrast on white and black', async () => {
		const { json } = await runJson('scale', '#3b82f6')
		expect(json.kind).toBe('tailwind-11')
		expect(json.steps).toHaveLength(11)
		expect(Object.keys(json.steps[0])).toEqual(['step', 'hex', 'onWhite', 'onBlack'])
	})
	test('--full adds css and gamut', async () => {
		const { json } = await runJson('scale', '#3b82f6', '--preset', 'tone-13', '--full')
		expect(json.steps).toHaveLength(13)
		expect(json.steps[0].inSrgb).toBe(true)
	})
	test('--steps makes an even scale', async () => {
		const { json } = await runJson('scale', '#3b82f6', '--steps', '5')
		expect(json.kind).toBe('even-5')
		expect(json.steps).toHaveLength(5)
	})
	test('--brand keeps the seed as step 9', async () => {
		const { json } = await runJson('scale', '#3b82f6', '--brand', '--mode', 'dark', '--background', '#111')
		expect(json.kind).toBe('brand-12')
		expect(json.steps[8].hex).toBe('#3b82f6')
	})
	test('--targets builds a contrast scale that meets each target', async () => {
		const { json } = await runJson(
			'scale',
			'#3b82f6',
			'--targets',
			'3',
			'--targets',
			'4.5',
			'--background',
			'#fff',
			'--full'
		)
		expect(json.kind).toBe('contrast')
		expect(json.steps.map((s: any) => s.met)).toEqual([true, true])
		expect(json.steps[1].ratio).toBeGreaterThanOrEqual(4.5)
	})
	test('--targets without --full leaves out css', async () => {
		const { json } = await runJson('scale', '#3b82f6', '--targets', '3', '--background', '#fff')
		expect(json.steps[0].css).toBeUndefined()
	})
	test('--targets without --background is a usage error', async () => {
		const { json, code } = await runJson('scale', '#3b82f6', '--targets', '3')
		expect(code).toBe(2)
		expect(json.code).toBe('missing-option')
	})
	test('a library failure is reported with a code', async () => {
		const { json, code } = await runJson('scale', '#3b82f6', '--steps', '1')
		expect(code).toBe(2)
		expect(json.code).toBe('invalid-value')
		const fromLibrary = await runJson(
			'scale',
			'#3b82f6',
			'--preset',
			'even',
			'--steps',
			'2',
			'--brand',
			'--background',
			'nope'
		)
		expect(fromLibrary.json.code).toBe('invalid-color')
	})
})

describe('palette', () => {
	test('every role pair passes and no issues remain', async () => {
		const { json } = await runJson('palette', '#3b82f6')
		expect(json.failing).toBe(0)
		expect(json.passing).toBe(9)
		expect(json.roles.every((r: any) => r.pass && r.ratio >= r.target)).toBe(true)
		expect(json.issues).toMatch(/^none/)
		expect(json.primary).toBeUndefined()
	})
	test('dark mode and --full', async () => {
		const { json } = await runJson('palette', '#e11d48', '--mode', 'dark', '--full', '--target', '7')
		expect(json.mode).toBe('dark')
		expect(json.primary).toHaveLength(13)
		expect(json.help[1]).toContain('--mode light')
	})
	test('lists the issues of a palette that cannot meet its target', async () => {
		const { json } = await runJson('palette', '#3b82f6', '--target', '21')
		expect(json.failing).toBeGreaterThan(0)
		expect(json.issues[0]).toMatchObject({ kind: 'contrast' })
		const light = await runJson('palette', '#3b82f6')
		expect(light.json.help[1]).toContain('--mode dark')
	})
})

describe('harmony', () => {
	test('returns the scheme colors, the base first', async () => {
		const { json } = await runJson('harmony', '#3b82f6', '--scheme', 'tetradic')
		expect(json.colors).toHaveLength(4)
		expect(json.colors[0].hex).toBe('#3b82f6')
	})
	test('defaults to complementary', async () => {
		const { json } = await runJson('harmony', '#3b82f6')
		expect(json.colors).toHaveLength(2)
	})
})

describe('export', () => {
	test('css variables from a palette', async () => {
		const { out, code } = await run('export', '#3b82f6')
		expect(code).toBe(0)
		expect(out).toMatch(/^:root \{/)
		expect(out).toContain('--color-primary-')
	})
	test('css options', async () => {
		const { out } = await run(
			'export',
			'#3b82f6',
			'--source',
			'scale',
			'--to',
			'css',
			'--prefix',
			'brand',
			'--selector',
			'.theme',
			'--space',
			'srgb',
			'--precision',
			'2'
		)
		expect(out).toContain('.theme {')
		expect(out).toContain('--brand-primary-500:')
	})
	test('dtcg with and without hex', async () => {
		const withHex = JSON.parse((await run('export', '#3b82f6', '--source', 'scale', '--to', 'dtcg')).out)
		expect(withHex.primary['500'].$value.hex).toBe('#3b82f6')
		const without = JSON.parse((await run('export', '#3b82f6', '--source', 'scale', '--to', 'dtcg', '--hex=false')).out)
		expect(without.primary['500'].$value.hex).toBeUndefined()
	})
	test('tailwind theme', async () => {
		const { out } = await run(
			'export',
			'#3b82f6',
			'--to',
			'tailwind',
			'--mode',
			'dark',
			'--inline',
			'--namespace',
			'color',
			'--precision',
			'3'
		)
		expect(out).toMatch(/^@theme inline \{/)
	})
	test('tokens from a file', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'color-map-'))
		const file = join(dir, 'tokens.json')
		writeFileSync(file, JSON.stringify({ brand: { main: '#3b82f6' } }))
		const { out } = await run('export', '--tokens', file, '--to', 'css')
		expect(out).toContain('--color-brand-main:')
		const bad = join(dir, 'bad.json')
		writeFileSync(bad, '{')
		expect((await runJson('export', '--tokens', bad)).json.code).toBe('invalid-json')
		expect((await runJson('export', '--tokens', join(dir, 'missing.json'))).json.code).toBe('file-not-found')
		writeFileSync(file, JSON.stringify({ brand: 42 }))
		expect((await runJson('export', '--tokens', file)).json.code).toBe('export-failed')
	})
	test('needs exactly one input', async () => {
		expect((await runJson('export')).json.code).toBe('input-required')
		expect((await runJson('export', 'red', '--tokens', 'x.json')).json.code).toBe('input-required')
	})
})

describe('schema', () => {
	test('lists the commands', async () => {
		const { json } = await runJson('schema')
		expect(json.commands).toContain('palette')
	})
	test('prints the schema of one command', async () => {
		const { out } = await run('schema', 'scale')
		const schema = JSON.parse(out)
		expect(schema.properties.preset.enum).toContain('radix-12')
		expect(schema.properties.targets).toMatchObject({
			type: 'array',
			items: { type: 'number', minimum: 1, maximum: 21 }
		})
		expect(schema.properties.steps).toMatchObject({ type: 'integer', minimum: 2 })
		expect(schema.required).toEqual(['seed'])
		expect(schema.additionalProperties).toBe(false)
	})
	test('an unknown command is a usage error', async () => {
		const { json, code } = await runJson('schema', 'nope')
		expect(code).toBe(2)
		expect(json.code).toBe('unknown-command')
	})
})
