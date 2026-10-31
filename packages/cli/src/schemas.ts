/** The introspection data of a clibuilder `t` descriptor, as far as the schema needs it. */
interface Data {
	kind: string
	min?: number
	max?: number
	values?: readonly string[]
	element?: Data
}

/** The slice of a clibuilder command that a schema is read from. */
export interface SchemaSource {
	name: string
	description?: string | undefined
	arguments?:
		| readonly { name: string; description?: string | undefined; type?: { [k: string]: any } | undefined }[]
		| undefined
	options?: Record<
		string,
		{ description?: string | undefined; type?: { [k: string]: any } | undefined; default?: unknown } | undefined
	>
}

type Json = Record<string, unknown>

function ofType(data: Data): Json {
	switch (data.kind) {
		case 'string':
			return { type: 'string' }
		case 'number':
		case 'int': {
			const { min, max } = data
			return {
				type: data.kind === 'int' ? 'integer' : 'number',
				...(min === undefined ? {} : { minimum: min }),
				...(max === undefined ? {} : { maximum: max })
			}
		}
		case 'boolean':
			return { type: 'boolean' }
		case 'enum':
			return { type: 'string', enum: [...(data.values as readonly string[])] }
		case 'array':
			return { type: 'array', items: ofType(data.element as Data) }
		default:
			// literal, custom and json are not used by this CLI's options
			return {}
	}
}

function property(entry: NonNullable<SchemaSource['options']>[string], extra: Json = {}): Json {
	const { description, type, default: value } = entry ?? {}
	return {
		...ofType((type ?? { kind: 'string' }) as Data),
		...(description === undefined ? {} : { description }),
		...(value === undefined ? {} : { default: value }),
		...extra
	}
}

/**
 * The JSON Schema (2020-12) of one command's arguments and options, read from
 * the same descriptors the parser uses, so the two cannot drift. An argument
 * or option with no default that is not optional is `required`.
 */
export function schemaOf(command: SchemaSource): Json {
	const properties: Record<string, Json> = {}
	const required: string[] = []
	for (const arg of command.arguments ?? []) {
		properties[arg.name] = property(arg, { 'x-kind': 'argument' })
		if (!arg.type?.isOptional) required.push(arg.name)
	}
	for (const [name, option] of Object.entries(command.options ?? {})) {
		properties[name] = property(option, { 'x-kind': 'option' })
		if (option && !option.type?.isOptional && option.default === undefined) required.push(name)
	}
	return {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		$id: `https://unpkg.com/color-map-cli/schemas/${command.name}.schema.json`,
		title: `color-map ${command.name}`,
		...(command.description === undefined ? {} : { description: command.description }),
		type: 'object',
		properties,
		required,
		additionalProperties: false
	}
}
