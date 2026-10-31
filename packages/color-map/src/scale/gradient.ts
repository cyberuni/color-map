import { type MixOptions, mix } from '../color/mix.js'
import { toColor } from '../color/parse.js'
import type { Color } from '../color/types.js'

/** A color at a position on the gradient line. */
export interface GradientStop {
	/** A CSS color string or a color object. Its alpha is the stop's alpha. */
	color: Color | string
	/**
	 * Where the stop sits, with 0 the start and 1 the end; it may fall outside
	 * 0 to 1. Leave it out to spread the stop evenly between its neighbors, as
	 * CSS gradients do.
	 */
	at?: number
}

/** `in` and `hue` work as they do in `mix()`. The default space is `oklab`. */
export type GradientOptions = MixOptions

/**
 * Places each stop the way CSS gradients do (CSS Images 3 section 3.5.3): a
 * first stop without a position goes at 0 and a last one at 1, a position
 * before an earlier stop's moves up to it, and a run of stops without a
 * position spreads evenly between the stops around it.
 */
function positions(stops: readonly GradientStop[]): number[] {
	const n = stops.length
	const at: (number | undefined)[] = stops.map((s, i) => {
		if (s.at !== undefined && !Number.isFinite(s.at)) throw new Error(`stop ${i} has a position of ${s.at}`)
		return s.at
	})
	if (at[0] === undefined) at[0] = 0
	if (at[n - 1] === undefined) at[n - 1] = 1
	let max = Number.NEGATIVE_INFINITY
	for (let i = 0; i < n; i++) {
		const p = at[i]
		if (p !== undefined) at[i] = max = Math.max(max, p)
	}
	for (let i = 1; i < n; i++) {
		if (at[i] !== undefined) continue
		let j = i
		while (at[j] === undefined) j++
		const from = at[i - 1] as number
		const step = ((at[j] as number) - from) / (j - i + 1)
		for (let k = i; k < j; k++) at[k] = from + step * (k - i + 1)
	}
	return at as number[]
}

/**
 * Builds `count` colors, evenly spaced from 0 to 1 along a gradient through
 * `stops`, the way a CSS gradient blends them: each pair of neighboring stops
 * is mixed with `mix()`, so `in` and `hue` work as they do there. A stop is
 * `{ color, at? }`, or a bare color when it needs no position. Before the
 * first stop and after the last, the color holds; where two stops share a
 * position, the color changes there and the sample at that position takes the
 * later stop. Colors come back in the `in` space, default `oklab`.
 *
 * Alpha comes from each stop's color, 1 when the color has none, so
 * `rgb(0 0 255 / 0.2)` is a stop at alpha 0.2. Alpha is interpolated linearly
 * between stops, and the other components are premultiplied by it, so a
 * transparent stop does not pull its neighbor's color toward its own. A color
 * whose alpha is 1 has no `alpha` key; a `none` alpha takes the neighboring
 * stop's.
 *
 * ```ts
 * createGradient([{ color: 'blue', at: 0 }, { color: 'lime', at: 0.6 }, { color: 'yellow', at: 1 }], 72)
 * createGradient(['blue', 'lime'], 5, { in: 'oklch' })
 * ```
 */
export function createGradient(
	stops: readonly (GradientStop | Color | string)[],
	count: number,
	options: GradientOptions = {}
): Color[] {
	if (stops.length < 2) throw new Error(`a gradient needs at least 2 stops, got ${stops.length}`)
	if (!Number.isInteger(count) || count < 2) throw new Error(`count must be an integer of at least 2, got ${count}`)
	const list = stops.map((s): GradientStop => (typeof s === 'string' || 'colorSpace' in s ? { color: s } : s))
	const colors = list.map((s) => toColor(s.color))
	const at = positions(list)
	const last = list.length - 2
	return Array.from({ length: count }, (_, i) => {
		const t = i / (count - 1)
		let s = 0
		while (s < last && (at[s + 1] as number) <= t) s++
		const from = at[s] as number
		const width = (at[s + 1] as number) - from
		const local = width > 0 ? Math.min(1, Math.max(0, (t - from) / width)) : t < from ? 0 : 1
		return mix(colors[s] as Color, colors[s + 1] as Color, local, options)
	})
}
