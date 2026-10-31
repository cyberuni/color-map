import { type GamutId, toGamut } from '../color/gamut.js'
import { componentsIn } from '../color/spaces.js'
import type { Color } from '../color/types.js'
import { unknownName } from '../color/unknown-name.js'
import { lstar, toneColor } from '../scale/tone.js'

export type DarkStrategy = 'mirror' | 'tone-swap' | 'lightness-invert'

const STRATEGIES: readonly string[] = ['mirror', 'tone-swap', 'lightness-invert']

export interface DarkVariantOptions {
	/** The gamut every color must fit. Default `srgb`. */
	gamut?: GamutId
}

/**
 * A dark version of a light scale (ordered light to dark), with the same
 * number of steps.
 * - `mirror`: step n takes the color of step N+1-n, so the scale runs dark to
 *   light and step 1 is the old last step. Colors are unchanged.
 * - `tone-swap`: each color keeps its OKLCH hue and chroma and takes the CIE
 *   L* tone 100 minus its own, as Material swaps tone 40 for 80. Contrast
 *   between two steps is kept roughly the same.
 * - `lightness-invert`: OKLCH lightness is reflected within the scale's own
 *   range, keeping step order, with chroma eased by 10% to curb vibration on
 *   dark backgrounds.
 */
export function darkVariant(
	scale: readonly Color[],
	strategy: DarkStrategy = 'tone-swap',
	options: DarkVariantOptions = {}
): Color[] {
	const { gamut = 'srgb' } = options
	if (!STRATEGIES.includes(strategy)) throw unknownName('dark variant strategy', strategy, STRATEGIES)
	if (strategy === 'mirror') return [...scale].reverse()
	if (strategy === 'tone-swap') {
		return scale.map((c) => {
			const [, chroma, hue] = componentsIn(c, 'oklch') as [number, number, number | null]
			return withAlpha(toneColor(100 - lstar(c), chroma, hue ?? 0, gamut), c)
		})
	}
	const oklch = scale.map((c) => componentsIn(c, 'oklch') as [number, number, number | null])
	const ls = oklch.map((c) => c[0])
	const sum = Math.min(...ls) + Math.max(...ls)
	return scale.map((c, i) => {
		const [l, chroma, hue] = oklch[i] as [number, number, number | null]
		return withAlpha(toGamut({ colorSpace: 'oklch', components: [sum - l, chroma * 0.9, hue] }, { gamut }), c)
	})
}

function withAlpha(color: Color, from: Color): Color {
	return from.alpha === undefined ? color : { ...color, alpha: from.alpha }
}
