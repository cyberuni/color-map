import { normalizeHue } from './math.js'
import type { Space } from './types.js'

/** Wraps a rectangular Lab-like space as its polar (LCH-like) twin. */
export function polarSpace(id: 'lch' | 'oklch', base: Space): Space {
	return {
		id,
		toXyz: ([l, c, h]) => {
			const r = (h * Math.PI) / 180
			return base.toXyz([l, c * Math.cos(r), c * Math.sin(r)])
		},
		fromXyz: (xyz) => {
			const [l, a, b] = base.fromXyz(xyz)
			return [l, Math.hypot(a, b), normalizeHue((Math.atan2(b, a) * 180) / Math.PI)]
		}
	}
}
