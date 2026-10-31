import { type GamutId, toGamut } from '../color/gamut.js'
import { normalizeHue } from '../color/math.js'
import { toColor } from '../color/parse.js'
import { convert } from '../color/spaces.js'
import type { Color } from '../color/types.js'

type ColorInput = Color | string

/** The hue rotations, in degrees, that each scheme adds to the base color. */
const SCHEMES = {
	__proto__: null,
	complementary: [0, 180],
	split: [0, 150, 210],
	analogous: [-30, 0, 30],
	triadic: [0, 120, 240],
	tetradic: [0, 90, 180, 270]
} as const

export type HarmonyScheme = keyof typeof SCHEMES

/** Spaces with a hue channel that a scheme can rotate in. */
export type HarmonySpace = 'oklch' | 'lch' | 'hsl' | 'hwb'

export interface HarmonyOptions {
	/** The space whose hue is rotated. Default `oklch`, which keeps perceived lightness steady. */
	space?: HarmonySpace
	/** The gamut every color must fit. Default `srgb`. */
	gamut?: GamutId
}

const hueIndex = (space: HarmonySpace): number => (space === 'hsl' || space === 'hwb' ? 0 : 2)

/**
 * The colors of a harmony: `color` rotated around the hue wheel of `space`,
 * with lightness and chroma held, in the order of the scheme's angles
 * (`complementary` 0 and 180; `split` 0, 150, 210; `analogous` -30, 0, 30;
 * `triadic` 0, 120, 240; `tetradic` 0, 90, 180, 270). The color itself is the
 * entry at angle 0, returned as given. Rotated colors are mapped into `gamut`.
 * The same angle looks different in `hsl` and `oklch`, so name the space.
 */
export function harmony(color: ColorInput, scheme: HarmonyScheme, options: HarmonyOptions = {}): Color[] {
	const { space = 'oklch', gamut = 'srgb' } = options
	const angles = SCHEMES[scheme]
	if (!angles) throw new Error(`unknown harmony scheme "${scheme}"`)
	const base = toColor(color)
	const inSpace = convert(base, space)
	const at = hueIndex(space)
	const hue = (inSpace.components[at] as number | null) ?? 0
	return angles.map((angle) => {
		if (angle === 0) return base
		const components = [...inSpace.components]
		components[at] = normalizeHue(hue + angle)
		return toGamut({ ...inSpace, components }, { gamut })
	})
}

export interface HarmonizeOptions {
	/** The most the hue may move, in degrees. Default 15. */
	max?: number
	/** The share of the hue difference to move. Default 0.5. */
	factor?: number
	/** The gamut the result must fit. Default `srgb`. */
	gamut?: GamutId
}

/**
 * Nudges `color`'s hue toward `toward`, as Material's `Blend.harmonize` does:
 * by half the hue difference, but at most 15 degrees, in OKLCH, keeping
 * lightness and chroma. Use it to make a status color feel at home with a
 * brand color without changing its meaning.
 */
export function harmonize(color: ColorInput, toward: ColorInput, options: HarmonizeOptions = {}): Color {
	const { max = 15, factor = 0.5, gamut = 'srgb' } = options
	const from = convert(toColor(color), 'oklch')
	const to = convert(toColor(toward), 'oklch')
	const h0 = (from.components[2] as number | null) ?? 0
	const h1 = (to.components[2] as number | null) ?? h0
	// Signed shortest way round, -180 to 180.
	const diff = normalizeHue(h1 - h0 + 180) - 180
	const rotation = Math.min(Math.abs(diff) * factor, max) * Math.sign(diff)
	const components = [...from.components]
	components[2] = normalizeHue(h0 + rotation)
	return toGamut({ ...from, components }, { gamut })
}

/**
 * The opposite of a color. `lightness` flips OKLCH lightness (L becomes 1 - L)
 * and keeps hue and chroma, so light turns dark without changing its hue;
 * `rgb` inverts each sRGB channel, which also turns the hue to its complement.
 * Alpha is kept. The result is mapped into sRGB.
 */
export function inverse(color: ColorInput, mode: 'lightness' | 'rgb' = 'lightness'): Color {
	const base = toColor(color)
	if (mode === 'rgb') {
		const c = convert(base, 'srgb')
		return toGamut({ ...c, components: c.components.map((x) => 1 - (x as number)) })
	}
	const c = convert(base, 'oklch')
	return toGamut({ ...c, components: [1 - (c.components[0] as number), c.components[1], c.components[2]] })
}
