import { srgbToXyz, xyzToSrgb } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { srgbToGamma, srgbToLinear } from './transfer.js'

/**
 * The CSS `srgb` space. Components are red, green and blue in 0 to 1, with the sRGB transfer curve.
 * Pass it to `createConverter` and to the narrow helpers such as `createMix` and `createToGamut`.
 */
export const srgb = rgbSpace('srgb', srgbToLinear, srgbToGamma, srgbToXyz, xyzToSrgb)
