import { type Color, parse, toCss } from 'color-map/color'

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escapes text that came from the user before it goes into innerHTML. */
export function esc(text: string): string {
	return text.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c)
}

/** Parses a color, or returns the error message instead of throwing. */
export function tryParse(input: string): Color | string {
	try {
		return parse(input.trim())
	} catch (error) {
		return error instanceof Error ? error.message : String(error)
	}
}

/** A swatch for a library color. The CSS comes from `toCss`, so it is safe in an attribute. */
export function swatch(color: Color, label = '', title = ''): string {
	const css = toCss(color)
	return `<figure class="sw" title="${esc(title || css)}"><span style="background:${esc(css)}"></span><figcaption>${esc(label)}</figcaption></figure>`
}

export function el<T extends HTMLElement>(root: ParentNode, selector: string): T {
	const found = root.querySelector<T>(selector)
	if (!found) throw new Error(`missing ${selector}`)
	return found
}
