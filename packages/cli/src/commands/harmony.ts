import { type cli, command, t } from 'clibuilder'
import { result } from 'clibuilder/axi'
import { toCss, toHex } from 'color-map/color'
import { harmony as harmonyOf } from 'color-map/palette'
import { GAMUTS, POLAR_SPACES, readColor } from '../shared.js'

export const SCHEMES = ['complementary', 'split', 'analogous', 'triadic', 'tetradic'] as const

const definition = command({
	name: 'harmony',
	description: 'The colors of a harmony scheme: the color rotated around the hue wheel',
	arguments: [{ name: 'color', description: 'The base color', type: t.string() }],
	options: {
		scheme: { description: 'The harmony scheme', type: t.enum([...SCHEMES]), default: 'complementary' },
		space: { description: 'The space whose hue is rotated', type: t.enum([...POLAR_SPACES]), default: 'oklch' },
		gamut: { description: 'The gamut every color must fit', type: t.enum([...GAMUTS]), default: 'srgb' }
	},
	run(args) {
		const colors = harmonyOf(readColor(args.color), args.scheme, { space: args.space, gamut: args.gamut })
		return result({
			color: args.color,
			scheme: args.scheme,
			space: args.space,
			colors: colors.map((c, i) => ({ index: i + 1, hex: toHex(c), css: toCss(c) }))
		})
	}
})

/** Typed as the plain command so its declaration does not name args-minus' internals. */
export const harmony: cli.Command = definition
