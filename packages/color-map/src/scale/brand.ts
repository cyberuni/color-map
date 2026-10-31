import type { GamutId } from '../color/gamut.js'
import { toGamut } from '../color/gamut.js'
import { parse } from '../color/parse.js'
import { convert } from '../color/spaces.js'
import type { Color } from '../color/types.js'

export interface BrandScaleOptions {
	/** `light` runs from a near-white step 1 to dark text; `dark` the other way. Default `light`. */
	mode?: 'light' | 'dark'
	/** The page background, whose lightness step 1 takes. Default near-white, or near-black in `dark`. */
	background?: Color | string
	/** The gamut steps other than 9 must fit. Default `srgb`. */
	gamut?: GamutId
}

// Radix-like lightness shapes, steps 1 to 9, as fractions of the way from
// step 1 to step 9; chroma of steps 1 to 8 as multiples of the brand's.
const LIGHT_PROGRESS = [0, 0.0376, 0.1, 0.1796, 0.2606, 0.3466, 0.4656, 0.6312, 1]
const CHROMA = [0.04, 0.08, 0.2, 0.32, 0.43, 0.52, 0.6, 0.75]

/**
 * A 12-step UI scale from one brand color, after Radix's palette generator:
 * the brand color is step 9 exactly (returned as given, never remapped), steps
 * 1 to 8 run from the background to it, step 10 is its hover state, and steps
 * 11 and 12 are low- and high-contrast text. Hue is the brand's throughout.
 * Radix's generator also borrows the shape of the nearest of its hand-tuned
 * scales; this one uses a single fixed shape instead.
 */
export function scaleFromBrand(brand: Color | string, options: BrandScaleOptions = {}): Color[] {
	const { mode = 'light', gamut = 'srgb' } = options
	const dark = mode === 'dark'
	const exact = typeof brand === 'string' ? parse(brand) : brand
	const [l9, c9, h9] = convert(exact, 'oklch').components as [number, number, number | null]
	const hue = h9 ?? 0
	const bg = options.background
	const l1 = bg
		? (convert(typeof bg === 'string' ? parse(bg) : bg, 'oklch').components[0] as number)
		: dark
			? 0.18
			: 0.992
	const step = (l: number, c: number): Color => toGamut({ colorSpace: 'oklch', components: [l, c, hue] }, { gamut })

	const out: Color[] = []
	for (let i = 0; i < 8; i++) out.push(step(l1 + (l9 - l1) * (LIGHT_PROGRESS[i] as number), c9 * (CHROMA[i] as number)))
	out.push(exact)
	const hover = 0.03 / (l9 + 0.1)
	out.push(step(dark ? l9 + hover : l9 - hover, c9 * 0.93))
	const c8 = c9 * (CHROMA[7] as number)
	out.push(step(dark ? 0.78 : 0.5, Math.min(c9 * 0.9, Math.max(c8, c9))))
	out.push(step(dark ? 0.93 : 0.3, Math.min(c9 * 0.35, Math.max(c8, c9))))
	return out
}
