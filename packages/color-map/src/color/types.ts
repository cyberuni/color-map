/** The spaces a {@link Color} can be in. Names are the CSS ones. */
export type ColorSpaceId =
	| 'srgb'
	| 'srgb-linear'
	| 'hsl'
	| 'hwb'
	| 'lab'
	| 'lch'
	| 'oklab'
	| 'oklch'
	| 'display-p3'
	| 'display-p3-linear'
	| 'a98-rgb'
	| 'prophoto-rgb'
	| 'rec2020'
	| 'xyz-d50'
	| 'xyz-d65'

/** A component value. `null` stands for the CSS keyword `none`. */
export type Component = number | null

/**
 * A color as plain JSON. Component ranges follow CSS: `srgb` is 0 to 1, `hsl`
 * and `hwb` take hue in degrees and the rest in 0 to 100, `lab` and `lch` take
 * L in 0 to 100, `oklab` and `oklch` take L in 0 to 1. A missing `alpha` is 1.
 */
export interface Color {
	colorSpace: ColorSpaceId
	components: Component[]
	alpha?: Component
}

export type Vec3 = [number, number, number]

/** A color space, defined by its conversion to and from the XYZ-D65 hub. */
export interface Space {
	id: ColorSpaceId
	toXyz(c: Vec3): Vec3
	fromXyz(xyz: Vec3): Vec3
}
