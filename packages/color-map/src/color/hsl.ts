import { normalizeHue } from './math.js'
import { srgb } from './srgb.js'
import type { Space, Vec3 } from './types.js'

function channel(t1: number, t2: number, sextant: number): number {
	const h = (sextant + 6) % 6
	if (h < 1) return (t2 - t1) * h + t1
	if (h < 3) return t2
	if (h < 4) return (t2 - t1) * (4 - h) + t1
	return t1
}

/** CSS Color 4 hslToRgb. Hue in degrees, s and l in 0 to 1. */
export function hslToSrgb(h: number, s: number, l: number): Vec3 {
	const t2 = l <= 0.5 ? l * (s + 1) : l + s - l * s
	const t1 = l * 2 - t2
	const hue = normalizeHue(h) / 60
	return [channel(t1, t2, hue + 2), channel(t1, t2, hue), channel(t1, t2, hue - 2)]
}

/**
 * CSS Color 4 rgbToHsl. Returns hue in degrees, s and l in 0 to 1. For
 * out-of-gamut input the saturation can come out negative; it is made positive
 * and the hue turned by 180 degrees, unless `flipNegative` is false.
 */
export function srgbToHsl([r, g, b]: Vec3, flipNegative = true): Vec3 {
	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	const l = (min + max) / 2
	const d = max - min
	let h = 0
	let s = 0
	// A spread of rounding noise is a gray: a round trip leaves white at 1 - 1e-16.
	if (d > 1e-9) {
		s = l === 0 || l === 1 ? 0 : (max - l) / Math.min(l, 1 - l)
		h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
		h *= 60
	}
	if (s < 0) {
		if (flipNegative) h += 180
		s = -s
	}
	return [normalizeHue(h), s, l]
}

export const hsl: Space = {
	id: 'hsl',
	toXyz: ([h, s, l]) => srgb.toXyz(hslToSrgb(h, s / 100, l / 100)),
	fromXyz: (xyz) => {
		const [h, s, l] = srgbToHsl(srgb.fromXyz(xyz))
		return [h, s * 100, l * 100]
	}
}
