import { createColors } from './createColors.js'
import type { Alpha, ColorMap, RGBA } from './interfaces.js'

/**
 * Create colors with specified color map.
 *
 * @deprecated Use `createGradient` from `color-map`. Each of its stops
 * carries its own alpha, and `{ in: 'srgb' }` comes close to these results.
 */
export function createColorsFromMap(colormap: ColorMap, shades: number, alpha?: Alpha): RGBA[] {
	if (shades < colormap.length) {
		throw new Error(`Requires at least ${colormap.length} shades.`)
	}

	const result: RGBA[] = []
	const steps: number[] = []
	for (let i = 0; i < colormap.length; i++) {
		steps.push(Math.round(colormap[i].index * shades))
	}

	for (let i = 0; i < colormap.length - 1; i++) {
		const n = steps[i + 1] - steps[i]
		const from = colormap[i].rgb
		const to = colormap[i + 1].rgb
		result.push(...createColors(from, to, n, alpha))
	}

	return result
}
