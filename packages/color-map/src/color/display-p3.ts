import { p3ToXyz, xyzToP3 } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { srgbToGamma, srgbToLinear } from './transfer.js'

export const displayP3 = rgbSpace('display-p3', srgbToLinear, srgbToGamma, p3ToXyz, xyzToP3)
