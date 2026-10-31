import { p3ToXyz, xyzToP3 } from './matrices.js'
import { rgbSpace } from './rgb.js'
import { identity } from './transfer.js'

export const displayP3Linear = rgbSpace('display-p3-linear', identity, identity, p3ToXyz, xyzToP3)
