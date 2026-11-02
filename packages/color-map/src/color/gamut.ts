import { deltaEOKWith } from './compare.js'
import { type ComponentsIn, componentsOver, convertWith } from './convert.js'
import { oklab } from './oklab.js'
import { oklch } from './oklch.js'
import { componentsIn } from './spaces.js'
import { srgb } from './srgb.js'
import type { Color, ColorSpaceId, Component, Space } from './types.js'

/** The bounded RGB spaces a color can be tested or mapped against. */
export type GamutId =
	| 'srgb'
	| 'srgb-linear'
	| 'display-p3'
	| 'display-p3-linear'
	| 'a98-rgb'
	| 'prophoto-rgb'
	| 'rec2020'

const within = (components: Component[], epsilon: number): boolean =>
	components.every((c) => (c as number) >= -epsilon && (c as number) <= 1 + epsilon)

/** True when every channel of `color`, seen in `gamut`, is within 0 to 1 (± `epsilon`). */
export function inGamut(color: Color, gamut: GamutId = 'srgb', epsilon = 1e-6): boolean {
	return within(componentsIn(color, gamut), epsilon)
}

/**
 * Builds {@link inGamut} over the spaces given, plus `srgb`, so a bundle
 * contains only those. Give the gamut too when it is not `srgb`. A color or
 * gamut in a space not given throws, naming that space.
 */
export function createInGamut(...spaces: Space[]): (color: Color, gamut?: GamutId, epsilon?: number) => boolean {
	const over = componentsOver([srgb, ...spaces])
	return (color, gamut = 'srgb', epsilon = 1e-6) => within(over(color, gamut), epsilon)
}

export interface ToGamutOptions {
	/** The gamut to fit into. Default `srgb`. */
	gamut?: GamutId
	/** `css` is the CSS Color 4 OKLCH chroma reduction. `clip` clamps each channel. Default `css`. */
	method?: 'css' | 'clip'
}

/** `color` with `components`, which are in `gamut`, clamped to 0 to 1: what `convert` then a clamp gives. */
function clipped(color: Color, gamut: GamutId, components: Component[]): Color {
	return withAlpha(
		{ colorSpace: gamut, components: components.map((c) => Math.min(1, Math.max(0, c as number))) },
		color
	)
}

/**
 * Maps a color into a gamut and returns it in its original space. `css` follows
 * CSS Color 4 section 13.2: reduce OKLCH chroma until the clipped color is
 * within a just-noticeable ΔEOK of 0.02.
 */
export function toGamut(color: Color, options: ToGamutOptions = {}): Color {
	return toGamutWith(componentsIn, color, options)
}

/**
 * Builds {@link toGamut} over the spaces given, plus `srgb`, `oklch` and
 * `oklab`, which the CSS method works in. Give the gamut too when it is not
 * `srgb`. A color or gamut in a space not given throws, naming that space.
 */
export function createToGamut(...spaces: Space[]): (color: Color, options?: ToGamutOptions) => Color {
	const over = componentsOver([srgb, oklch, oklab, ...spaces])
	return (color, options = {}) => toGamutWith(over, color, options)
}

/** {@link toGamut} over the spaces `componentsIn` knows, which must include `oklch` and `oklab`. */
export function toGamutWith(componentsIn: ComponentsIn, color: Color, options: ToGamutOptions): Color {
	const { gamut = 'srgb', method = 'css' } = options
	const deltaEOK = (a: Color, b: Color): number => deltaEOKWith(componentsIn, a, b)
	const back = (c: Color): Color => convertWith(componentsIn, c, color.colorSpace as ColorSpaceId)
	// Each candidate is converted to the gamut once, then tested and clipped from that.
	const fit = componentsIn(color, gamut)
	if (within(fit, 1e-6)) return color
	if (method === 'clip') return back(clipped(color, gamut, fit))

	const origin = convertWith(componentsIn, color, 'oklch')
	const [lightness, chroma, hue] = origin.components as [number, number, Component]
	if (lightness >= 1) return back(withAlpha({ colorSpace: gamut, components: [1, 1, 1] }, color))
	if (lightness <= 0) return back(withAlpha({ colorSpace: gamut, components: [0, 0, 0] }, color))

	const JND = 0.02
	const EPSILON = 0.0001
	let min = 0
	let max = chroma
	let minInGamut = true
	let clip = clipped(origin, gamut, componentsIn(origin, gamut))
	if (deltaEOK(clip, origin) < JND) return back(clip)
	while (max - min > EPSILON) {
		const mid = (min + max) / 2
		const current = withAlpha({ colorSpace: 'oklch', components: [lightness, mid, hue] }, origin)
		const inGamutSpace = componentsIn(current, gamut)
		if (minInGamut && within(inGamutSpace, 1e-6)) {
			min = mid
			continue
		}
		clip = clipped(current, gamut, inGamutSpace)
		const e = deltaEOK(clip, current)
		if (e < JND) {
			if (JND - e < EPSILON) return back(clip)
			minInGamut = false
			min = mid
		} else {
			max = mid
		}
	}
	// The search ended by narrowing to EPSILON rather than by an early return. A
	// sweep of 88,000 colors never gets here, but the algorithm allows it.
	/* v8 ignore next */
	return back(clip)
}

function withAlpha(c: Color, source: Color): Color {
	if (source.alpha !== undefined) c.alpha = source.alpha
	return c
}
