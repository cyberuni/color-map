import type { RGBA } from './interfaces.js'

/** Formats an `RGBA` as a CSS `rgba(r,g,b,a)` string, with no spaces. */
export function rgbaString(rgba: RGBA) {
	return 'rgba(' + rgba.join(',') + ')'
}
