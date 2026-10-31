import { normalizeHue } from './math.js'
import { toColor } from './parse.js'
import { convert } from './spaces.js'
import type { Color, ColorSpaceId } from './types.js'
import { unknownName } from './unknown-name.js'

/** How `mix` travels around the hue circle (CSS Color 4 section 12.4). */
export type HueMethod = 'shorter' | 'longer' | 'increasing' | 'decreasing'

export interface MixOptions {
	/** The space to interpolate in. Default `oklab`, which is what `color-mix()` uses. */
	in?: ColorSpaceId
	/** How hues are interpolated, in the polar spaces. Default `shorter`. */
	hue?: HueMethod
}

/** Index of the hue component, for the polar spaces. */
const HUE_AT: Record<string, number> = { __proto__: null as never, hsl: 0, hwb: 0, lch: 2, oklch: 2 }

/**
 * Which components are "analogous" (CSS Color 4 section 4.4): a `none` in one
 * space carries to the analogous component of another. One letter per
 * component; the RGB spaces share `RGB` and the XYZ ones `XYZ`.
 */
const ANALOGOUS: Record<string, string> = {
	__proto__: null as never,
	hsl: 'hcl',
	hwb: 'hwk',
	lab: 'lab',
	lch: 'lch',
	oklab: 'lab',
	oklch: 'lch',
	'xyz-d50': 'XYZ',
	'xyz-d65': 'XYZ'
}
const analogous = (id: ColorSpaceId): string => ANALOGOUS[id] ?? 'RGB'

/** Converts, keeping `none` on components that have an analogous one in the source. */
export function convertKeepingNone(color: Color, space: ColorSpaceId): Color {
	const out = convert(color, space)
	if (color.colorSpace !== space) {
		const from = analogous(color.colorSpace)
		const to = analogous(space)
		out.components = out.components.map((c, i) => (color.components[from.indexOf(to[i])] === null ? null : c))
	}
	return out
}

/**
 * Chroma below which a converted hue is powerless and so `none`, per polar
 * space. Follows colorjs.io, which treats a hue as powerless when both Lab
 * axes are under 1/100000 of their reference extent: 0.8 for Oklab (a, b in
 * -0.4 to 0.4) gives 8e-6, 250 for Lab (-125 to 125) gives 0.0025.
 */
const POWERLESS: Record<string, number> = { __proto__: null as never, oklch: 8e-6, lch: 0.0025, hsl: 1e-4 }

/**
 * Converts for interpolation. A hue that conversion produced for a gray
 * becomes `none`, so it takes the other color's hue; a hue the author wrote
 * (the color already in `space`) stays as written.
 */
function prepare(color: Color, space: ColorSpaceId): Color {
	const out = convertKeepingNone(color, space)
	if (color.colorSpace === space) return out
	const [, x, y] = out.components
	const epsilon = POWERLESS[space]
	const gray =
		typeof x === 'number' &&
		(space === 'hwb' ? typeof y === 'number' && x + y > 100 - 1e-4 : epsilon !== undefined && x < epsilon)
	if (gray) out.components[HUE_AT[space] as number] = null
	return out
}

const HUE_METHODS = ['shorter', 'longer', 'increasing', 'decreasing']

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
	} else if (method !== 'decreasing') throw unknownName('hue method', method, HUE_METHODS)
	else if (a < b) a += 360
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
 * A hue that conversion makes powerless (chroma under 8e-6 in `oklch`, 0.0025
 * in `lch`, saturation under 1e-4 in `hsl`, whiteness plus blackness filling `hwb`; for example white) becomes `none`, so it takes the other color's
 * hue. A hue you wrote in the target space stays as written.
 */
export function mix(a: Color | string, b: Color | string, t = 0.5, options: MixOptions = {}): Color {
	const space = options.in ?? 'oklab'
	const c1 = prepare(toColor(a), space)
	const c2 = prepare(toColor(b), space)
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
