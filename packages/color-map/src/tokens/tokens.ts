import { parse } from '../color/parse.js'
import type { Color } from '../color/types.js'
import type { SemanticPalette } from '../palette/semantic.js'

/**
 * What the exporters accept: a color, a CSS color string, an array of them (a
 * scale), or an object of any of these nested to any depth. A `SemanticPalette`
 * works as is: its `scales` and its role pairs export, its `meta` and ratios do not.
 */
export type TokenTree = SemanticPalette | Color | string | readonly TokenTree[] | { readonly [name: string]: TokenTree }

/** A color and the path of names that leads to it. */
export interface Token {
	path: string[]
	color: Color
}

const TAILWIND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

const isColor = (v: unknown): v is Color =>
	typeof v === 'object' &&
	v !== null &&
	typeof (v as Color).colorSpace === 'string' &&
	Array.isArray((v as Color).components)

// A semantic palette carries numbers (`ratio`, `target`, `meta`) that are not colors.
function dropMeasures(tree: Record<string, unknown>): Record<string, unknown> {
	const { meta: _meta, scales, roles, ...rest } = tree
	const pairs = Object.fromEntries(
		Object.entries(roles as Record<string, { bg: Color; fg: Color }>).map(([name, p]) => [name, { bg: p.bg, fg: p.fg }])
	)
	return { ...rest, ...(scales as object), roles: pairs }
}

const isSemantic = (v: object): boolean => 'roles' in v && 'scales' in v && 'meta' in v

/**
 * Walks a token tree into a flat list. An array gets the Tailwind keys
 * (50 to 950) when it has 11 colors and 1-based numbers otherwise; pass an
 * object to choose the keys. A value that is not a color, a string, an array
 * or an object throws with its path.
 */
export function flatten(tree: TokenTree): Token[] {
	const out: Token[] = []
	const walk = (node: unknown, path: string[]): void => {
		if (typeof node === 'string') return void out.push({ path, color: parse(node) })
		if (isColor(node)) return void out.push({ path, color: node })
		if (Array.isArray(node)) {
			node.forEach((v, i) => {
				walk(v, [...path, String(node.length === TAILWIND_STEPS.length ? TAILWIND_STEPS[i] : i + 1)])
			})
			return
		}
		if (typeof node === 'object' && node !== null) {
			const obj = isSemantic(node) ? dropMeasures(node as Record<string, unknown>) : (node as Record<string, unknown>)
			for (const [k, v] of Object.entries(obj)) walk(v, [...path, k])
			return
		}
		throw new TypeError(`${path.join('.') || '(root)'} is not a color, a string, an array or an object`)
	}
	walk(tree, [])
	return out
}

/** `primaryContainer` and `Primary Container` both become `primary-container`. */
export const kebab = (name: string): string =>
	name
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase()

/** Names tokens for CSS: kebab-case segments joined by `-` after `prefix`. Two tokens with one name throw. */
export function cssNames(tokens: Token[], prefix: string): Map<string, Color> {
	const out = new Map<string, Color>()
	for (const { path, color } of tokens) {
		const name = `--${[prefix, ...path].map(kebab).filter(Boolean).join('-')}`
		if (out.has(name)) throw new Error(`${name} is produced by more than one token`)
		out.set(name, color)
	}
	return out
}
