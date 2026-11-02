import { oklab } from './oklab.js'
import { polarSpace } from './polar.js'

/**
 * The CSS `oklch` space, the polar form of `oklab`. Components are lightness in 0 to 1, chroma (about 0 to 0.4) and hue in degrees.
 * Pass it to `createConverter` and to the narrow helpers such as `createMix` and `createToGamut`.
 */
export const oklch = polarSpace('oklch', oklab)
