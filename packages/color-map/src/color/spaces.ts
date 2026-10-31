import { a98Rgb } from './a98-rgb.js'
import { createConverter } from './convert.js'
import { displayP3 } from './display-p3.js'
import { displayP3Linear } from './display-p3-linear.js'
import { hsl } from './hsl.js'
import { hwb } from './hwb.js'
import { lab } from './lab.js'
import { lch } from './lch.js'
import { oklab } from './oklab.js'
import { oklch } from './oklch.js'
import { prophotoRgb } from './prophoto-rgb.js'
import { rec2020 } from './rec2020.js'
import { srgb } from './srgb.js'
import { srgbLinear } from './srgb-linear.js'
import type { ColorSpaceId, Space } from './types.js'
import { xyzD50 } from './xyz-d50.js'
import { xyzD65 } from './xyz-d65.js'

/** Every space. Importing this pulls them all in; import single spaces to avoid that. */
export const spaces: Record<ColorSpaceId, Space> = {
	srgb,
	'srgb-linear': srgbLinear,
	hsl,
	hwb,
	lab,
	lch,
	oklab,
	oklch,
	'display-p3': displayP3,
	'display-p3-linear': displayP3Linear,
	'a98-rgb': a98Rgb,
	'prophoto-rgb': prophotoRgb,
	rec2020,
	'xyz-d50': xyzD50,
	'xyz-d65': xyzD65
}

/** Converts a color to any of the 15 spaces. */
export const convert = createConverter(...Object.values(spaces))
