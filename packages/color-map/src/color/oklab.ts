import { map3, multiply } from './math.js'
import { lmsToOklab, lmsToXyz, oklabToLms, xyzToLms } from './matrices.js'
import type { Space } from './types.js'

export const oklab: Space = {
	id: 'oklab',
	toXyz: (c) =>
		multiply(
			lmsToXyz,
			map3(multiply(oklabToLms, c), (n) => n ** 3)
		),
	fromXyz: (xyz) => multiply(lmsToOklab, map3(multiply(xyzToLms, xyz), Math.cbrt))
}
