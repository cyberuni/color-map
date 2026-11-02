import { lab } from './lab.js'
import { polarSpace } from './polar.js'

/**
 * The CSS `lch` space, the polar form of `lab`. Components are lightness in 0 to 100, chroma (not bounded, about 0 to 150) and hue in degrees.
 * Pass it to `createConverter` and to the narrow helpers such as `createMix` and `createToGamut`.
 */
export const lch = polarSpace('lch', lab)
