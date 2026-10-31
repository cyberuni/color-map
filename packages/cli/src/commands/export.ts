import { readFileSync } from 'node:fs'
import { type cli, command, t } from 'clibuilder'
import { CliError, document, exitCodes, isCliError } from 'clibuilder/axi'
import type { ColorSpaceId } from 'color-map/color'
import { toCssVariables, toDTCG, toTailwindTheme } from 'color-map/export'
import { semanticPalette } from 'color-map/palette'
import { createScale } from 'color-map/scale'
import { EXPORT_SOURCES, EXPORT_TARGETS, MODES, readColor, SPACES } from '../shared.js'

function usage(code: string, message: string, help: string, details: CliError.Details = {}) {
	return new CliError(message, { code, exitCode: exitCodes.usage, details, help })
}

function readTokens(path: string): unknown {
	let text: string
	try {
		text = readFileSync(path, 'utf8')
	} catch {
		throw usage(
			'file-not-found',
			`cannot read the token file "${path}"`,
			'Pass a JSON file of CSS color strings, nested as you like',
			{ path }
		)
	}
	try {
		return JSON.parse(text)
	} catch {
		throw usage(
			'invalid-json',
			`"${path}" is not valid JSON`,
			'Pass a JSON file of CSS color strings, nested as you like',
			{ path }
		)
	}
}

const definition = command({
	name: 'export',
	description: 'Write a palette, a scale or your own tokens as DTCG JSON, CSS variables or a Tailwind v4 theme',
	arguments: [
		{
			name: 'color',
			description: 'The brand color to build tokens from; leave out with --tokens',
			type: t.string().optional()
		}
	],
	options: {
		to: { description: 'Output format', type: t.enum([...EXPORT_TARGETS]), default: 'css' },
		source: { description: 'What to build from the color', type: t.enum([...EXPORT_SOURCES]), default: 'palette' },
		mode: { description: 'light or dark, for --source palette', type: t.enum([...MODES]), default: 'light' },
		tokens: {
			description: 'A JSON file of CSS color strings, nested as you like, instead of a color',
			type: t.string().optional()
		},
		space: { description: 'Convert every color to this space (css, tailwind)', type: t.enum([...SPACES]).optional() },
		prefix: { description: 'Variable name prefix (css; tailwind uses --namespace)', type: t.string().optional() },
		selector: { description: 'The CSS rule selector (css)', type: t.string().optional() },
		namespace: { description: 'The Tailwind theme namespace (tailwind)', type: t.string().optional() },
		inline: { description: 'Write @theme inline (tailwind)', type: t.boolean().optional() },
		precision: { description: 'Decimal places in printed numbers', type: t.int({ min: 0, max: 10 }).optional() },
		hex: { description: 'Add the hex fallback to DTCG values; --hex=false drops it', type: t.boolean().optional() }
	},
	run(args) {
		if ((args.color === undefined) === (args.tokens === undefined))
			throw usage(
				'input-required',
				'give exactly one of a color or --tokens <file>',
				"Run `color-map export '#3b82f6' --to css`, or `color-map export --tokens tokens.json --to dtcg`"
			)
		try {
			const space = args.space as ColorSpaceId | undefined
			let tree: Parameters<typeof toDTCG>[0]
			if (args.tokens !== undefined) tree = readTokens(args.tokens) as typeof tree
			else {
				const color = readColor(args.color as string)
				tree =
					args.source === 'scale'
						? { primary: createScale({ seed: color }) }
						: semanticPalette({ brand: color, mode: args.mode })
			}
			if (args.to === 'dtcg') return document(`${JSON.stringify(toDTCG(tree, { hex: args.hex }), null, 2)}\n`)
			if (args.to === 'css')
				return document(
					toCssVariables(tree, { space, prefix: args.prefix, selector: args.selector, precision: args.precision })
				)
			return document(
				toTailwindTheme(tree, { space, namespace: args.namespace, inline: args.inline, precision: args.precision })
			)
		} catch (e) {
			if (isCliError(e)) throw e
			throw usage(
				'export-failed',
				(e as Error).message,
				'The tokens must be CSS color strings, color objects, or arrays and objects of them'
			)
		}
	}
})

/** Typed as the plain command so its declaration does not name args-minus' internals. */
export const exportCommand: cli.Command = definition
