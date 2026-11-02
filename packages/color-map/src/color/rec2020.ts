import { rec2020ToXyz, xyzToRec2020 } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { power } from './transfer.js'

const [toLinear, toGamma] = power(2.4)

/**
 * The CSS `rec2020` space. Components are red, green and blue in 0 to 1, with a 2.4 power transfer curve.
 * Pass it to `createConverter` and to the narrow helpers such as `createMix` and `createToGamut`.
 */
export const rec2020 = rgbSpace('rec2020', toLinear, toGamma, rec2020ToXyz, xyzToRec2020)
