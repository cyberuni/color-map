import { describe, expect, test } from 'vitest'
import * as color from './color/index.js'
import * as root from './index.js'
import * as legacy from './legacy/index.js'
import * as palette from './palette/index.js'
import * as scale from './scale/index.js'
import * as tokens from './tokens/index.js'

// Records the runtime names of each entry point, so adding, removing or moving
// a name shows up in review. Type-only names are not visible at runtime; the
// root's `export *` makes `tsc` fail if two subpaths ever share a type name.
const names = (mod: object) => Object.keys(mod).sort()

const subpaths = { color, scale, palette, tokens }
const rootValues = new Map(Object.entries(root))

describe('entry point names', () => {
	test('color-map/color', () => {
		expect(names(color)).toMatchInlineSnapshot(`
			[
			  "a98Rgb",
			  "contrast",
			  "convert",
			  "convertComponents",
			  "createConverter",
			  "deltaEOK",
			  "displayP3",
			  "displayP3Linear",
			  "equals",
			  "findContrast",
			  "fromArgb",
			  "hsl",
			  "hwb",
			  "inGamut",
			  "lab",
			  "lch",
			  "meets",
			  "mix",
			  "oklab",
			  "oklch",
			  "onColor",
			  "parse",
			  "parseExpr",
			  "prophotoRgb",
			  "rec2020",
			  "resolve",
			  "spaces",
			  "srgb",
			  "srgbLinear",
			  "toArgb",
			  "toCss",
			  "toGamut",
			  "toHex",
			  "wcag2",
			  "xyzD50",
			  "xyzD65",
			]
		`)
	})
	test('color-map/scale', () => {
		expect(names(scale)).toMatchInlineSnapshot(`
			[
			  "MATERIAL_TONES",
			  "createContrastScale",
			  "createScale",
			  "lstar",
			  "scaleFromBrand",
			  "tonalPalette",
			  "toneColor",
			]
		`)
	})
	test('color-map/palette', () => {
		expect(names(palette)).toMatchInlineSnapshot(`
			[
			  "darkVariant",
			  "harmonize",
			  "harmony",
			  "inverse",
			  "semanticPalette",
			  "validate",
			]
		`)
	})
	test('color-map/tokens', () => {
		expect(names(tokens)).toMatchInlineSnapshot(`
			[
			  "toCssVariables",
			  "toDTCG",
			  "toDtcgValue",
			  "toTailwindTheme",
			]
		`)
	})
	test('color-map/legacy', () => {
		expect(names(legacy)).toMatchInlineSnapshot(`
			[
			  "createColors",
			  "createColorsFromMap",
			  "rgbHex",
			  "rgbaString",
			]
		`)
	})
})

describe('color-map (the root)', () => {
	test('no name is exported by more than one of the subpaths and legacy', () => {
		const all = [...Object.values(subpaths), legacy].flatMap(names)
		expect(all.length).toBe(new Set(all).size)
	})

	test('exports exactly the four subpaths and the legacy API', () => {
		const expected = [...Object.values(subpaths), legacy].flatMap(names).sort()
		expect(names(root)).toEqual(expected)
	})

	test.each(Object.entries(subpaths))('re-exports color-map/%s as is', (_, mod) => {
		for (const [name, value] of Object.entries(mod)) expect(rootValues.get(name)).toBe(value)
	})

	test('its legacy names are the color-map/legacy functions', () => {
		for (const [name, value] of Object.entries(legacy)) expect(rootValues.get(name)).toBe(value)
	})
})
