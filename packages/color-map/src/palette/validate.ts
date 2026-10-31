import { type ContrastOption, pick } from '../color/contrast.js'
import { type GamutId, inGamut } from '../color/gamut.js'
import { componentsIn } from '../color/spaces.js'
import type { Color } from '../color/types.js'
import type { RolePair } from './semantic.js'

/** What `validate` accepts: a {@link SemanticPalette}, or any object with role pairs and/or scales. */
export interface PaletteLike {
	roles?: Record<string, RolePair>
	scales?: Record<string, readonly Color[]>
}

export interface ValidateOptions {
	/** The measure used to re-check each pair. Default `wcag2`. */
	contrast?: ContrastOption
	/** The target for a pair that carries none. Default 4.5. */
	target?: number
	/** The gamut colors must fit; a color outside it was clipped or never mapped. Default `srgb`. */
	gamut?: GamutId
}

export interface PaletteIssue {
	kind: 'contrast' | 'lightness' | 'gamut'
	/** Where: `roles.danger`, `scales.primary[3]`. */
	path: string
	message: string
}

export interface ValidateResult {
	ok: boolean
	issues: PaletteIssue[]
}

/**
 * Checks a palette and lists what is wrong, so an agent can fix it:
 * - `contrast`: a role pair whose measured contrast is under its target;
 * - `lightness`: a scale whose OKLCH lightness does not change steadily in one
 *   direction from one step to the next;
 * - `gamut`: a color outside the gamut (it would be clipped on display).
 */
export function validate(palette: PaletteLike, options: ValidateOptions = {}): ValidateResult {
	const { contrast = 'wcag2', target = 4.5, gamut = 'srgb' } = options
	const fn = pick(contrast)
	const issues: PaletteIssue[] = []
	const outside = (path: string, color: Color) => {
		if (!inGamut(color, gamut)) issues.push({ kind: 'gamut', path, message: `${path} is outside ${gamut}` })
	}

	for (const [name, p] of Object.entries(palette.roles ?? {})) {
		const need = p.target ?? target
		const ratio = Math.abs(fn(p.fg, p.bg))
		if (ratio < need)
			issues.push({
				kind: 'contrast',
				path: `roles.${name}`,
				message: `roles.${name} reaches ${ratio.toFixed(2)}, needs ${need}`
			})
		outside(`roles.${name}.bg`, p.bg)
		outside(`roles.${name}.fg`, p.fg)
	}

	for (const [name, scale] of Object.entries(palette.scales ?? {})) {
		const ls = scale.map((c) => componentsIn(c, 'oklch')[0] as number)
		const steps = ls.slice(1).map((l, k) => l - (ls[k] as number))
		const direction = Math.sign(steps.find((d) => d !== 0) ?? 0)
		steps.forEach((d, k) => {
			if (Math.sign(d) !== direction || Math.abs(d) < 1e-9)
				issues.push({
					kind: 'lightness',
					path: `scales.${name}[${k + 1}]`,
					message: `scales.${name} lightness does not change steadily at step ${k + 1}`
				})
		})
		scale.forEach((c, k) => {
			outside(`scales.${name}[${k}]`, c)
		})
	}
	return { ok: issues.length === 0, issues }
}
