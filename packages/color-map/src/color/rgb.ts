import { type Matrix, map3, multiply } from './math.js'
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
		toXyz: (c) => multiply(toXyz, map3(c, toLinear)),
		fromXyz: (xyz) => map3(multiply(fromXyz, xyz), toGamma)
	}
}
