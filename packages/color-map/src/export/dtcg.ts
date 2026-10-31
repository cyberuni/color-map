import { toGamut } from '../color/gamut.js'
import { toHex } from '../color/serialize.js'
import { convert } from '../color/spaces.js'
import type { Color, ColorSpaceId, Component } from '../color/types.js'
import { flatten, type TokenTree } from './tokens.js'

export interface DtcgOptions {
	/** Add the `hex` fallback (an sRGB `#rrggbb`, gamut-mapped when the color is outside sRGB). Default `true`. */
	hex?: boolean
}

/** A color value as DTCG 2025.10 defines it. */
export interface DtcgColorValue {
	colorSpace: Exclude<ColorSpaceId, 'display-p3-linear'>
	components: (number | 'none')[]
	alpha?: number | 'none'
	hex?: string
}

export interface DtcgToken {
	$type: 'color'
	$value: DtcgColorValue
}

export interface DtcgGroup {
	[name: string]: DtcgToken | DtcgGroup
}

const none = (c: Component): number | 'none' => (c === null ? 'none' : c)

/** One color as a DTCG color value. `display-p3-linear` is not a DTCG space, so it becomes `display-p3`. */
export function toDtcgValue(color: Color, options: DtcgOptions = {}): DtcgColorValue {
	const c = color.colorSpace === 'display-p3-linear' ? convert(color, 'display-p3') : color
	const value: DtcgColorValue = {
		colorSpace: c.colorSpace as DtcgColorValue['colorSpace'],
		components: c.components.map(none)
	}
	if (c.alpha !== undefined && c.alpha !== 1) value.alpha = none(c.alpha)
	if (options.hex !== false) value.hex = toHex(toGamut({ ...c, alpha: 1 }, { gamut: 'srgb' }))
	return value
}

/**
 * Exports colors as a DTCG 2025.10 token file: nested groups whose leaves are
 * `{ "$type": "color", "$value": { colorSpace, components, alpha?, hex? } }`.
 * `none` components print as `"none"`, as the format asks. The result is plain
 * JSON, so `JSON.stringify` writes the file.
 */
export function toDTCG(tree: TokenTree, options: DtcgOptions = {}): DtcgGroup {
	// Groups have no prototype, so a token named `__proto__` or `constructor` is an ordinary key.
	const root: DtcgGroup = Object.create(null)
	for (const { path, color } of flatten(tree)) {
		if (!path.length) throw new TypeError('A DTCG file needs a name for each token: pass an object, not a single color')
		let group = root
		for (const name of path.slice(0, -1)) group = (group[name] ??= Object.create(null)) as DtcgGroup
		group[path[path.length - 1] as string] = { $type: 'color', $value: toDtcgValue(color, options) }
	}
	return root
}
