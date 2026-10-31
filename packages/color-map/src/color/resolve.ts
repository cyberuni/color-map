import { evaluate } from './calc.js'
import { wcag2 } from './contrast.js'
import { type ColorExpr, parseExpr } from './expr.js'
import { mix } from './mix.js'
import { ALPHA, channel, FUNCTIONS, fail, UNIT } from './parse.js'
import { componentsIn } from './spaces.js'
import type { Color, Component } from './types.js'

export interface ResolveContext {
	/** What `currentcolor` means. */
	currentColor?: string | ColorExpr
	/** Which side `light-dark()` takes. Default `light`. */
	colorScheme?: 'light' | 'dark'
	/** What each system color (`canvas`, `buttontext`, ...) means, by lowercase name. */
	systemColors?: Record<string, string | ColorExpr>
}

/** The names a relative color's channel keywords have, by space, one letter each. The RGB spaces use `rgb`. */
const KEYWORDS: Record<string, string> = {
	hsl: 'hsl',
	hwb: 'hwb',
	lab: 'lab',
	lch: 'lch',
	oklab: 'lab',
	oklch: 'lch',
	'xyz-d50': 'xyz',
	'xyz-d65': 'xyz'
}
const SIMPLE = /^(?:none|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?[a-z%]*)$/

const WHITE: Color = { colorSpace: 'srgb', components: [1, 1, 1] }
const BLACK: Color = { colorSpace: 'srgb', components: [0, 0, 0] }

/** WCAG 2 choice between white and black: whichever contrasts more with the color. */
function contrastColor(color: Color): Color {
	return wcag2(WHITE, color) >= wcag2(BLACK, color) ? WHITE : BLACK
}

function resolveRelative(node: Extract<ColorExpr, { type: 'relative' }>, context: ResolveContext): Color {
	const origin = resolve(node.from, context)
	const c = componentsIn(origin, node.space)
	const scale = node.fn === 'rgb' ? 255 : 1
	const names = KEYWORDS[node.space] ?? 'rgb'
	const vars: Record<string, number> = { alpha: origin.alpha === undefined ? 1 : (origin.alpha ?? 0) }
	for (let i = 0; i < 3; i++) vars[names[i]] = (c[i] ?? 0) * scale
	const specs = node.fn === 'color' ? [UNIT, UNIT, UNIT] : FUNCTIONS[node.fn].channels
	const value = (token: string, spec: typeof ALPHA): Component =>
		channel(SIMPLE.test(token) ? token : String(evaluate(token, vars)), spec, token)
	const result: Color = { colorSpace: node.space, components: node.channels.map((t, i) => value(t, specs[i])) }
	const alpha = node.alpha === undefined ? origin.alpha : value(node.alpha, ALPHA)
	if (alpha !== undefined) result.alpha = alpha
	return result
}

function resolveMix(node: Extract<ColorExpr, { type: 'color-mix' }>, context: ResolveContext): Color {
	const [first, second] = node.items
	const p1 = first.percent ?? (second.percent === undefined ? 50 : 100 - second.percent)
	const p2 = second.percent ?? 100 - p1
	const sum = p1 + p2
	if (sum <= 0) return fail('color-mix()', 'the percentages must add up to more than 0')
	const options = node.hue === undefined ? { in: node.space } : { in: node.space, hue: node.hue }
	const result = mix(resolve(first.color, context), resolve(second.color, context), p2 / sum, options)
	// Percentages adding up to less than 100% make the result translucent.
	if (sum < 100 && result.alpha !== null) result.alpha = (result.alpha ?? 1) * (sum / 100)
	return result
}

/**
 * Turns a color, a CSS string or a {@link ColorExpr} into a concrete {@link Color}.
 * `currentcolor`, system colors and `light-dark()` read `context`; nothing is
 * guessed, so a missing entry throws and names the value.
 */
export function resolve(input: string | ColorExpr, context: ResolveContext = {}): Color {
	const expr = typeof input === 'string' ? parseExpr(input) : input
	if ('colorSpace' in expr) return expr
	if (expr.type === 'light-dark') return resolve(context.colorScheme === 'dark' ? expr.dark : expr.light, context)
	if (expr.type === 'color-mix') return resolveMix(expr, context)
	if (expr.type === 'relative') return resolveRelative(expr, context)
	if (expr.type === 'contrast-color') return contrastColor(resolve(expr.color, context))
	const name = expr.type === 'currentcolor' ? 'currentcolor' : expr.name
	const value = expr.type === 'currentcolor' ? context.currentColor : context.systemColors?.[name]
	if (value === undefined)
		return fail(name, `needs ${expr.type === 'currentcolor' ? 'currentColor' : `systemColors.${name}`} to resolve`)
	return resolve(value, { ...context, currentColor: undefined })
}
