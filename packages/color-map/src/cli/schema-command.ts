import { type cli, command, t } from 'clibuilder'
import { CliError, document, exitCodes, result } from 'clibuilder/axi'
import { type SchemaSource, schemaOf } from './schemas.js'

/** The `schema` command, bound to the commands it describes. */
export function schemaCommand(sources: readonly SchemaSource[]): cli.Command {
	const definition = command({
		name: 'schema',
		description: "Print the JSON Schema of a command's arguments and options",
		arguments: [
			{ name: 'command', description: 'The command to describe; leave out to list them', type: t.string().optional() }
		],
		run(args) {
			if (args.command === undefined)
				return result(
					{ commands: sources.map((s) => s.name) },
					{ help: 'Run `color-map schema <command>` for one schema' }
				)
			const source = sources.find((s) => s.name === args.command)
			if (!source)
				throw new CliError(`no command named "${args.command}"`, {
					code: 'unknown-command',
					exitCode: exitCodes.usage,
					details: { command: args.command },
					help: 'Run `color-map schema` to list the commands'
				})
			return document(`${JSON.stringify(schemaOf(source), null, 2)}\n`)
		}
	})
	return definition
}
