import { a98ToXyz, xyzToA98 } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { power } from './transfer.js'

const [toLinear, toGamma] = power(563 / 256)

/**
 * The CSS `a98-rgb` space (Adobe RGB 1998). Components are red, green and blue in 0 to 1, with a 563/256 power transfer curve.
 * Pass it to `createConverter` and to the narrow helpers such as `createMix` and `createToGamut`.
 */
export const a98Rgb = rgbSpace('a98-rgb', toLinear, toGamma, a98ToXyz, xyzToA98)
