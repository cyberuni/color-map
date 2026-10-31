import { type cli, command, t } from 'clibuilder'
import { fullOption, result } from 'clibuilder/axi'
import { mix as mixColors } from 'color-map/color'
import { describe, HUE_METHODS, readColor, SPACES } from '../shared.js'

const definition = command({
	name: 'mix',
	description: 'Mix two CSS colors, as color-mix() does',
	arguments: [
		{ name: 'a', description: 'The first color', type: t.string() },
		{ name: 'b', description: 'The second color', type: t.string() }
	],
	options: {
		amount: { description: 'How far from a to b, 0 to 1', type: t.number({ min: 0, max: 1 }), default: 0.5 },
		in: { description: 'The space to interpolate in', type: t.enum([...SPACES]), default: 'oklab' },
		hue: { description: 'How hues travel in a polar space', type: t.enum([...HUE_METHODS]), default: 'shorter' },
		full: fullOption
	},
	run(args) {
		const mixed = mixColors(readColor(args.a, 'a'), readColor(args.b, 'b'), args.amount, { in: args.in, hue: args.hue })
		return result(
			{ a: args.a, b: args.b, amount: args.amount, in: args.in, ...describe(mixed, args.full === true) },
			{ help: `Run \`color-map contrast '${describe(mixed, false).hex}' '#ffffff'\` to check it against white` }
		)
	}
})

/** Typed as the plain command so its declaration does not name args-minus' internals. */
export const mix: cli.Command = definition
