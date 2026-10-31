import { multiply } from './math.js'
import { lmsToOklab, lmsToXyz, oklabToLms, xyzToLms } from './matrices.js'
import type { Space } from './types.js'

export const oklab: Space = {
	id: 'oklab',
	toXyz: (c) => {
		const v = multiply(oklabToLms, c[0], c[1], c[2])
		return multiply(lmsToXyz, v[0] ** 3, v[1] ** 3, v[2] ** 3)
	},
	fromXyz: (xyz) => {
		const v = multiply(xyzToLms, xyz[0], xyz[1], xyz[2])
		return multiply(lmsToOklab, Math.cbrt(v[0]), Math.cbrt(v[1]), Math.cbrt(v[2]))
	}
}
