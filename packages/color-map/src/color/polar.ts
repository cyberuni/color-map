import { normalizeHue, toDeg, toRad } from './math.js'
import type { Space, Vec3 } from './types.js'

/** Wraps a rectangular Lab-like space as its polar (LCH-like) twin. */
export function polarSpace(id: 'lch' | 'oklch', base: Space): Space {
	return {
		id,
		toXyz: ([l, c, h]) => base.toXyz([l, c * Math.cos(toRad(h)), c * Math.sin(toRad(h))]),
		fromXyz: (xyz) => {
			const [l, a, b] = base.fromXyz(xyz) as Vec3
			return [l, Math.hypot(a, b), normalizeHue(toDeg(Math.atan2(b, a)))]
		}
	}
}
