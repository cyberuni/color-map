import { type ComponentsIn, componentsOver } from './convert.js'
import { toGamutWith } from './gamut.js'
import { oklab } from './oklab.js'
import { oklch } from './oklch.js'
import { toColor } from './parse.js'
import { componentsIn } from './spaces.js'
import { srgb } from './srgb.js'
import type { Color, Space } from './types.js'
import { unknownName } from './unknown-name.js'
import { xyzD65 } from './xyz-d65.js'

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
function luminance(componentsIn: ComponentsIn, color: Color): number {
	return Math.max(0, componentsIn(color, 'xyz-d65')[1] as number)
}

/** Lays a translucent color over `bg`, in `srgb`, the way a browser paints it. */
function flatten(componentsIn: ComponentsIn, fg: Color, bg: Color): Color {
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
export const wcag2: ContrastFn = /* @__PURE__ */ wcag2Over(componentsIn)

/** WCAG 2 over the spaces `componentsIn` knows, which must include `srgb` and `xyz-d65`. */
function wcag2Over(componentsIn: ComponentsIn): ContrastFn {
	return Object.assign(
		(fg: Color, bg: Color): number => {
			const a = luminance(componentsIn, flatten(componentsIn, fg, bg)) + 0.05
			const b = luminance(componentsIn, bg) + 0.05
			return a > b ? a / b : b / a
		},
		{
			algorithm: 'wcag2',
			thresholds: { AA: 4.5, 'AA-large': 3, AAA: 7, 'AAA-large': 4.5, 'non-text': 3 },
			polarity: 'symmetric'
		} as const
	)
}

/** The measure `algo` names: `wcag2` or a function; anything else is an unknown name. */
export function pick(algo: ContrastOption): ContrastFn {
	return pickFrom(wcag2, algo)
}

/** {@link pick}, with `builtin` as what `wcag2` names. */
function pickFrom(builtin: ContrastFn, algo: ContrastOption): ContrastFn {
	if (algo === 'wcag2') return builtin
	if (typeof algo !== 'function') throw unknownName('contrast algorithm', algo, ['wcag2'])
	return algo
}

/** What a narrow contrast helper works over: its spaces and its own `wcag2`. */
interface ContrastKit {
	componentsIn: ComponentsIn
	wcag2: ContrastFn
}

/** A {@link ContrastKit} over `needed` and `spaces`. */
function contrastKit(needed: Space[], spaces: Space[]): ContrastKit {
	const over = componentsOver([...needed, ...spaces])
	return { componentsIn: over, wcag2: wcag2Over(over) }
}

/**
 * Contrast of `fg` on `bg`. Colors may be CSS strings. The default is WCAG 2;
 * pass a {@link ContrastFn} to use another measure (see the APCA recipe).
 */
export function contrast(fg: ColorInput, bg: ColorInput, algo: ContrastOption = 'wcag2'): number {
	return pick(algo)(toColor(fg), toColor(bg))
}

/**
 * Builds {@link contrast} over the spaces given, plus `srgb` and `xyz-d65`,
 * which WCAG 2 works in, so a bundle contains only those. It takes color
 * objects, not strings, so it does not carry `parse`. A color in a space not
 * given throws, naming that space.
 */
export function createContrast(...spaces: Space[]): (fg: Color, bg: Color, algo?: ContrastOption) => number {
	const kit = contrastKit([srgb, xyzD65], spaces)
	return (fg, bg, algo = 'wcag2') => pickFrom(kit.wcag2, algo)(fg, bg)
}

/**
 * True when `fg` on `bg` reaches `level`: a number, or a name from the
 * algorithm's thresholds (WCAG 2: `AA`, `AA-large`, `AAA`, `AAA-large`,
 * `non-text`). A signed measure such as APCA is compared by magnitude.
 */
export function meets(fg: ColorInput, bg: ColorInput, level: number | string, algo: ContrastOption = 'wcag2'): boolean {
	const fn = pick(algo)
	const target = levelOf(fn, level)
	return Math.abs(fn(toColor(fg), toColor(bg))) >= target
}

/**
 * Builds {@link meets} over the spaces given, plus `srgb` and `xyz-d65`, which
 * WCAG 2 works in, so a bundle contains only those. It takes color objects,
 * not strings, so it does not carry `parse`. A color in a space not given
 * throws, naming that space.
 */
export function createMeets(
	...spaces: Space[]
): (fg: Color, bg: Color, level: number | string, algo?: ContrastOption) => boolean {
	const kit = contrastKit([srgb, xyzD65], spaces)
	return (fg, bg, level, algo = 'wcag2') => {
		const fn = pickFrom(kit.wcag2, algo)
		return Math.abs(fn(fg, bg)) >= levelOf(fn, level)
	}
}

/** The contrast `level` stands for under `fn`: the number itself, or one of its thresholds by name. */
function levelOf(fn: ContrastFn, level: number | string): number {
	const named = typeof level === 'number' ? level : fn.thresholds?.[level]
	// A name that is not the algorithm's own (`constructor`) finds something that is not a number.
	const target = typeof named === 'number' ? named : undefined
	if (target === undefined) throw unknownName('contrast level', level, Object.keys(fn.thresholds ?? {}))
	return target
}

/** Options for `findContrast` and the function `createFindContrast` returns. */
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

/** What `findContrast` returns: the color it found and whether it reached the target. */
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
	return findContrastWith({ componentsIn, wcag2 }, toColor(bg), target, options)
}

/**
 * Builds {@link findContrast} over the spaces given, plus `srgb`, `xyz-d65`,
 * `oklch` and `oklab`, which WCAG 2 and gamut mapping work in, so a bundle
 * contains only those. It takes a color object, not a string, so it does not
 * carry `parse`. A color in a space not given throws, naming that space.
 */
export function createFindContrast(
	...spaces: Space[]
): (bg: Color, target: number, options?: FindContrastOptions) => FoundContrast {
	const kit = contrastKit([srgb, xyzD65, oklch, oklab], spaces)
	return (bg, target, options = {}) => findContrastWith(kit, bg, target, options)
}

function findContrastWith(
	{ componentsIn, wcag2 }: ContrastKit,
	back: Color,
	target: number,
	options: FindContrastOptions
): FoundContrast {
	const fn = pickFrom(wcag2, options.contrast ?? 'wcag2')
	const lch = componentsIn(back, 'oklch')
	const l0 = lch[0] as number
	const hue = options.hue ?? (lch[2] as number)
	const chroma = options.chroma ?? 0
	const at = (l: number): FoundContrast => {
		const color = toGamutWith(componentsIn, { colorSpace: 'oklch', components: [l, chroma, hue] }, {})
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

/** Options for `onColor` and the function `createOnColor` returns. */
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
	return onColorWith({ componentsIn, wcag2 }, toColor(bg), options)
}

/**
 * Builds {@link onColor} over the spaces given, plus `srgb`, `xyz-d65`,
 * `oklch` and `oklab`, which WCAG 2 and gamut mapping work in, so a bundle
 * contains only those. It takes a color object, not a string, so it does not
 * carry `parse`. A color in a space not given throws, naming that space.
 */
export function createOnColor(...spaces: Space[]): (bg: Color, options?: OnColorOptions) => Color {
	const kit = contrastKit([srgb, xyzD65, oklch, oklab], spaces)
	return (bg, options = {}) => onColorWith(kit, bg, options)
}

function onColorWith({ componentsIn, wcag2 }: ContrastKit, back: Color, options: OnColorOptions): Color {
	const fn = pickFrom(wcag2, options.contrast ?? 'wcag2')
	const target = options.target ?? 4.5
	const white: Color = { colorSpace: 'srgb', components: [1, 1, 1] }
	const whiteScore = Math.abs(fn(white, back))
	if (whiteScore >= target) return white
	const hue = componentsIn(back, 'oklch')[2] as number
	const dark = toGamutWith(componentsIn, { colorSpace: 'oklch', components: [0.2, options.chroma ?? 0.03, hue] }, {})
	return Math.abs(fn(dark, back)) >= whiteScore ? dark : white
}
