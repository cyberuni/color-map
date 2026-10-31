import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { commands } from './cli.js'
import { schemaOf } from './schemas.js'

// `pnpm build` writes schemas/; a stale file means the options changed without a rebuild.
test.each(commands.map((c) => c.name))('schemas/%s.schema.json matches the command', (name) => {
	const command = commands.find((c) => c.name === name)
	const onDisk = JSON.parse(readFileSync(new URL(`../../schemas/${name}.schema.json`, import.meta.url), 'utf8'))
	expect(onDisk).toEqual(JSON.parse(JSON.stringify(schemaOf(command as (typeof commands)[number]))))
})
