import { prophotoToXyzD50, xyzD50ToProphoto } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { prophotoToGamma, prophotoToLinear } from './transfer.js'
import type { Space } from './types.js'
import { xyzD50 } from './xyz-d50.js'

// ProPhoto's matrices lead to XYZ-D50, so it goes through that space on the way to the hub.
const d50 = rgbSpace('prophoto-rgb', prophotoToLinear, prophotoToGamma, prophotoToXyzD50, xyzD50ToProphoto)

export const prophotoRgb: Space = {
	id: 'prophoto-rgb',
	toXyz: (c) => xyzD50.toXyz(d50.toXyz(c)),
	fromXyz: (xyz) => d50.fromXyz(xyzD50.fromXyz(xyz))
}
