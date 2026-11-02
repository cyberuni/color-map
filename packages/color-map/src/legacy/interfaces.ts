/** Red, green and blue as whole numbers in 0 to 255. */
export type RGB = [number, number, number]
/** Red, green and blue as whole numbers in 0 to 255, then alpha in 0 to 1. */
export type RGBA = [number, number, number, number]
/** The alpha at the start and at the end of a run of colors, each in 0 to 1. */
export type Alpha = [number, number]

/** The segments of a gradient, in order, for `createColorsFromMap`. Each has an `index` and an `rgb`. */
export type ColorMap = {
	/**
	 * Defines how fast or slow the `rgb` values will change from one segment to the next.
	 * i.e. the steepness of the gradient between two segments.
	 */
	index: number
	/**
	 * RGB or RGBA. if RGBA, this alpha will be used instead of the alpha specified in the call.
	 */
	rgb: RGB | RGBA
}[]
