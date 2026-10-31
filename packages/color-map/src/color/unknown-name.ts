/**
 * The error for a name a caller wrote that the library does not know: it names
 * the value and lists the valid ones, in the style of `unknown color space`.
 */
export function unknownName(what: string, value: unknown, valid: readonly string[]): Error {
	return new Error(
		`color-map: unknown ${what} "${String(value)}"${valid.length ? `; use one of ${valid.join(', ')}` : ''}`
	)
}

/** `mode` itself when it is `light` or `dark`; any other value is an unknown mode. */
export function checkMode<T>(mode: T): T {
	if (mode !== 'light' && mode !== 'dark') throw unknownName('mode', mode, ['light', 'dark'])
	return mode
}
