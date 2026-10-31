import { type cli, command, t } from 'clibuilder'
import { result } from 'clibuilder/axi'
import { contrast as contrastOf, meets } from 'color-map/color'
import { readColor, round } from '../shared.js'

const definition = command({
	name: 'contrast',
	description: 'WCAG 2 contrast ratio of a text color on a background, with the AA and AAA verdicts',
	arguments: [
		{ name: 'fg', description: 'The text (foreground) color', type: t.string() },
		{ name: 'bg', description: 'The background color', type: t.string() }
	],
	run(args) {
		const fg = readColor(args.fg, 'fg')
		const bg = readColor(args.bg, 'bg')
		const pass = (level: string) => meets(fg, bg, level)
		const out = {
			fg: args.fg,
			bg: args.bg,
			algorithm: 'wcag2',
			ratio: round(contrastOf(fg, bg)),
			AA: pass('AA'),
			'AA-large': pass('AA-large'),
			AAA: pass('AAA'),
			'AAA-large': pass('AAA-large')
		}
		return result(out, {
			help: out.AA
				? undefined
				: `Run \`color-map find-contrast '${args.bg}' --target 4.5\` for a text color that passes AA`
		})
	}
})

/** Typed as the plain command so its declaration does not name args-minus' internals. */
export const contrast: cli.Command = definition
