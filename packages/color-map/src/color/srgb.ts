import { srgbToXyz, xyzToSrgb } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { srgbToGamma, srgbToLinear } from './transfer.js'

export const srgb = rgbSpace('srgb', srgbToLinear, srgbToGamma, srgbToXyz, xyzToSrgb)
