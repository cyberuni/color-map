import { normalizeHue } from './math.js'
import { parse } from './parse.js'
import { convert } from './spaces.js'
import type { Color, ColorSpaceId } from './types.js'

/** How `mix` travels around the hue circle (CSS Color 4 section 12.4). */
export type HueMethod = 'shorter' | 'longer' | 'increasing' | 'decreasing'

export interface MixOptions {
	/** The space to interpolate in. Default `oklab`, which is what `color-mix()` uses. */
	in?: ColorSpaceId
	/** How hues are interpolated, in the polar spaces. Default `shorter`. */
	hue?: HueMethod
}

/** Index of the hue component, for the polar spaces. */
const HUE_AT: Partial<Record<ColorSpaceId, number>> = { hsl: 0, hwb: 0, lch: 2, oklch: 2 }

const RGB = ['R', 'G', 'B']
const XYZ = ['X', 'Y', 'Z']
/**
 * Which components are "analogous" (CSS Color 4 section 4.4): a `none` in one
 * space carries to the analogous component of another.
 */
const ANALOGOUS: Record<ColorSpaceId, string[]> = {
	srgb: RGB,
	'srgb-linear': RGB,
	'display-p3': RGB,
	'display-p3-linear': RGB,
	'a98-rgb': RGB,
	'prophoto-rgb': RGB,
	rec2020: RGB,
	'xyz-d50': XYZ,
	'xyz-d65': XYZ,
	hsl: ['h', 'c', 'l'],
	hwb: ['h', 'w', 'k'],
	lab: ['l', 'a', 'b'],
	lch: ['l', 'c', 'h'],
	oklab: ['l', 'a', 'b'],
	oklch: ['l', 'c', 'h']
}

/** Converts, keeping `none` on components that have an analogous one in the source. */
export function convertKeepingNone(color: Color, space: ColorSpaceId): Color {
	const out = convert(color, space)
	if (color.colorSpace !== space) {
		const from = ANALOGOUS[color.colorSpace]
		const to = ANALOGOUS[space]
		out.components = out.components.map((c, i) => (color.components[from.indexOf(to[i])] === null ? null : c))
	}
	return out
}

/** Fixes up two hues so they interpolate by `method` (section 12.4). */
function fixHues(h1: number, h2: number, method: HueMethod): [number, number] {
	let a = normalizeHue(h1)
	let b = normalizeHue(h2)
	const d = b - a
	if (method === 'shorter') {
		if (d > 180) a += 360
		else if (d < -180) b += 360
	} else if (method === 'longer') {
		if (d > 0 && d < 180) a += 360
		else if (d > -180 && d <= 0) b += 360
	} else if (method === 'increasing') {
		if (b < a) b += 360
	} else if (a < b) a += 360
	return [a, b]
}

/** A `none` takes the other side's value; both `none` stays `none`. */
function carry(x: number | null, y: number | null): [number | null, number | null] {
	return [x ?? y, y ?? x]
}

/**
 * Interpolates two colors the way CSS does (Color 4 section 13): in the space
 * `in`, with premultiplied alpha, `none` taking the other color's value, and
 * the chosen hue method. `t` is the weight of `b`, 0 to 1 (outside it
 * extrapolates). Strings are parsed with `parse`.
 *
 * Hues that are only powerless (for example white in `oklch`) are not treated
 * as `none`; write `none` to get that.
 */
export function mix(a: Color | string, b: Color | string, t = 0.5, options: MixOptions = {}): Color {
	const space = options.in ?? 'oklab'
	const c1 = convertKeepingNone(typeof a === 'string' ? parse(a) : a, space)
	const c2 = convertKeepingNone(typeof b === 'string' ? parse(b) : b, space)
	const [a1, a2] = carry(c1.alpha === undefined ? 1 : c1.alpha, c2.alpha === undefined ? 1 : c2.alpha)
	const p1 = a1 ?? 1
	const p2 = a2 ?? 1
	const alpha = p1 * (1 - t) + p2 * t
	const hueAt = HUE_AT[space]
	const components = c1.components.map((x, i) => {
		const [u, v] = carry(x, c2.components[i])
		if (u === null || v === null) return null
		if (i === hueAt) {
			const [h1, h2] = fixHues(u, v, options.hue ?? 'shorter')
			return normalizeHue(h1 * (1 - t) + h2 * t)
		}
		const premultiplied = u * p1 * (1 - t) + v * p2 * t
		return alpha === 0 ? premultiplied : premultiplied / alpha
	})
	const result: Color = { colorSpace: space, components }
	if (a1 === null || alpha !== 1) result.alpha = a1 === null ? null : alpha
	return result
}
