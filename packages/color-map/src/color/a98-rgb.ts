import { a98ToXyz, xyzToA98 } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { power } from './transfer.js'

const [toLinear, toGamma] = power(563 / 256)

export const a98Rgb = rgbSpace('a98-rgb', toLinear, toGamma, a98ToXyz, xyzToA98)
