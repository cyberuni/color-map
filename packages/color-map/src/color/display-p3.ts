import { p3ToXyz, xyzToP3 } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { srgbToGamma, srgbToLinear } from './transfer.js'

/**
 * The CSS `display-p3` space. Components are red, green and blue in 0 to 1, with the sRGB transfer curve.
 * Pass it to `createConverter` and to the narrow helpers such as `createMix` and `createToGamut`.
 */
export const displayP3 = rgbSpace('display-p3', srgbToLinear, srgbToGamma, p3ToXyz, xyzToP3)
