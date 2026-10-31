import { D50, map3, multiply } from './math.js'
import { d50ToD65, d65ToD50 } from './matrices.js'
import type { Space } from './types.js'

const EPSILON = 216 / 24389
const KAPPA = 24389 / 27

const finv = (f: number): number => (f ** 3 > EPSILON ? f ** 3 : (116 * f - 16) / KAPPA)

export const lab: Space = {
	id: 'lab',
	toXyz: ([l, a, b]) => {
		const fy = (l + 16) / 116
		const y = l > KAPPA * EPSILON ? fy ** 3 : l / KAPPA
		const x = finv(fy + a / 500)
		const z = finv(fy - b / 200)
		return multiply(d50ToD65, [x * D50[0], y * D50[1], z * D50[2]])
	},
	fromXyz: (xyz) => {
		const [x, y, z] = multiply(d65ToD50, xyz)
		const [fx, fy, fz] = map3([x / D50[0], y / D50[1], z / D50[2]], (v) =>
			v > EPSILON ? Math.cbrt(v) : (KAPPA * v + 16) / 116
		)
		return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
	}
}
