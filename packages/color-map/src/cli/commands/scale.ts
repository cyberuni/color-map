import { type cli, command, t } from 'clibuilder'
import { CliError, exitCodes, fullOption, result } from 'clibuilder/axi'
import { type Color, contrast, inGamut, toCss, toHex } from '../../color/index.js'
import { createContrastScale, createScale, scaleFromBrand } from '../../scale/index.js'
import { GAMUTS, MODES, PRESETS, readColor, round } from '../shared.js'

const WHITE = '#ffffff'
const BLACK = '#000000'

function rows(colors: Color[], full: boolean) {
	return colors.map((color, i) => ({
		step: i + 1,
		hex: toHex(color),
		onWhite: round(contrast(color, WHITE)),
		onBlack: round(contrast(color, BLACK)),
		...(full ? { css: toCss(color), inSrgb: inGamut(color, 'srgb') } : {})
	}))
}

const definition = command({
	name: 'scale',
	description: 'Build a color scale from a seed color: a preset, a Radix-style brand scale, or contrast targets',
	arguments: [{ name: 'seed', description: 'The color the scale is built around', type: t.string() }],
	options: {
		preset: { description: 'The scale shape', type: t.enum([...PRESETS]), default: 'tailwind-11' },
		steps: { description: 'Steps of an even scale; replaces --preset', type: t.int({ min: 2 }).optional() },
		brand: { description: 'Build a 12-step UI scale where the seed is step 9 exactly', type: t.boolean().optional() },
		mode: { description: 'light or dark, for --brand', type: t.enum([...MODES]), default: 'light' },
		background: {
			description: 'The background: page color for --brand, or what --targets are measured against',
			type: t.string().optional()
		},
		targets: {
			description: 'Contrast ratios, one per step, such as 3,4.5,7: builds a contrast scale',
			type: t.array(t.number({ min: 1, max: 21 })).optional()
		},
		gamut: { description: 'The gamut every step must fit', type: t.enum([...GAMUTS]), default: 'srgb' },
		full: fullOption
	},
	run(args) {
		const full = args.full === true
		const seed = readColor(args.seed, 'seed')
		const background = args.background === undefined ? undefined : readColor(args.background, 'background')
		if (args.targets) {
			if (!background)
				throw new CliError('--targets needs --background', {
					code: 'missing-option',
					exitCode: exitCodes.usage,
					details: { option: 'background' },
					help: `Run \`color-map scale '${args.seed}' --targets 3 --targets 4.5 --background '#ffffff'\``
				})
			const steps = createContrastScale({ seed, background, targets: args.targets })
			const rows = steps.map((s) => ({
				step: Number(s.name) + 1,
				target: s.target,
				hex: toHex(s.color),
				ratio: round(s.contrast),
				met: s.met,
				...(full ? { css: toCss(s.color) } : {})
			}))
			return result({ kind: 'contrast', seed: args.seed, background: args.background, steps: rows })
		}
		const colors = args.brand
			? scaleFromBrand(seed, { mode: args.mode, background, gamut: args.gamut })
			: createScale({ seed, steps: args.steps ?? args.preset, gamut: args.gamut })
		const kind = args.brand ? 'brand-12' : args.steps ? `even-${args.steps}` : args.preset
		return result(
			{ kind, seed: args.seed, steps: rows(colors, full) },
			{ help: `Run \`color-map export '${args.seed}' --source scale --to tailwind\` to get it as a Tailwind v4 theme` }
		)
	}
})

/** Typed as the plain command so its declaration does not name args-minus' internals. */
export const scale: cli.Command = definition
