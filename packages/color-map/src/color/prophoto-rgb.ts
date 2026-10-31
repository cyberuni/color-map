import { map3, multiply } from './math.js'
import { d50ToD65, d65ToD50, prophotoToXyzD50, xyzD50ToProphoto } from './matrices.js'
import { prophotoToGamma, prophotoToLinear } from './transfer.js'
import type { Space } from './types.js'

export const prophotoRgb: Space = {
	id: 'prophoto-rgb',
	toXyz: (c) => multiply(d50ToD65, multiply(prophotoToXyzD50, map3(c, prophotoToLinear))),
	fromXyz: (xyz) => map3(multiply(xyzD50ToProphoto, multiply(d65ToD50, xyz)), prophotoToGamma)
}
