import { srgbToXyz, xyzToSrgb } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { identity } from './transfer.js'

/**
 * The CSS `srgb-linear` space: sRGB primaries without a transfer curve. Components are red, green and blue in 0 to 1.
 * Pass it to `createConverter` and to the narrow helpers such as `createMix` and `createToGamut`.
 */
export const srgbLinear = rgbSpace('srgb-linear', identity, identity, srgbToXyz, xyzToSrgb)
