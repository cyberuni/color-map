import { type cli, command, t } from 'clibuilder'
import { fullOption, result } from 'clibuilder/axi'
import { findContrast } from '../../color/index.js'
import { describe, readColor, round } from '../shared.js'

const definition = command({
	name: 'find-contrast',
	description: 'Find the color closest in lightness to a background that reaches a WCAG 2 contrast target',
	arguments: [{ name: 'bg', description: 'The background color', type: t.string() }],
	options: {
		target: { description: 'The contrast ratio to reach, 1 to 21', type: t.number({ min: 1, max: 21 }), default: 4.5 },
		hue: {
			description: "OKLCH hue of the result in degrees (default: the background's hue)",
			type: t.number().optional()
		},
		chroma: { description: 'OKLCH chroma of the result (default 0, a gray)', type: t.number({ min: 0 }).optional() },
		direction: { description: 'Which way to look first', type: t.enum(['lighter', 'darker']).optional() },
		full: fullOption
	},
	run(args) {
		const found = findContrast(readColor(args.bg, 'bg'), args.target, {
			hue: args.hue,
			chroma: args.chroma,
			direction: args.direction
		})
		return result({
			bg: args.bg,
			target: args.target,
			...describe(found.color, args.full === true),
			ratio: round(found.contrast),
			met: found.met
		})
	}
})

/** Typed as the plain command so its declaration does not name args-minus' internals. */
export const findContrastCommand: cli.Command = definition
