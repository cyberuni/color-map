import { type cli, command, t } from 'clibuilder'
import { fullOption, orEmpty, result } from 'clibuilder/axi'
import { toCss, toHex } from 'color-map/color'
import { semanticPalette, validate } from 'color-map/palette'
import { GAMUTS, MODES, readColor, round } from '../shared.js'

const definition = command({
	name: 'palette',
	description:
		'A semantic palette from one brand color: primary, status colors, surface and outline, each with a text color and its WCAG 2 ratio',
	arguments: [{ name: 'brand', description: 'The brand color', type: t.string() }],
	options: {
		mode: { description: 'light or dark', type: t.enum([...MODES]), default: 'light' },
		target: {
			description: 'The WCAG 2 ratio every text pair must reach',
			type: t.number({ min: 1, max: 21 }),
			default: 4.5
		},
		gamut: { description: 'The gamut every color must fit', type: t.enum([...GAMUTS]), default: 'srgb' },
		full: fullOption
	},
	run(args) {
		const brand = readColor(args.brand, 'brand')
		const made = semanticPalette({ brand, mode: args.mode, target: args.target, gamut: args.gamut })
		const checked = validate(made, { target: args.target, gamut: args.gamut })
		const roles = Object.entries(made.roles).map(([role, p]) => ({
			role,
			bg: toHex(p.bg),
			fg: toHex(p.fg),
			ratio: round(p.ratio),
			target: p.target,
			pass: p.ratio >= p.target
		}))
		const failing = roles.filter((r) => !r.pass).length
		const full = args.full === true
		return result(
			{
				brand: args.brand,
				mode: args.mode,
				contrast: made.meta.contrast,
				passing: roles.length - failing,
				failing,
				roles,
				issues: orEmpty(
					checked.issues.map((i) => ({ kind: i.kind, path: i.path, message: i.message })),
					'none: every pair meets its target and every color fits the gamut'
				),
				...(full
					? {
							primary: made.scales.primary.map((c) => toCss(c)),
							neutral: made.scales.neutral.map((c) => toCss(c))
						}
					: {})
			},
			{
				help: [
					`Run \`color-map export '${args.brand}' --source palette --mode ${args.mode} --to css\` for CSS variables`,
					`Run \`color-map palette '${args.brand}' --mode ${args.mode === 'light' ? 'dark' : 'light'}\` for the other mode`
				]
			}
		)
	}
})

/** Typed as the plain command so its declaration does not name args-minus' internals. */
export const palette: cli.Command = definition
