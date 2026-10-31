import { rec2020ToXyz, xyzToRec2020 } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { power } from './transfer.js'

const [toLinear, toGamma] = power(2.4)

export const rec2020 = rgbSpace('rec2020', toLinear, toGamma, rec2020ToXyz, xyzToRec2020)
