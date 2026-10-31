import { type GamutId, inGamut } from '../color/gamut.js'
import { componentsIn } from '../color/spaces.js'
import type { Color } from '../color/types.js'

/** CIE L* (0 to 100) of a color: its relative luminance on the CIELAB lightness curve. */
export function lstar(color: Color): number {
	const y = Math.max(0, componentsIn(color, 'xyz-d65')[1] as number)
	return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y
}

/** Material's tones: 0 is black, 100 is white. */
export const MATERIAL_TONES: readonly number[] = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]

export interface TonalPaletteOptions {
	/** The gamut the colors must fit. Default `srgb`. */
	gamut?: GamutId
}

/**
 * The color at CIE L* `tone` with the given OKLCH hue and chroma, mapped into
 * the gamut. OKLCH lightness is searched until the *mapped* color lands on
 * `tone`, so chroma tapers where the gamut narrows and the tone stays true.
 */
export function toneColor(tone: number, chroma: number, hue: number, gamut: GamutId = 'srgb'): Color {
	if (tone <= 0) return { colorSpace: 'oklch', components: [0, 0, hue] }
	if (tone >= 100) return { colorSpace: 'oklch', components: [1, 0, hue] }
	// The hue is fixed, so its cosine and sine are taken once: OKLCH converts by
	// way of OKLab with exactly these products, so the results are the same.
	const r = (hue * Math.PI) / 180
	const cos = Math.cos(r)
	const sin = Math.sin(r)
	const lab = (l: number, c: number): Color => ({ colorSpace: 'oklab', components: [l, c * cos, c * sin] })
	// The most chroma, up to `chroma`, that fits at this lightness; no clipping, so L* is monotone in L.
	const chromaAt = (l: number): number => {
		if (inGamut(lab(l, chroma), gamut)) return chroma
		let [lo, hi] = [0, chroma]
		for (let i = 0; i < 24; i++) {
			const mid = (lo + hi) / 2
			if (inGamut(lab(l, mid), gamut)) lo = mid
			else hi = mid
		}
		return lo
	}
	let lo = 0
	let hi = 1
	for (let i = 0; i < 40; i++) {
		const mid = (lo + hi) / 2
		if (lstar(lab(mid, chromaAt(mid))) < tone) lo = mid
		else hi = mid
	}
	const l = (lo + hi) / 2
	return { colorSpace: 'oklch', components: [l, chromaAt(l), hue] }
}

/**
 * A tonal palette, as in Material: one OKLCH hue and chroma held across L*
 * tones. Two colors whose tones differ by 40 or more reach WCAG 2 contrast 3,
 * and by 50 or more about 4.5 (4.48 at the worst pair, 100 against 50), so a
 * pair can be picked by tone alone. Default tones are Material's 13.
 */
export function tonalPalette(
	hue: number,
	chroma: number,
	tones: readonly number[] = MATERIAL_TONES,
	options: TonalPaletteOptions = {}
): Color[] {
	return tones.map((t) => toneColor(t, chroma, hue, options.gamut))
}
