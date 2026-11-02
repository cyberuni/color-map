import { p3ToXyz, xyzToP3 } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { identity } from './transfer.js'

/**
 * The CSS `display-p3-linear` space: Display P3 primaries without a transfer curve. Components are red, green and blue in 0 to 1.
 * Pass it to `createConverter` and to the narrow helpers such as `createMix` and `createToGamut`.
 */
export const displayP3Linear = rgbSpace('display-p3-linear', identity, identity, p3ToXyz, xyzToP3)
