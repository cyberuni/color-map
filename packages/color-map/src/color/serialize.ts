import { componentsIn } from './spaces.js'
import type { Color, ColorSpaceId, Component } from './types.js'

export interface ToCssOptions {
	/** Decimal places kept in every number. Default 5. */
	precision?: number
}

const POWERS = Array.from({ length: 23 }, (_, i) => Number(`1e${i}`))

/**
 * `Number(n.toFixed(precision))`, without building the string. `toFixed` rounds
 * the exact value of `n` half up (away from zero), and the number it then reads
 * is `k / 10^precision` for that integer `k`, which one division gives exactly.
 * `k` comes from `t = |n| * 10^precision`. The product is rounded, but a tie
 * (`t` ending in .5) is a double, and rounding is monotonic, so any `t` that
 * is not exactly a tie lies on the same side of it as the exact product: only
 * `t` ending in .5 is left to `toFixed`. So are NaN, the infinities, products
 * of 1e9 and up, and precisions that `POWERS` lacks.
 */
export function roundTo(n: number, precision: number): number {
	const scale = POWERS[precision]
	const t = Math.abs(n) * scale
	const whole = Math.floor(t)
	const rest = t - whole
	if (t < 1e9 && rest !== 0.5) {
		const r = (rest > 0.5 ? whole + 1 : whole) / scale
		return n < 0 ? -r : r
	}
	return Number(n.toFixed(precision))
}

/** Prints a number with at most `precision` decimals, without `-0` or trailing zeros. */
function num(n: number, precision: number): string {
	return String(roundTo(n, precision) + 0)
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
	const [r, g, b] = componentsIn(color, 'srgb') as number[]
	const alpha = color.alpha ?? 1
	return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}${alpha === 1 ? '' : hexByte(alpha)}`
}
