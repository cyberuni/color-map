// Writes one JSON Schema per command to schemas/, from the built CLI.
import { mkdirSync, writeFileSync } from 'node:fs'
import { commands, schemaOf } from '../bin/index.js'

mkdirSync(new URL('../schemas/', import.meta.url), { recursive: true })
for (const command of commands) {
	writeFileSync(
		new URL(`../schemas/${command.name}.schema.json`, import.meta.url),
		`${JSON.stringify(schemaOf(command), null, '\t')}\n`
	)
}
