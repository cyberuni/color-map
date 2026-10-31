import { type cli, command, t } from 'clibuilder'
import { fullOption, result } from 'clibuilder/axi'
import { convert as convertColor, inGamut, toGamut } from 'color-map/color'
import { describe, GAMUTS, readColor, SPACES } from '../shared.js'

const definition = command({
	name: 'convert',
	description: 'Convert a CSS color to another color space',
	arguments: [
		{ name: 'color', description: 'Any CSS color, such as "#3b82f6" or "oklch(0.7 0.15 250)"', type: t.string() }
	],
	options: {
		to: { description: 'Target color space', type: t.enum([...SPACES]), default: 'srgb' },
		gamut: {
			description: 'Map the result into this gamut (CSS gamut mapping) when it falls outside',
			type: t.enum([...GAMUTS]).optional()
		},
		full: fullOption
	},
	run(args) {
		const input = readColor(args.color)
		const converted = convertColor(input, args.to)
		const mapped = args.gamut ? toGamut(converted, { gamut: args.gamut }) : converted
		const out = {
			input: args.color,
			to: args.to,
			...describe(mapped, args.full === true),
			...(args.full ? { inSrgb: inGamut(mapped, 'srgb'), inDisplayP3: inGamut(mapped, 'display-p3') } : {})
		}
		return result(out, {
			help: `Run \`color-map mix '${args.color}' '<other color>'\` to blend it with another color`
		})
	}
})

/** Typed as the plain command so its declaration does not name args-minus' internals. */
export const convert: cli.Command = definition
