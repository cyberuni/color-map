import { hslToSrgb, srgbToHsl } from './hsl.js'
import { map3 } from './math.js'
import { srgb } from './srgb.js'
import type { Space } from './types.js'

export const hwb: Space = {
	id: 'hwb',
	toXyz: ([h, w, b]) => {
		const white = w / 100
		const black = b / 100
		if (white + black >= 1) {
			const gray = white / (white + black)
			return srgb.toXyz([gray, gray, gray])
		}
		return srgb.toXyz(map3(hslToSrgb(h, 1, 0.5), (v) => v * (1 - white - black) + white))
	},
	fromXyz: (xyz) => {
		const rgb = srgb.fromXyz(xyz)
		return [srgbToHsl(rgb, false)[0], Math.min(...rgb) * 100, (1 - Math.max(...rgb)) * 100]
	}
}
