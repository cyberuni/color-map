// The root re-exports the four subpaths, which stay the stable contract. The
// legacy names stay here through 2.x, deprecated in favor of `color-map/legacy`,
// and leave the root in 3.0. They are aliases rather than `export *` so that the
// deprecation shows only at the root and not in `color-map/legacy`.
import {
	type Alpha as LegacyAlpha,
	type ColorMap as LegacyColorMap,
	type RGB as LegacyRGB,
	type RGBA as LegacyRGBA,
	createColors as legacyCreateColors,
	createColorsFromMap as legacyCreateColorsFromMap,
	rgbaString as legacyRgbaString,
	rgbHex as legacyRgbHex
} from './legacy/index.js'

export * from './color/index.js'
export * from './palette/index.js'
export * from './scale/index.js'
export * from './tokens/index.js'

/** @deprecated Import it from `color-map/legacy`. The root stops exporting it in 3.0. */
export const createColors = legacyCreateColors
/** @deprecated Import it from `color-map/legacy`. The root stops exporting it in 3.0. */
export const createColorsFromMap = legacyCreateColorsFromMap
/** @deprecated Import it from `color-map/legacy`, or use `toHex` from `color-map`. The root stops exporting it in 3.0. */
export const rgbHex = legacyRgbHex
/** @deprecated Import it from `color-map/legacy`, or use `toCss` from `color-map`. The root stops exporting it in 3.0. */
export const rgbaString = legacyRgbaString

/** @deprecated Import it from `color-map/legacy`. The root stops exporting it in 3.0. */
export type Alpha = LegacyAlpha
/** @deprecated Import it from `color-map/legacy`. The root stops exporting it in 3.0. */
export type ColorMap = LegacyColorMap
/** @deprecated Import it from `color-map/legacy`. The root stops exporting it in 3.0. */
export type RGB = LegacyRGB
/** @deprecated Import it from `color-map/legacy`. The root stops exporting it in 3.0. */
export type RGBA = LegacyRGBA
