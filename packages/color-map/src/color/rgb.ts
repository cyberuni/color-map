import { type Matrix, multiply } from './math.js'
import type { ColorSpaceId, Space } from './types.js'

/** An RGB space: a transfer function, then a matrix to XYZ-D65. */
export function rgbSpace(
	id: ColorSpaceId,
	toLinear: (n: number) => number,
	toGamma: (n: number) => number,
	toXyz: Matrix,
	fromXyz: Matrix
): Space {
	return {
		id,
		toXyz: (c) => multiply(toXyz, toLinear(c[0]), toLinear(c[1]), toLinear(c[2])),
		fromXyz: (xyz) => {
			const v = multiply(fromXyz, xyz[0], xyz[1], xyz[2])
			return [toGamma(v[0]), toGamma(v[1]), toGamma(v[2])]
		}
	}
}
