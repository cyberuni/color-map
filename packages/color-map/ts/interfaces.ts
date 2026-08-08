export type RGB = [number, number, number]
export type RGBA = [number, number, number, number]
export type Alpha = [number, number]

export type ColorMap = {
  /**
   * Defines how fast or slow the `rgb` values will change from one segment to the next.
   * i.e. the steepness of the gradient between two segments.
   */
  index: number,
  /**
   * RGB or RGBA. if RGBA, this alpha will be used instead of the alpha specified in the call.
   */
  rgb: RGB | RGBA
}[]
