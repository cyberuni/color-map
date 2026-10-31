import { type cli as CliNamespace, cli } from 'clibuilder'
import { homeHeader, result } from 'clibuilder/axi'
import { contrast } from './commands/contrast.js'
import { convert } from './commands/convert.js'
import { exportCommand } from './commands/export.js'
import { findContrastCommand } from './commands/find-contrast.js'
import { harmony } from './commands/harmony.js'
import { mix } from './commands/mix.js'
import { palette } from './commands/palette.js'
import { scale } from './commands/scale.js'
import { schemaCommand } from './schema-command.js'

export const commands = [convert, mix, contrast, findContrastCommand, scale, palette, harmony, exportCommand] as const

const description = 'Color tools for agents: convert, mix, contrast, scale, palette and export'

/** The color-map CLI. Pass `streams` to capture its output. */
export function createApp(options: Pick<CliNamespace.Options, 'streams' | 'version'>) {
	let app = cli({ name: 'color-map', description, version: options.version, streams: options.streams }).default({
		description,
		run() {
			return result(
				{
					...homeHeader({ description }),
					commands: [...commands.map((c) => c.name), 'schema'],
					defaults: 'WCAG 2 contrast, sRGB gamut, TOON output (--format json for JSON)'
				},
				{
					help: [
						"Run `color-map palette '#3b82f6'` for a semantic palette with every contrast pair checked",
						"Run `color-map scale '#3b82f6'` for an 11-step scale",
						'Run `color-map <command> --help` for one command'
					]
				}
			)
		}
	})
	for (const c of commands) app = app.command(c)
	return app.command(schemaCommand(commands))
}
