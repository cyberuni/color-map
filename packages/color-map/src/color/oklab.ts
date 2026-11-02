import { multiply } from './math.js'
import { lmsToOklab, lmsToXyz, oklabToLms, xyzToLms } from './matrices.js'
import type { Space } from './types.js'

/**
 * The CSS `oklab` space. Components are lightness in 0 to 1, then the a and b axes, which stay within about -0.4 to 0.4 for real colors.
 * Pass it to `createConverter` and to the narrow helpers such as `createMix` and `createToGamut`.
 */
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
