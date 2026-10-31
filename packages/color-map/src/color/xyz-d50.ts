import { multiply } from './math.js'
import { d50ToD65, d65ToD50 } from './matrices.js'
import type { Space } from './types.js'

export const xyzD50: Space = {
	id: 'xyz-d50',
	toXyz: (c) => multiply(d50ToD65, c[0], c[1], c[2]),
	fromXyz: (xyz) => multiply(d65ToD50, xyz[0], xyz[1], xyz[2])
}
