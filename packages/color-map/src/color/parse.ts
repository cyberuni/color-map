import { namedColor } from './named.js'
import type { Color, ColorSpaceId, Component } from './types.js'

export const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/
export const UNITS: Record<string, number> = { '': 1, deg: 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 }

/** How one channel reads: what 100% means, and the allowed range. */
export interface Channel {
	/** The value of 100%. Also the factor applied to a plain number, usually 1. */
	pct: number
	/** A plain number is divided by this (255 for sRGB channels). */
	div?: number
	min?: number
	max?: number
	hue?: boolean
}

const clamp = (n: number, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY): number =>
	Math.min(max, Math.max(min, n))

export function fail(input: string, what: string, token?: string): never {
	throw new Error(`color-map: cannot parse "${input}": ${what}${token === undefined ? '' : ` "${token}"`}`)
}

export function channel(token: string, spec: Channel, input: string): Component {
	if (token === 'none') return null
	const m = NUMBER.exec(token)
	if (!m) return fail(input, 'invalid value', token)
	const n = Number(m[0])
	const rest = token.slice(m[0].length)
	let value: number
	if (spec.hue) {
		const unit = UNITS[rest]
		if (unit === undefined) return fail(input, 'invalid angle', token)
		return n * unit
	}
	if (rest === '%') value = (n * spec.pct) / 100
	else if (rest === '') value = n / (spec.div ?? 1)
	else return fail(input, 'invalid value', token)
	return clamp(value, spec.min, spec.max)
}

export const SRGB: Channel = { pct: 1, div: 255 }
const PCT100: Channel = { pct: 100, min: 0 }
export const UNIT: Channel = { pct: 1 }
export const ALPHA: Channel = { pct: 1, min: 0, max: 1 }
const HUE: Channel = { pct: 0, hue: true }

export const FUNCTIONS: Record<string, { space: ColorSpaceId; channels: [Channel, Channel, Channel] }> = {
	rgb: { space: 'srgb', channels: [SRGB, SRGB, SRGB] },
	hsl: { space: 'hsl', channels: [HUE, PCT100, PCT100] },
	hwb: { space: 'hwb', channels: [HUE, PCT100, PCT100] },
	lab: { space: 'lab', channels: [{ pct: 100, min: 0, max: 100 }, { pct: 125 }, { pct: 125 }] },
	lch: { space: 'lch', channels: [{ pct: 100, min: 0, max: 100 }, { pct: 150, min: 0 }, HUE] },
	oklab: { space: 'oklab', channels: [{ pct: 1, min: 0, max: 1 }, { pct: 0.4 }, { pct: 0.4 }] },
	oklch: { space: 'oklch', channels: [{ pct: 1, min: 0, max: 1 }, { pct: 0.4, min: 0 }, HUE] }
}

export const COLOR_SPACES: Record<string, ColorSpaceId> = {
	srgb: 'srgb',
	'srgb-linear': 'srgb-linear',
	'display-p3': 'display-p3',
	'display-p3-linear': 'display-p3-linear',
	'a98-rgb': 'a98-rgb',
	'prophoto-rgb': 'prophoto-rgb',
	rec2020: 'rec2020',
	xyz: 'xyz-d65',
	'xyz-d50': 'xyz-d50',
	'xyz-d65': 'xyz-d65'
}

export const VALUES_NEEDING_RESOLVE =
	/^(?:currentcolor|canvas|canvastext|linktext|visitedtext|activetext|buttonface|buttontext|buttonborder|field|fieldtext|highlight|highlighttext|selecteditem|selecteditemtext|mark|marktext|graytext|accentcolor|accentcolortext)$/

function hex(input: string): Color {
	const digits = input.slice(1)
	if (!/^(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(digits) || digits.length === 5 || digits.length === 7) {
		return fail(input, 'invalid hex color')
	}
	const full = digits.length < 5 ? [...digits].map((d) => d + d).join('') : digits
	const byte = (i: number): number => Number.parseInt(full.slice(i * 2, i * 2 + 2), 16) / 255
	const color: Color = { colorSpace: 'srgb', components: [byte(0), byte(1), byte(2)] }
	if (full.length === 8) color.alpha = byte(3)
	return color
}

const ALIASES: Record<string, string> = { rgba: 'rgb', hsla: 'hsl' }

function functional(rawName: string, body: string, input: string): Color {
	const name = ALIASES[rawName] ?? rawName
	const [main, alphaToken, ...extra] = body.split('/').map((s) => s.trim())
	if (extra.length > 0) return fail(input, 'more than one "/"')
	const legacy = main.includes(',')
	const tokens = (legacy ? main.split(',') : main.split(/\s+/)).map((s) => s.trim()).filter(Boolean)
	let alpha = alphaToken
	if (legacy) {
		if (name !== 'rgb' && name !== 'hsl') return fail(input, 'the comma syntax is only for rgb() and hsl()')
		if (alpha !== undefined) return fail(input, 'cannot mix "," and "/"')
		if (tokens.length === 4) alpha = tokens.pop() as string
		if (tokens.includes('none')) return fail(input, '"none" is not allowed in the comma syntax')
	}
	let space: ColorSpaceId
	let channels: [Channel, Channel, Channel]
	if (name === 'color') {
		const id = COLOR_SPACES[tokens.shift() ?? '']
		if (!id) return fail(input, 'unknown color space', main.split(/\s+/)[0])
		space = id
		channels = [UNIT, UNIT, UNIT]
	} else {
		const fn = FUNCTIONS[name]
		if (!fn) return fail(input, 'unknown function', rawName)
		;({ space, channels } = fn)
	}
	if (tokens.length !== 3) return fail(input, `expected 3 components, got ${tokens.length}`)
	if (legacy) {
		const percents = tokens.map((t) => t.endsWith('%'))
		const ok = space === 'hsl' ? !percents[0] && percents[1] && percents[2] : percents.every((p) => p === percents[0])
		if (!ok) return fail(input, 'mixed numbers and percentages', tokens.join(', '))
	}
	const color: Color = {
		colorSpace: space,
		components: tokens.map((t, i) => channel(t, channels[i], input))
	}
	if (alpha !== undefined) color.alpha = channel(alpha, ALPHA, input)
	return color
}

/**
 * Parses a CSS Color 4 color: hex, named colors, `transparent`, `rgb()`,
 * `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()` and `color()`.
 * `none` becomes `null`. Values that need a context (`currentcolor`, system
 * colors) throw, because nothing here can resolve them.
 */
export function parse(input: string): Color {
	const text = input.trim().toLowerCase()
	if (text.startsWith('#')) return hex(text)
	const fn = /^([a-z]+)\((.*)\)$/s.exec(text)
	if (fn) return functional(fn[1], fn[2], input)
	if (text === 'transparent') return { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0 }
	const named = namedColor(text)
	if (named !== undefined) {
		return { colorSpace: 'srgb', components: [(named >> 16) / 255, ((named >> 8) & 255) / 255, (named & 255) / 255] }
	}
	if (VALUES_NEEDING_RESOLVE.test(text)) return fail(input, 'needs a context to resolve', text)
	return fail(input, 'not a color')
}
