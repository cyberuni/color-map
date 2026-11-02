import { deltaEOkWith } from './compare.js'
import { type ComponentsIn, componentsOver, convertWith } from './convert.js'
import { type Matrix, product } from './math.js'
import { lmsToOklab, lmsToXyz, oklabToLms, srgbToXyz, xyzToLms, xyzToSrgb } from './matrices.js'
import { oklab } from './oklab.js'
import { oklch } from './oklch.js'
import { componentsIn } from './spaces.js'
import { srgb } from './srgb.js'
import { srgbToGamma } from './transfer.js'
import type { Color, ColorSpaceId, Component, Space, Vec3 } from './types.js'

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

/** Options for `toGamut` and the function `createToGamut` returns. */
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
	const deltaEOk = (a: Color, b: Color): number => deltaEOkWith(componentsIn, a, b)
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
	if (gamut === 'srgb') return back(reduceChromaInSrgb(origin, lightness, chroma, hue))
	let min = 0
	let max = chroma
	let minInGamut = true
	let clip = clipped(origin, gamut, componentsIn(origin, gamut))
	if (deltaEOk(clip, origin) < JND) return back(clip)
	while (max - min > EPSILON) {
		const mid = (min + max) / 2
		const current = withAlpha({ colorSpace: 'oklch', components: [lightness, mid, hue] }, origin)
		const inGamutSpace = componentsIn(current, gamut)
		if (minInGamut && within(inGamutSpace, 1e-6)) {
			min = mid
			continue
		}
		clip = clipped(current, gamut, inGamutSpace)
		const e = deltaEOk(clip, current)
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

let lmsToLinear: Matrix | undefined
let linearToLms: Matrix | undefined
// The gamma-space tolerance of 1e-6 on each side, as a linear one: the transfer curve is monotone.
const LOW = -1e-6 / 12.92
const HIGH = ((1 + 1e-6 + 0.055) / 1.055) ** 2.4

// A clipped channel of exactly 0 or 1 stays exactly that, as clipping after the curve gives.
const encode = (n: number): number => (n === 0 || n === 1 ? n : srgbToGamma(n))
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

/**
 * The CSS Color 4 section 13.2 search of `toGamut` for the `srgb` gamut, done in
 * linear sRGB so the loop has no hub conversion, `**` or trigonometry. Clipping
 * to 0 to 1 commutes with the monotone transfer curve, so it finds what the
 * generic path finds, up to rounding. Returns the mapped color in `srgb`.
 */
function reduceChromaInSrgb(origin: Color, lightness: number, chroma: number, hue: Component): Color {
	// Composed on first use, so a bundle without this path does not pay for them at load.
	const m = (lmsToLinear ??= product(xyzToSrgb, lmsToXyz))
	const n = (linearToLms ??= product(xyzToLms, srgbToXyz))
	const o = oklabToLms
	const k = lmsToOklab
	// A `none` hue or chroma reads as 0, as it does in a conversion. A `none` lightness never gets here.
	const l = lightness
	const radians = ((hue ?? 0) * Math.PI) / 180
	const cos = Math.cos(radians)
	const sin = Math.sin(radians)
	let r = 0
	let g = 0
	let b = 0
	let inside = false
	/** Puts the candidate of chroma `c` in linear sRGB into r, g, b (unclipped), and says if it is within the gamut. */
	const place = (c: number): void => {
		const a = c * cos
		const bb = c * sin
		const x = l + o[1] * a + o[2] * bb
		const y = l + o[4] * a + o[5] * bb
		const z = l + o[7] * a + o[8] * bb
		const x3 = x * x * x
		const y3 = y * y * y
		const z3 = z * z * z
		r = m[0] * x3 + m[1] * y3 + m[2] * z3
		g = m[3] * x3 + m[4] * y3 + m[5] * z3
		b = m[6] * x3 + m[7] * y3 + m[8] * z3
		inside = r >= LOW && r <= HIGH && g >= LOW && g <= HIGH && b >= LOW && b <= HIGH
	}
	/** Clips r, g, b and returns its ΔEOK to the candidate of chroma `c`. */
	const clipAndMeasure = (c: number): number => {
		r = clamp01(r)
		g = clamp01(g)
		b = clamp01(b)
		const x = Math.cbrt(n[0] * r + n[1] * g + n[2] * b)
		const y = Math.cbrt(n[3] * r + n[4] * g + n[5] * b)
		const z = Math.cbrt(n[6] * r + n[7] * g + n[8] * b)
		const dl = k[0] * x + k[1] * y + k[2] * z - l
		const da = k[3] * x + k[4] * y + k[5] * z - c * cos
		const db = k[6] * x + k[7] * y + k[8] * z - c * sin
		return Math.sqrt(dl * dl + da * da + db * db)
	}
	const JND = 0.02
	const EPSILON = 0.0001
	let min = 0
	let max = chroma
	let minInGamut = true
	place(chroma ?? 0)
	let clip: Vec3
	let e = clipAndMeasure(chroma ?? 0)
	clip = [r, g, b]
	if (e >= JND) {
		while (max - min > EPSILON) {
			const mid = (min + max) / 2
			place(mid)
			if (minInGamut && inside) {
				min = mid
				continue
			}
			e = clipAndMeasure(mid)
			clip = [r, g, b]
			if (e < JND) {
				if (JND - e < EPSILON) break
				minInGamut = false
				min = mid
			} else {
				max = mid
			}
		}
	}
	return withAlpha({ colorSpace: 'srgb', components: clip.map(encode) }, origin)
}
