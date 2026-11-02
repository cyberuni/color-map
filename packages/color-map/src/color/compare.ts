import { type ComponentsIn, componentsOver, convertWith } from './convert.js'
import { oklab } from './oklab.js'
import { componentsIn } from './spaces.js'
import type { Color, Space } from './types.js'

/** Euclidean distance in OKLab, the ΔEOK of CSS Color 4 gamut mapping. */
export function deltaEOK(a: Color, b: Color): number {
	return deltaEOKWith(componentsIn, a, b)
}

/** {@link deltaEOK} over the spaces `componentsIn` knows, which must include `oklab`. */
export function deltaEOKWith(componentsIn: ComponentsIn, a: Color, b: Color): number {
	const [l1, a1, b1] = componentsIn(a, 'oklab') as number[]
	const [l2, a2, b2] = componentsIn(b, 'oklab') as number[]
	return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

/**
 * Builds {@link deltaEOK} over the spaces given, plus `oklab`, so a bundle
 * contains only those. A color in a space not given throws, naming that space.
 */
export function createDeltaEOK(...spaces: Space[]): (a: Color, b: Color) => number {
	const over = componentsOver([oklab, ...spaces])
	return (a, b) => deltaEOKWith(over, a, b)
}

const same = (x: number | null | undefined, y: number | null | undefined, epsilon: number): boolean =>
	x === y || (x != null && y != null && Math.abs(x - y) <= epsilon)

/**
 * True when both colors are the same within `epsilon` per component. Colors in
 * different spaces are compared in the first one's space. `none` equals only
 * `none`, and a missing alpha equals 1.
 */
export function equals(a: Color, b: Color, epsilon = 1e-6): boolean {
	return equalsWith(componentsIn, a, b, epsilon)
}

function equalsWith(componentsIn: ComponentsIn, a: Color, b: Color, epsilon: number): boolean {
	const other = convertWith(componentsIn, b, a.colorSpace)
	return (
		same(a.alpha ?? 1, other.alpha ?? 1, epsilon) && a.components.every((c, i) => same(c, other.components[i], epsilon))
	)
}

/**
 * Builds {@link equals} over the spaces given, so a bundle contains only those.
 * It needs no space of its own: give the spaces of both colors.
 */
export function createEquals(...spaces: Space[]): (a: Color, b: Color, epsilon?: number) => boolean {
	const over = componentsOver(spaces)
	return (a, b, epsilon = 1e-6) => equalsWith(over, a, b, epsilon)
}
