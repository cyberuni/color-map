import { componentsIn, convert } from './spaces.js'
import type { Color } from './types.js'

/** Euclidean distance in OKLab, the ΔEOK of CSS Color 4 gamut mapping. */
export function deltaEOK(a: Color, b: Color): number {
	const [l1, a1, b1] = componentsIn(a, 'oklab') as number[]
	const [l2, a2, b2] = componentsIn(b, 'oklab') as number[]
	return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

const same = (x: number | null | undefined, y: number | null | undefined, epsilon: number): boolean =>
	x === y || (x != null && y != null && Math.abs(x - y) <= epsilon)

/**
 * True when both colors are the same within `epsilon` per component. Colors in
 * different spaces are compared in the first one's space. `none` equals only
 * `none`, and a missing alpha equals 1.
 */
export function equals(a: Color, b: Color, epsilon = 1e-6): boolean {
	const other = convert(b, a.colorSpace)
	return (
		same(a.alpha ?? 1, other.alpha ?? 1, epsilon) && a.components.every((c, i) => same(c, other.components[i], epsilon))
	)
}
