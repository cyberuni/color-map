import { convert } from './spaces.js'
import type { Color, ColorSpaceId, Component } from './types.js'

export interface ToCssOptions {
	/** Decimal places kept in every number. Default 5. */
	precision?: number
}

/** Prints a number with at most `precision` decimals, without `-0` or trailing zeros. */
function num(n: number, precision: number): string {
	return String(Number(n.toFixed(precision)) + 0)
}

const part = (c: Component, precision: number, scale = 1, suffix = ''): string =>
	c === null ? 'none' : num(c * scale, precision) + suffix

const RECTANGULAR = new Set<ColorSpaceId>(['hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch'])

/**
 * Serializes a color as CSS. `srgb` and `hsl` print in the comma syntax
 * (`rgb(255, 0, 0)`, `rgba(...)`) unless a component is `none`; the other
 * spaces print in the space syntax (`oklch(0.7 0.1 200 / 0.5)`,
 * `color(display-p3 1 0 0)`). Out-of-gamut values are kept, not clipped.
 */
export function toCss(color: Color, options: ToCssOptions = {}): string {
	const { precision = 5 } = options
	const id = color.colorSpace
	const [c0, c1, c2] = color.components
	const p = (c: Component, scale?: number, suffix?: string): string => part(c, precision, scale, suffix)
	const hasAlpha = color.alpha !== undefined && color.alpha !== 1
	const a = hasAlpha ? p(color.alpha as Component) : undefined
	const percent = id === 'hsl' || id === 'hwb' ? '%' : ''
	const scale = id === 'srgb' ? 255 : 1
	const args = [p(c0, scale), p(c1, scale, percent), p(c2, scale, percent)]
	if ((id === 'srgb' || id === 'hsl') && color.alpha !== null && !color.components.includes(null)) {
		const name = id === 'srgb' ? 'rgb' : 'hsl'
		return a === undefined ? `${name}(${args.join(', ')})` : `${name}a(${args.join(', ')}, ${a})`
	}
	const head = id === 'srgb' ? 'rgb(' : RECTANGULAR.has(id) ? `${id}(` : `color(${id} `
	return `${head}${args.join(' ')}${a === undefined ? '' : ` / ${a}`})`
}

const hexByte = (n: number): string =>
	Math.min(255, Math.max(0, Math.round(n * 255)))
		.toString(16)
		.padStart(2, '0')

/**
 * The hex form of a color, `#rrggbb` or `#rrggbbaa` when it is not opaque.
 * Colors outside sRGB are converted and clipped, so map them with `toGamut` first.
 */
export function toHex(color: Color): string {
	const [r, g, b] = convert(color, 'srgb').components as number[]
	const alpha = color.alpha ?? 1
	return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}${alpha === 1 ? '' : hexByte(alpha)}`
}
