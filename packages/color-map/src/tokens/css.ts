import { type ToCssOptions, toCss } from '../color/serialize.js'
import { convert } from '../color/spaces.js'
import type { ColorSpaceId } from '../color/types.js'
import { cssNames, flatten, type TokenTree } from './tokens.js'

export interface CssVariablesOptions extends ToCssOptions {
	/** The first part of every name. Default `color`, so `primary.500` becomes `--color-primary-500`. */
	prefix?: string
	/** The rule's selector. Default `:root`. */
	selector?: string
	/** Convert every color to this space first. Default: print each in its own space. */
	space?: ColorSpaceId
}

/** Prints one `--name: value;` line per color. */
export function declarations(tree: TokenTree, options: CssVariablesOptions & { prefix: string }): string[] {
	const { prefix, space, ...css } = options
	return [...cssNames(flatten(tree), prefix)].map(
		([name, color]) => `${name}: ${toCss(space ? convert(color, space) : color, css)};`
	)
}

/**
 * Exports colors as CSS custom properties in one rule:
 * `:root {\n\t--color-primary-500: oklch(0.62 0.19 260);\n}`.
 */
export function toCssVariables(tree: TokenTree, options: CssVariablesOptions = {}): string {
	const { selector = ':root', prefix = 'color', ...rest } = options
	const lines = declarations(tree, { ...rest, prefix })
	return `${selector} {\n${lines.map((l) => `\t${l}\n`).join('')}}\n`
}
