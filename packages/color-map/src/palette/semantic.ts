import { type ContrastOption, findContrast, wcag2 } from '../color/contrast.js'
import type { GamutId } from '../color/gamut.js'
import { parse } from '../color/parse.js'
import { convert } from '../color/spaces.js'
import type { Color } from '../color/types.js'
import { tonalPalette, toneColor } from '../scale/tone.js'
import { harmonize } from './harmony.js'

/** A background, the foreground drawn on it, and the contrast they reach. */
export interface RolePair {
	bg: Color
	fg: Color
	/** The contrast of `fg` on `bg`, as the algorithm reports it (absolute value). */
	ratio: number
	/** The contrast the pair was built to reach. */
	target: number
}

export interface SemanticPaletteOptions {
	/** The brand color; it sets the hue of the primary, the neutrals and the harmonized status colors. */
	brand: Color | string
	/** Default `light`. */
	mode?: 'light' | 'dark'
	/** The contrast measure. Default `wcag2`. */
	contrast?: ContrastOption
	/** The contrast text pairs must reach. Default 4.5, which fits WCAG 2 (pass about 60 for APCA Lc). */
	target?: number
	/** The gamut every color must fit. Default `srgb`. */
	gamut?: GamutId
}

export type SemanticRole =
	| 'primary'
	| 'primaryContainer'
	| 'success'
	| 'warning'
	| 'danger'
	| 'info'
	| 'surface'
	| 'surfaceVariant'
	| 'outline'

export interface SemanticPalette {
	meta: { mode: 'light' | 'dark'; contrast: string; target: number; gamut: GamutId }
	/** Material's 13 tones, dark to light, in the brand's hue (`primary`) and a faint tint of it (`neutral`). */
	scales: { primary: Color[]; neutral: Color[] }
	roles: Record<SemanticRole, RolePair>
}

// Tones (light, dark) per role: Material's 2021 assignments (see the research notes, B-palettes).
const BG_TONE = { primary: [40, 80], primaryContainer: [90, 30], surface: [98, 6], surfaceVariant: [90, 30] } as const
const FG_TONE = { primary: [100, 20], primaryContainer: [10, 90], surface: [10, 90], surfaceVariant: [30, 80] } as const

// OKLCH hues of the status colors, before they are harmonized toward the brand.
const STATUS = { success: 145, warning: 85, danger: 25, info: 240 } as const

/**
 * A role-based palette from one brand color: primary and its container, four
 * status colors (success, warning, danger, info) harmonized toward the brand's
 * hue, a surface and a variant tinted by the brand hue, and an outline. Every
 * pair is built from L* tones, so a 50-tone gap or more reaches about 4.5 on
 * WCAG 2 (the worst pair, 100 on 50, gives 4.48). Each pair records the ratio
 * it reached; a foreground that falls short of `target` is replaced by the
 * closest one that meets it, and `validate` reports any that cannot.
 */
export function semanticPalette(options: SemanticPaletteOptions): SemanticPalette {
	const { mode = 'light', contrast = 'wcag2', target = 4.5, gamut = 'srgb' } = options
	const fn = contrast === 'wcag2' ? wcag2 : contrast
	const dark = mode === 'dark'
	const i = dark ? 1 : 0
	const brand = typeof options.brand === 'string' ? parse(options.brand) : options.brand
	const [, c, h] = convert(brand, 'oklch').components as [number, number, number | null]
	const hue = h ?? 0
	const chroma = Math.max(c, 0.04)
	const tint = 0.015

	const pair = (bg: Color, fgTone: number, fgChroma: number, need = target): RolePair => {
		let fg = toneColor(fgTone, fgChroma, hue, gamut)
		let ratio = Math.abs(fn(fg, bg))
		if (ratio < need) {
			const found = findContrast(bg, need, { contrast: fn, chroma: fgChroma, hue })
			fg = found.color
			ratio = Math.abs(found.contrast)
		}
		return { bg, fg, ratio, target: need }
	}
	const status = (name: keyof typeof STATUS): RolePair => {
		const base = toneColor(BG_TONE.primary[i], 0.14, STATUS[name], gamut)
		return pair(harmonize(base, brand, { gamut }), FG_TONE.primary[i], 0.02)
	}
	const surface = toneColor(BG_TONE.surface[i], tint, hue, gamut)
	const outline = pair(surface, dark ? 60 : 50, tint, 3)

	return {
		meta: { mode, contrast: fn.algorithm ?? 'custom', target, gamut },
		scales: {
			primary: tonalPalette(hue, chroma, undefined, { gamut }),
			neutral: tonalPalette(hue, tint, undefined, { gamut })
		},
		roles: {
			primary: pair(toneColor(BG_TONE.primary[i], chroma, hue, gamut), FG_TONE.primary[i], 0.02),
			primaryContainer: pair(
				toneColor(BG_TONE.primaryContainer[i], chroma, hue, gamut),
				FG_TONE.primaryContainer[i],
				0.02
			),
			success: status('success'),
			warning: status('warning'),
			danger: status('danger'),
			info: status('info'),
			surface: pair(surface, FG_TONE.surface[i], tint),
			surfaceVariant: pair(toneColor(BG_TONE.surfaceVariant[i], tint, hue, gamut), FG_TONE.surfaceVariant[i], tint),
			outline
		}
	}
}
