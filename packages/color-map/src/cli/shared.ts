import { CliError, exitCodes } from 'clibuilder/axi'
import { type Color, type ColorSpaceId, parseExpr, resolve, toCss, toHex } from '../color/index.js'

/** Every space `convert` can target, with the CSS names. */
export const SPACES = [
	'srgb',
	'srgb-linear',
	'hsl',
	'hwb',
	'lab',
	'lch',
	'oklab',
	'oklch',
	'display-p3',
	'display-p3-linear',
	'a98-rgb',
	'prophoto-rgb',
	'rec2020',
	'xyz-d50',
	'xyz-d65'
] as const satisfies readonly ColorSpaceId[]

/** The bounded RGB spaces a color can be mapped into. */
export const GAMUTS = [
	'srgb',
	'srgb-linear',
	'display-p3',
	'display-p3-linear',
	'a98-rgb',
	'prophoto-rgb',
	'rec2020'
] as const

export const PRESETS = ['tailwind-11', 'radix-12', 'tone-13', 'even'] as const
export const MODES = ['light', 'dark'] as const
export const HUE_METHODS = ['shorter', 'longer', 'increasing', 'decreasing'] as const
export const EXPORT_TARGETS = ['dtcg', 'css', 'tailwind'] as const
export const EXPORT_SOURCES = ['palette', 'scale'] as const
export const POLAR_SPACES = ['hsl', 'hwb', 'lch', 'oklch'] as const

/** Round to `digits` decimals; keeps TOON tables short. */
export const round = (n: number, digits = 2): number => Number(n.toFixed(digits))

/**
 * Reads a color from its CSS text: any Color 4 form, plus `color-mix()`,
 * relative colors and `light-dark()` (resolved for the light scheme).
 * Fails with a coded usage error that names the text.
 */
export function readColor(text: string, name = 'color'): Color {
	try {
		return resolve(parseExpr(text), { colorScheme: 'light' })
	} catch (cause) {
		throw new CliError(`cannot read ${name} "${text}" as a CSS color`, {
			code: 'invalid-color',
			exitCode: exitCodes.usage,
			details: { [name]: text, reason: (cause as Error).message },
			help: 'Pass a CSS color such as "#3b82f6", "oklch(0.7 0.15 250)" or "color-mix(in oklab, red, blue)"'
		})
	}
}

/** A color as the essential fields: CSS text and hex. `--full` adds the parts. */
export function describe(color: Color, full: boolean): Record<string, string | number | boolean | null> {
	const base = { css: toCss(color), hex: toHex(color) }
	if (!full) return base
	return {
		...base,
		space: color.colorSpace,
		components: color.components.map((c) => (c === null ? 'none' : round(c, 5))).join(' '),
		alpha: color.alpha === undefined ? 1 : color.alpha
	}
}
