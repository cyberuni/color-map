import { type ContrastOption, findContrast } from '../color/contrast.js'
import { parse } from '../color/parse.js'
import { convert } from '../color/spaces.js'
import type { Color } from '../color/types.js'

export interface ContrastScaleOptions {
	/** The color the scale is built around: its hue and chroma carry to every step. */
	seed: Color | string
	/** What every step is measured against. */
	background: Color | string
	/** Target contrast per step, in order, or a record of named targets (`{ text: 7, border: 3 }`). */
	targets: number[] | Record<string, number>
	/** Default `wcag2`. */
	contrast?: ContrastOption
	/** Which way to look first from the background. Default: darker on a light background, lighter on a dark one. */
	direction?: 'lighter' | 'darker'
}

export interface ContrastStep {
	/** The key in a record of targets; otherwise the step's index as a string. */
	name: string
	target: number
	color: Color
	/** The contrast the color achieves, measured on the color itself. */
	contrast: number
	/** False when no lightness reaches `target`; `color` is then the best one found. */
	met: boolean
}

/**
 * A Leonardo-style scale: each step is the color nearest the background's
 * lightness, at the seed's hue and chroma, that reaches its target contrast.
 * Contrast is the same across hues, which a fixed-lightness scale cannot give.
 */
export function createContrastScale(options: ContrastScaleOptions): ContrastStep[] {
	const { seed, background, targets, contrast, direction } = options
	const [, chroma, hue] = convert(typeof seed === 'string' ? parse(seed) : seed, 'oklch').components as [
		number,
		number,
		number | null
	]
	const entries: [string, number][] = Array.isArray(targets)
		? targets.map((t, i) => [String(i), t])
		: Object.entries(targets)
	return entries.map(([name, target]) => ({
		name,
		target,
		...findContrast(background, target, { hue: hue ?? 0, chroma, contrast, direction })
	}))
}
