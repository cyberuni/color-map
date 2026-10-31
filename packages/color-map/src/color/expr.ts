import type { HueMethod } from './mix.js'
import { COLOR_SPACES, FUNCTIONS, fail, parse, VALUES_NEEDING_RESOLVE } from './parse.js'
import type { Color, ColorSpaceId } from './types.js'

/** A color that needs a context to become concrete: see {@link resolve}. */
export type ColorExpr =
	| Color
	| { type: 'currentcolor' }
	| { type: 'system'; name: string }
	| { type: 'light-dark'; light: ColorExpr; dark: ColorExpr }
	| { type: 'contrast-color'; color: ColorExpr }
	| {
			type: 'color-mix'
			space: ColorSpaceId
			hue?: HueMethod
			/** Exactly two. `percent` is 0 to 100, absent when not written. */
			items: { color: ColorExpr; percent?: number }[]
	  }
	| {
			/** `rgb(from red r g b)` and the like. The channels are kept as written, for `resolve` to evaluate. */
			type: 'relative'
			/** The function name: `rgb`, `hsl`, `hwb`, `lab`, `lch`, `oklab`, `oklch` or `color`. */
			fn: string
			space: ColorSpaceId
			from: ColorExpr
			channels: [string, string, string]
			alpha?: string
	  }

const INTERPOLATION_SPACES: Record<string, ColorSpaceId> = {
	__proto__: null as never,
	...COLOR_SPACES,
	hsl: 'hsl',
	hwb: 'hwb',
	lab: 'lab',
	lch: 'lch',
	oklab: 'oklab',
	oklch: 'oklch'
}
const HUE_METHODS = new Set(['shorter', 'longer', 'increasing', 'decreasing'])
const RELATIVE = new Set(['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'])
const PERCENT = /^[+-]?(?:\d+\.?\d*|\.\d+)%$/

/** Splits at top-level commas, or at top-level whitespace with `/` as its own item. */
function split(text: string, commas: boolean, input: string): string[] {
	const out: string[] = []
	let depth = 0
	let current = ''
	const flush = (): void => {
		if (commas || current) out.push(current.trim())
		current = ''
	}
	for (const ch of text) {
		if (ch === '(') depth++
		else if (ch === ')') depth--
		if (depth === 0 && (commas ? ch === ',' : /\s|\//.test(ch))) {
			flush()
			if (ch === '/') out.push('/')
		} else current += ch
	}
	if (depth !== 0) return fail(input, 'unbalanced parentheses')
	flush()
	return out
}

/** Splits `name(body)`, or returns undefined when the text is not one call that ends the text. */
function call(text: string): [string, string] | undefined {
	const open = text.indexOf('(')
	if (open < 1 || !text.endsWith(')') || !/^[a-z-]+$/.test(text.slice(0, open))) return undefined
	let depth = 0
	for (let i = open; i < text.length; i++) {
		if (text[i] === '(') depth++
		else if (text[i] === ')' && --depth === 0 && i < text.length - 1) return undefined
	}
	return [text.slice(0, open), text.slice(open + 1, -1)]
}

function colorMix(body: string, input: string): ColorExpr {
	const [head, ...rest] = split(body, true, input)
	const words = head.split(/\s+/)
	if (words[0] !== 'in' || !INTERPOLATION_SPACES[words[1]])
		return fail(input, 'color-mix() needs "in <space>"', words[1])
	const space = INTERPOLATION_SPACES[words[1]]
	let hue: HueMethod | undefined
	if (words.length > 2) {
		if (words.length !== 4 || words[3] !== 'hue' || !HUE_METHODS.has(words[2])) {
			return fail(input, 'invalid hue interpolation', words.slice(2).join(' '))
		}
		hue = words[2] as HueMethod
	}
	if (rest.length !== 2) return fail(input, `color-mix() needs two colors, got ${rest.length}`)
	const items = rest.map((text) => {
		const parts = split(text, false, input)
		const percents = parts.filter((p) => PERCENT.test(p))
		if (parts.length - percents.length !== 1 || percents.length > 1)
			return fail(input, 'invalid color-mix() item', text)
		const percent = percents.length === 1 ? Number.parseFloat(percents[0]) : undefined
		if (percent !== undefined && percent < 0) return fail(input, 'negative percentage', text)
		const color = parseExpr(parts.find((p) => !PERCENT.test(p)) as string)
		return percent === undefined ? { color } : { color, percent }
	})
	return hue === undefined ? { type: 'color-mix', space, items } : { type: 'color-mix', space, hue, items }
}

function relative(name: string, words: string[], input: string): ColorExpr {
	const from = words[1] === undefined ? fail(input, 'missing origin color') : parseExpr(words[1])
	let space: ColorSpaceId
	let at = 2
	const fn = name === 'rgba' ? 'rgb' : name === 'hsla' ? 'hsl' : name
	if (fn === 'color') {
		const id = COLOR_SPACES[words[2]]
		if (!id) return fail(input, 'unknown color space', words[2])
		space = id
		at = 3
	} else space = FUNCTIONS[fn].space
	const channels = words.slice(at, at + 3)
	const tail = words.slice(at + 3)
	if (channels.length !== 3) return fail(input, `expected 3 components, got ${channels.length}`)
	if (tail.length > 0 && (tail[0] !== '/' || tail.length !== 2))
		return fail(input, 'expected "/ alpha" after the components')
	const node: Extract<ColorExpr, { type: 'relative' }> = {
		type: 'relative',
		fn,
		space,
		from,
		channels: channels as [string, string, string]
	}
	if (tail.length === 2) node.alpha = tail[1]
	return node
}

/**
 * Parses any CSS Color 4 or 5 color into a {@link ColorExpr}: everything
 * `parse` takes, plus `currentcolor`, system colors, `light-dark()`,
 * `color-mix()`, `contrast-color()` and relative colors such as
 * `oklch(from #3b82f6 calc(l + 0.1) c h)`. A concrete color comes back as a
 * plain {@link Color}; the rest are nodes that {@link resolve} turns into one.
 */
export function parseExpr(input: string): ColorExpr {
	const text = input.trim().toLowerCase()
	if (text === 'currentcolor') return { type: 'currentcolor' }
	if (VALUES_NEEDING_RESOLVE.test(text)) return { type: 'system', name: text }
	const parts = call(text)
	if (!parts) return parse(text)
	const [name, body] = parts
	if (name === 'color-mix') return colorMix(body, input)
	if (name === 'light-dark') {
		const list = split(body, true, input)
		if (list.length !== 2) return fail(input, `light-dark() needs two colors, got ${list.length}`)
		return { type: 'light-dark', light: parseExpr(list[0]), dark: parseExpr(list[1]) }
	}
	if (name === 'contrast-color') return { type: 'contrast-color', color: parseExpr(body) }
	if (RELATIVE.has(name)) {
		const words = split(body, false, input)
		if (words[0] === 'from') return relative(name, words, input)
	}
	return parse(text)
}
