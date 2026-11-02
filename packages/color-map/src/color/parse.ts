import { namedColor } from './named.js'
import type { Color, ColorSpaceId, Component } from './types.js'

export const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/
// Tables keyed by text a caller wrote have no prototype (`__proto__: null`), so `constructor` or `toString` is an unknown name, not Object.prototype's.
export const UNITS: Record<string, number> = {
	__proto__: null as never,
	'': 1,
	deg: 1,
	grad: 0.9,
	rad: 180 / Math.PI,
	turn: 360
}

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
	return Math.min(spec.max ?? Number.POSITIVE_INFINITY, Math.max(spec.min ?? Number.NEGATIVE_INFINITY, value))
}

export const SRGB: Channel = { pct: 1, div: 255 }
const PCT100: Channel = { pct: 100, min: 0 }
export const UNIT: Channel = { pct: 1 }
export const ALPHA: Channel = { pct: 1, min: 0, max: 1 }
const HUE: Channel = { pct: 0, hue: true }

export const FUNCTIONS: Record<string, { space: ColorSpaceId; channels: [Channel, Channel, Channel] }> = {
	__proto__: null as never,
	rgb: { space: 'srgb', channels: [SRGB, SRGB, SRGB] },
	hsl: { space: 'hsl', channels: [HUE, PCT100, PCT100] },
	hwb: { space: 'hwb', channels: [HUE, PCT100, PCT100] },
	lab: { space: 'lab', channels: [{ pct: 100, min: 0, max: 100 }, { pct: 125 }, { pct: 125 }] },
	lch: { space: 'lch', channels: [{ pct: 100, min: 0, max: 100 }, { pct: 150, min: 0 }, HUE] },
	oklab: { space: 'oklab', channels: [{ pct: 1, min: 0, max: 1 }, { pct: 0.4 }, { pct: 0.4 }] },
	oklch: { space: 'oklch', channels: [{ pct: 1, min: 0, max: 1 }, { pct: 0.4, min: 0 }, HUE] }
}

/** The spaces `color()` names, by the name it uses: their own, and `xyz` for `xyz-d65`. */
export const COLOR_SPACES: Record<string, ColorSpaceId> = { __proto__: null as never, xyz: 'xyz-d65' }
for (const id of [
	'srgb',
	'srgb-linear',
	'display-p3',
	'display-p3-linear',
	'a98-rgb',
	'prophoto-rgb',
	'rec2020',
	'xyz-d50',
	'xyz-d65'
] as const)
	COLOR_SPACES[id] = id

/** `currentcolor` and the CSS Color 4 system colors (canvas, canvastext, linktext, buttonface, ...). */
export const VALUES_NEEDING_RESOLVE =
	/^(?:currentcolor|(?:canvas|field|highlight|selecteditem|mark|accentcolor)(?:text)?|(?:link|visited|active|button|gray)text|button(?:face|border))$/

function hex(input: string): Color {
	const digits = input.slice(1)
	if (!/^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/.test(digits)) return fail(input, 'invalid hex color')
	const full = digits.length < 5 ? [...digits].map((d) => d + d).join('') : digits
	const byte = (i: number): number => Number.parseInt(full.slice(i * 2, i * 2 + 2), 16) / 255
	const color: Color = { colorSpace: 'srgb', components: [byte(0), byte(1), byte(2)] }
	if (full.length === 8) color.alpha = byte(3)
	return color
}

const ALIASES: Record<string, string> = { __proto__: null as never, rgba: 'rgb', hsla: 'hsl' }

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
	return scan(text) ?? parseGeneric(input, text)
}

/**
 * The regex-based parser: every accepted form, and every error message. `parse`
 * tries {@link scan} first, which takes only the plain valid forms and leaves
 * the rest, including every error, to this.
 */
export function parseGeneric(input: string, text: string): Color {
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

/** A color as given, or parsed with {@link parse} when it is a string. */
export const toColor = (c: Color | string): Color => (typeof c === 'string' ? parse(c) : c)

// --- The scanner: a char-code fast path for hex and the functional forms ---

const isSpace = (c: number): boolean => c === 32 || c === 9 || c === 10 || c === 13 || c === 12
const isDigit = (c: number): boolean => c >= 48 && c <= 57
const hexValue = (c: number): number => (c >= 48 && c <= 57 ? c - 48 : c >= 97 && c <= 102 ? c - 87 : -1)

// Scanner state, shared across calls: `parse` is synchronous and does not re-enter.
let at = 0
let percent = false

function scanHex(text: string): Color | undefined {
	const len = text.length
	if (len !== 4 && len !== 5 && len !== 7 && len !== 9) return undefined
	const short = len < 6
	const count = short ? len - 1 : (len - 1) / 2
	const bytes: number[] = []
	for (let i = 0; i < count; i++) {
		let value: number
		if (short) {
			const d = hexValue(text.charCodeAt(1 + i))
			value = d * 17
			if (d < 0) return undefined
		} else {
			const hi = hexValue(text.charCodeAt(1 + i * 2))
			const lo = hexValue(text.charCodeAt(2 + i * 2))
			if (hi < 0 || lo < 0) return undefined
			value = hi * 16 + lo
		}
		bytes.push(value / 255)
	}
	const color: Color = { colorSpace: 'srgb', components: [bytes[0], bytes[1], bytes[2]] }
	if (count === 4) color.alpha = bytes[3]
	return color
}

/** Skips whitespace from `at` up to `end`. */
function skip(text: string, end: number): void {
	while (at < end && isSpace(text.charCodeAt(at))) at++
}

/** The end of the token that starts at `at`: it runs to whitespace, a comma, a slash or `end`. */
function tokenEnd(text: string, end: number): number {
	let j = at
	while (j < end) {
		const c = text.charCodeAt(j)
		if (isSpace(c) || c === 44 || c === 47) break
		j++
	}
	return j
}

/**
 * Reads the token at `at` as {@link channel} would, or returns `undefined` when
 * it is anything but a plain valid one. Leaves `at` after the token.
 */
function scanChannel(text: string, end: number, spec: Channel): Component | undefined {
	const s = at
	const e = tokenEnd(text, end)
	at = e
	if (e === s) return undefined
	if (e - s === 4 && text.startsWith('none', s)) return null
	let j = s
	let c = text.charCodeAt(j)
	if (c === 43 || c === 45) c = text.charCodeAt(++j)
	let digits = 0
	while (isDigit(c)) {
		c = text.charCodeAt(++j)
		digits++
	}
	if (c === 46) {
		c = text.charCodeAt(++j)
		while (isDigit(c)) {
			c = text.charCodeAt(++j)
			digits++
		}
	}
	if (digits === 0) return undefined
	if (c === 101) {
		let k = j + 1
		let x = text.charCodeAt(k)
		if (x === 43 || x === 45) x = text.charCodeAt(++k)
		if (isDigit(x)) {
			while (isDigit(text.charCodeAt(k))) k++
			j = k
		}
	}
	const n = Number(text.slice(s, j))
	if (spec.hue) {
		const unit = j === e ? 1 : UNITS[text.slice(j, e)]
		return unit === undefined ? undefined : n * unit
	}
	let value: number
	if (j === e) value = n / (spec.div ?? 1)
	else if (e - j === 1 && text.charCodeAt(j) === 37) {
		percent = true
		value = (n * spec.pct) / 100
	} else return undefined
	return Math.min(spec.max ?? Number.POSITIVE_INFINITY, Math.max(spec.min ?? Number.NEGATIVE_INFINITY, value))
}

/**
 * Parses the plain valid forms (hex, and the comma or space forms of the
 * functions) by char code, with no regex, split or per-token array. Anything
 * else returns `undefined`, so that {@link parseGeneric} handles it and says
 * why it is wrong.
 */
function scan(text: string): Color | undefined {
	if (text.charCodeAt(0) === 35) return scanHex(text)
	const end = text.length - 1
	if (text.charCodeAt(end) !== 41) return undefined
	let open = 0
	while (open < end) {
		const c = text.charCodeAt(open)
		if (c < 97 || c > 122) break
		open++
	}
	if (open === 0 || text.charCodeAt(open) !== 40) return undefined
	const rawName = text.slice(0, open)
	const name = ALIASES[rawName] ?? rawName
	let space: ColorSpaceId
	let channels: [Channel, Channel, Channel]
	at = open + 1
	skip(text, end)
	if (name === 'color') {
		const s = at
		while (at < end && !isSpace(text.charCodeAt(at))) at++
		const id = COLOR_SPACES[text.slice(s, at)]
		if (!id) return undefined
		space = id
		channels = [UNIT, UNIT, UNIT]
		skip(text, end)
	} else {
		const fn = FUNCTIONS[name]
		if (!fn) return undefined
		;({ space, channels } = fn)
	}
	percent = false
	const c0 = scanChannel(text, end, channels[0])
	if (c0 === undefined) return undefined
	const p0 = percent
	skip(text, end)
	const comma = text.charCodeAt(at) === 44
	if (comma && name !== 'rgb' && name !== 'hsl') return undefined
	let alpha: Component | undefined
	let c1: Component | undefined
	let c2: Component | undefined
	let p1 = false
	let p2 = false
	if (comma) {
		at++
		skip(text, end)
		percent = false
		c1 = scanChannel(text, end, channels[1])
		p1 = percent
		skip(text, end)
		if (text.charCodeAt(at++) !== 44) return undefined
		skip(text, end)
		percent = false
		c2 = scanChannel(text, end, channels[2])
		p2 = percent
		skip(text, end)
		if (c0 === null || c1 === undefined || c1 === null || c2 === undefined || c2 === null) return undefined
		const ok = space === 'hsl' ? !p0 && p1 && p2 : p0 === p1 && p1 === p2
		if (!ok) return undefined
		if (at < end) {
			if (text.charCodeAt(at++) !== 44) return undefined
			skip(text, end)
			alpha = scanChannel(text, end, ALPHA)
			if (alpha === undefined || alpha === null) return undefined
			skip(text, end)
		}
	} else {
		c1 = scanChannel(text, end, channels[1])
		skip(text, end)
		c2 = scanChannel(text, end, channels[2])
		skip(text, end)
		if (at < end) {
			if (text.charCodeAt(at++) !== 47) return undefined
			skip(text, end)
			alpha = scanChannel(text, end, ALPHA)
			if (alpha === undefined) return undefined
			skip(text, end)
		}
	}
	if (at !== end || c1 === undefined || c2 === undefined) return undefined
	const color: Color = { colorSpace: space, components: [c0, c1, c2] }
	if (alpha !== undefined) color.alpha = alpha
	return color
}
