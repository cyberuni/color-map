import { srgbToXyz, xyzToSrgb } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { identity } from './transfer.js'

export const srgbLinear = rgbSpace('srgb-linear', identity, identity, srgbToXyz, xyzToSrgb)
