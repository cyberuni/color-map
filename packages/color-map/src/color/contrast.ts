import { toGamut } from './gamut.js'
import { toColor } from './parse.js'
import { componentsIn } from './spaces.js'
import type { Color } from './types.js'

/**
 * A contrast measure: `(fg, bg) => number`, plus what a caller needs to use it
 * without knowing the algorithm. Any plain `(fg, bg) => number` also works
 * wherever a `ContrastFn` is taken; the extra fields are optional.
 */
export interface ContrastFn {
	(fg: Color, bg: Color): number
	/** A label for messages and output, for example `wcag2`. */
	readonly algorithm?: string
	/** Named targets, for example `{ AA: 4.5 }`, which `meets` accepts as a level. */
	readonly thresholds?: Readonly<Record<string, number>>
	/** `symmetric` when swapping fg and bg gives the same number; `signed` when the sign says which is lighter. */
	readonly polarity?: 'symmetric' | 'signed'
}

/** The contrast algorithms built in. */
export type ContrastAlgorithm = 'wcag2'

/** Either a built-in name or a {@link ContrastFn}. */
export type ContrastOption = ContrastAlgorithm | ContrastFn

type ColorInput = Color | string

/** Relative luminance (WCAG 2): the Y of the color in XYZ-D65, with white at 1. */
function luminance(color: Color): number {
	return Math.max(0, componentsIn(color, 'xyz-d65')[1] as number)
}

/** Lays a translucent color over `bg`, in `srgb`, the way a browser paints it. */
function flatten(fg: Color, bg: Color): Color {
	const alpha = fg.alpha === null ? 0 : (fg.alpha ?? 1)
	if (alpha >= 1) return fg
	const f = componentsIn(fg, 'srgb')
	const b = componentsIn(bg, 'srgb')
	return { colorSpace: 'srgb', components: f.map((x, i) => (x as number) * alpha + (b[i] as number) * (1 - alpha)) }
}

/**
 * WCAG 2 contrast ratio, 1 to 21. A translucent `fg` is laid over `bg` first;
 * `bg` is taken as opaque.
 */
export const wcag2: ContrastFn = Object.assign(
	(fg: Color, bg: Color): number => {
		const a = luminance(flatten(fg, bg)) + 0.05
		const b = luminance(bg) + 0.05
		return a > b ? a / b : b / a
	},
	{
		algorithm: 'wcag2',
		thresholds: { AA: 4.5, 'AA-large': 3, AAA: 7, 'AAA-large': 4.5, 'non-text': 3 },
		polarity: 'symmetric'
	} as const
)

const pick = (algo: ContrastOption): ContrastFn => (algo === 'wcag2' ? wcag2 : algo)

/**
 * Contrast of `fg` on `bg`. Colors may be CSS strings. The default is WCAG 2;
 * pass a {@link ContrastFn} to use another measure (see the APCA recipe).
 */
export function contrast(fg: ColorInput, bg: ColorInput, algo: ContrastOption = 'wcag2'): number {
	return pick(algo)(toColor(fg), toColor(bg))
}

/**
 * True when `fg` on `bg` reaches `level`: a number, or a name from the
 * algorithm's thresholds (WCAG 2: `AA`, `AA-large`, `AAA`, `AAA-large`,
 * `non-text`). A signed measure such as APCA is compared by magnitude.
 */
export function meets(fg: ColorInput, bg: ColorInput, level: number | string, algo: ContrastOption = 'wcag2'): boolean {
	const fn = pick(algo)
	const target = typeof level === 'number' ? level : fn.thresholds?.[level]
	if (target === undefined)
		throw new Error(
			`Unknown contrast level "${level}"${fn.thresholds ? `; use one of ${Object.keys(fn.thresholds).join(', ')}` : ''}`
		)
	return Math.abs(fn(toColor(fg), toColor(bg))) >= target
}

export interface FindContrastOptions {
	/** Hue of the result, in OKLCH degrees. Default: the hue of `bg`. */
	hue?: number
	/** Chroma of the result, in OKLCH. Default 0. The result is mapped into the gamut. */
	chroma?: number
	/** Which way to look first from `bg`. Default: darker on a light `bg`, lighter on a dark one. */
	direction?: 'lighter' | 'darker'
	/** Default `wcag2`. */
	contrast?: ContrastOption
}

export interface FoundContrast {
	/** The color, in `srgb` and inside the gamut. */
	color: Color
	/** The contrast it achieves against `bg`, as the algorithm reports it. */
	contrast: number
	/** False when no lightness reaches `target`; `color` is then the best one found. */
	met: boolean
}

const STEPS = 32

/**
 * Finds the color closest in lightness to `bg` (OKLCH L, at the given hue and
 * chroma) that reaches `target` contrast against it, by binary search. It looks
 * the preferred way first, then the other. The returned `contrast` is measured
 * on the final, gamut-mapped color, and `met` says whether it reaches `target`.
 */
export function findContrast(bg: ColorInput, target: number, options: FindContrastOptions = {}): FoundContrast {
	const back = toColor(bg)
	const fn = pick(options.contrast ?? 'wcag2')
	const lch = componentsIn(back, 'oklch')
	const l0 = lch[0] as number
	const hue = options.hue ?? (lch[2] as number)
	const chroma = options.chroma ?? 0
	const at = (l: number): FoundContrast => {
		const color = toGamut({ colorSpace: 'oklch', components: [l, chroma, hue] })
		const value = fn(color, back)
		return { color, contrast: value, met: Math.abs(value) >= target }
	}
	const first = options.direction ?? (l0 > 0.5 ? 'darker' : 'lighter')
	let best: FoundContrast | undefined
	for (const side of [first, first === 'darker' ? 'lighter' : 'darker']) {
		const far = side === 'darker' ? 0 : 1
		const end = at(far)
		if (!end.met) {
			if (!best || Math.abs(end.contrast) > Math.abs(best.contrast)) best = end
			continue
		}
		// `lo` is on the bg side and fails or is the bg itself; `hi` always passes.
		let [lo, hi] = [l0, far]
		let found = end
		for (let i = 0; i < STEPS; i++) {
			const mid = (lo + hi) / 2
			const candidate = at(mid)
			if (candidate.met) {
				hi = mid
				found = candidate
			} else lo = mid
		}
		return found
	}
	return { ...(best as FoundContrast), met: false }
}

export interface OnColorOptions {
	/** The contrast the text needs. Default 4.5 for WCAG 2. */
	target?: number
	/** How much of the background's hue the dark text carries, as OKLCH chroma. Default 0.03. */
	chroma?: number
	/** Default `wcag2`. */
	contrast?: ContrastOption
}

/**
 * The text color for `bg`, by the Radix rule: white, unless white's contrast
 * on `bg` is under `target`, then a near-black tinted with the hue of `bg`
 * (OKLCH lightness 0.2). When neither reaches `target`, whichever contrasts more.
 */
export function onColor(bg: ColorInput, options: OnColorOptions = {}): Color {
	const back = toColor(bg)
	const fn = pick(options.contrast ?? 'wcag2')
	const target = options.target ?? 4.5
	const white: Color = { colorSpace: 'srgb', components: [1, 1, 1] }
	const whiteScore = Math.abs(fn(white, back))
	if (whiteScore >= target) return white
	const hue = componentsIn(back, 'oklch')[2] as number
	const dark = toGamut({ colorSpace: 'oklch', components: [0.2, options.chroma ?? 0.03, hue] })
	return Math.abs(fn(dark, back)) >= whiteScore ? dark : white
}
