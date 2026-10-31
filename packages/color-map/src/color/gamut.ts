import { deltaEOK } from './compare.js'
import { convert } from './spaces.js'
import type { Color, ColorSpaceId } from './types.js'

/** The bounded RGB spaces a color can be tested or mapped against. */
export type GamutId =
	| 'srgb'
	| 'srgb-linear'
	| 'display-p3'
	| 'display-p3-linear'
	| 'a98-rgb'
	| 'prophoto-rgb'
	| 'rec2020'

/** True when every channel of `color`, seen in `gamut`, is within 0 to 1 (± `epsilon`). */
export function inGamut(color: Color, gamut: GamutId = 'srgb', epsilon = 1e-6): boolean {
	return convert(color, gamut).components.every((c) => (c as number) >= -epsilon && (c as number) <= 1 + epsilon)
}

export interface ToGamutOptions {
	/** The gamut to fit into. Default `srgb`. */
	gamut?: GamutId
	/** `css` is the CSS Color 4 OKLCH chroma reduction. `clip` clamps each channel. Default `css`. */
	method?: 'css' | 'clip'
}

function clip(color: Color, gamut: GamutId): Color {
	const mapped = convert(color, gamut)
	mapped.components = mapped.components.map((c) => Math.min(1, Math.max(0, c as number)))
	return mapped
}

/**
 * Maps a color into a gamut and returns it in its original space. `css` follows
 * CSS Color 4 section 13.2: reduce OKLCH chroma until the clipped color is
 * within a just-noticeable ΔEOK of 0.02.
 */
export function toGamut(color: Color, options: ToGamutOptions = {}): Color {
	const { gamut = 'srgb', method = 'css' } = options
	const back = (c: Color): Color => convert(c, color.colorSpace as ColorSpaceId)
	if (inGamut(color, gamut)) return color
	if (method === 'clip') return back(clip(color, gamut))

	const origin = convert(color, 'oklch')
	const [lightness, chroma] = origin.components as [number, number, number]
	if (lightness >= 1) return back(withAlpha({ colorSpace: gamut, components: [1, 1, 1] }, color))
	if (lightness <= 0) return back(withAlpha({ colorSpace: gamut, components: [0, 0, 0] }, color))

	const JND = 0.02
	const EPSILON = 0.0001
	const at = (c: number): Color => ({ ...origin, components: [lightness, c, origin.components[2]] })
	let min = 0
	let max = chroma
	let minInGamut = true
	let clipped = clip(origin, gamut)
	if (deltaEOK(clipped, origin) < JND) return back(clipped)
	while (max - min > EPSILON) {
		const mid = (min + max) / 2
		const current = at(mid)
		if (minInGamut && inGamut(current, gamut)) {
			min = mid
			continue
		}
		clipped = clip(current, gamut)
		const e = deltaEOK(clipped, current)
		if (e < JND) {
			if (JND - e < EPSILON) return back(clipped)
			minInGamut = false
			min = mid
		} else {
			max = mid
		}
	}
	// The search ended by narrowing to EPSILON rather than by an early return. A
	// sweep of 88,000 colors never gets here, but the algorithm allows it.
	/* v8 ignore next */
	return back(clipped)
}

function withAlpha(c: Color, source: Color): Color {
	if (source.alpha !== undefined) c.alpha = source.alpha
	return c
}
