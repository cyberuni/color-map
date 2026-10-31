import type { ColorSpaceId } from '../color/types.js'
import { type CssVariablesOptions, declarations } from './css.js'
import type { TokenTree } from './tokens.js'

export interface TailwindThemeOptions extends Omit<CssVariablesOptions, 'selector' | 'prefix'> {
	/** The theme variable namespace. Default `color`, which makes `bg-primary-500` and `text-primary-500` work. */
	namespace?: string
	/** Write `@theme inline`, so utilities hold the value instead of a `var()` reference. */
	inline?: boolean
	/** Default `oklch`, the space Tailwind v4's own palette uses. */
	space?: ColorSpaceId
}

/**
 * Exports colors as a Tailwind v4 `@theme` block. Paste it into the CSS file
 * that has `@import "tailwindcss"`. An array of 11 colors gets the keys
 * 50 to 950, so a `tailwind-11` scale reads like Tailwind's own.
 */
export function toTailwindTheme(tree: TokenTree, options: TailwindThemeOptions = {}): string {
	const { namespace = 'color', inline = false, space = 'oklch', ...rest } = options
	const lines = declarations(tree, { ...rest, space, prefix: namespace })
	return `@theme${inline ? ' inline' : ''} {\n${lines.map((l) => `\t${l}\n`).join('')}}\n`
}
