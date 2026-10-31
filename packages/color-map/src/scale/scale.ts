import type { GamutId } from '../color/gamut.js'
import { toGamut } from '../color/gamut.js'
import { toColor } from '../color/parse.js'
import { componentsIn } from '../color/spaces.js'
import type { Color } from '../color/types.js'
import { MATERIAL_TONES, toneColor } from './tone.js'

/** The built-in step curves. */
export type ScalePreset = 'tailwind-11' | 'radix-12' | 'tone-13' | 'even'

/** A step curve. `chroma` and `hueShift` are relative to the step at `anchor`, which takes the seed's own. */
interface Curve {
	/** OKLCH lightness 0 to 1, or CIE L* tones 0 to 100 when `tone` is set. */
	lightness: number[]
	chroma: number[]
	hueShift: number[]
	anchor: number
	tone?: boolean
}

// Tailwind v4 blue, 50 to 950. The preset is this one hand-tuned scale, so a
// seed of blue-500 gives Tailwind's blue back, and other hues get its shape.
// biome-ignore lint/suspicious/noApproximativeNumericConstant: 0.707 is Tailwind blue-400's lightness, not 1/sqrt(2)
const TW_L = [0.97, 0.932, 0.882, 0.809, 0.707, 0.623, 0.546, 0.488, 0.424, 0.379, 0.282]
const TW_C = [0.014, 0.032, 0.059, 0.105, 0.165, 0.214, 0.245, 0.243, 0.199, 0.146, 0.091]
const TW_H = [254.604, 255.585, 254.128, 251.813, 254.624, 259.815, 262.881, 264.376, 265.638, 265.522, 267.935]

// Radix-like light scale: step 9 is the pure solid, 11 and 12 are text.
const RADIX_L = [0.992, 0.978, 0.953, 0.925, 0.894, 0.857, 0.81, 0.745, 0.62, 0.585, 0.52, 0.32]
const RADIX_C = [0.04, 0.08, 0.2, 0.32, 0.43, 0.52, 0.6, 0.75, 1, 0.95, 0.9, 0.35]

function even(n: number): Curve {
	const t = (i: number) => i / (n - 1)
	const bell = (i: number) => Math.sin(Math.PI * (0.05 + 0.9 * t(i)))
	const anchor = Math.round((n - 1) / 2)
	return {
		lightness: Array.from({ length: n }, (_, i) => 0.97 - 0.72 * t(i)),
		chroma: Array.from({ length: n }, (_, i) => bell(i) / bell(anchor)),
		hueShift: Array.from({ length: n }, () => 0),
		anchor
	}
}

const PRESETS: Record<string, Curve> = {
	__proto__: null as never,
	'tailwind-11': {
		lightness: TW_L,
		chroma: TW_C.map((c) => c / TW_C[5]),
		hueShift: TW_H.map((h) => h - TW_H[5]),
		anchor: 5
	},
	'radix-12': {
		lightness: RADIX_L,
		chroma: RADIX_C,
		hueShift: RADIX_L.map(() => 0),
		anchor: 8
	},
	'tone-13': {
		lightness: [...MATERIAL_TONES].reverse(),
		chroma: MATERIAL_TONES.map(() => 1),
		hueShift: MATERIAL_TONES.map(() => 0),
		anchor: 6,
		tone: true
	}
}

export interface ScaleOptions {
	/** The color the scale is built around. Its hue and chroma set the anchor step. */
	seed: Color | string
	/**
	 * A preset, or a number of steps for an even scale. Default `tailwind-11`.
	 * `tone-13` steps are CIE L* tones, so any two steps whose tones differ by
	 * 40 reach contrast 3 and by 50 about 4.5.
	 */
	steps?: ScalePreset | number
	/** Overrides the curve's lightness, one per step: OKLCH L 0 to 1 (L* tones 0 to 100 for `tone-13`). */
	lightness?: number[]
	/** Overrides chroma, as a multiplier of the seed's chroma, one per step. */
	chroma?: number[]
	/** Overrides hue drift, as degrees added to the seed's hue, one per step; a number is applied to every step. */
	hueShift?: number[] | number
	/** The gamut every step must fit. Default `srgb`. */
	gamut?: GamutId
}

function curveOf(steps: ScalePreset | number): Curve {
	if (typeof steps === 'number') {
		if (!Number.isInteger(steps) || steps < 2) throw new Error(`steps must be an integer of at least 2, got ${steps}`)
		return even(steps)
	}
	return steps === 'even' ? even(11) : PRESETS[steps]
}

/**
 * Builds a scale from light to dark around `seed`: one color per step, in
 * OKLCH, mapped into `gamut`. The preset gives each step's lightness, chroma
 * (relative to the seed's) and hue drift; pass `lightness`, `chroma` or
 * `hueShift` to replace any of them.
 */
export function createScale(options: ScaleOptions): Color[] {
	const { seed, steps = 'tailwind-11', gamut = 'srgb' } = options
	const curve = curveOf(steps)
	const n = curve.lightness.length
	const pick = <T>(name: string, over: T[] | undefined, base: T[]): T[] => {
		if (over === undefined) return base
		if (over.length !== n) throw new Error(`${name} needs ${n} values, got ${over.length}`)
		return over
	}
	const lightness = pick('lightness', options.lightness, curve.lightness)
	const chroma = pick('chroma', options.chroma, curve.chroma)
	const drift =
		typeof options.hueShift === 'number' ? curve.lightness.map(() => options.hueShift as number) : options.hueShift
	const hueShift = pick('hueShift', drift, curve.hueShift)

	const [, seedC, seedH] = componentsIn(toColor(seed), 'oklch') as [number, number, number | null]
	const hue = seedH ?? 0
	return lightness.map((l, i) => {
		const c = seedC * (chroma[i] as number)
		const h = hue + (hueShift[i] as number)
		return curve.tone ? toneColor(l, c, h, gamut) : toGamut({ colorSpace: 'oklch', components: [l, c, h] }, { gamut })
	})
}
