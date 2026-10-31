// Checks what `npm publish` would ship: the tarball stays under a size cap, the
// bin and the agent files are in it, and the package still has no runtime
// dependencies (the CLI bundles its own, from devDependencies).
//
// Measured at the fold of the CLI into this package: 248 kB packed, 869 kB unpacked.
// The caps leave about 20% headroom; raise them on purpose, not by accident.
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const CAP_PACKED = 300_000
const CAP_UNPACKED = 1_050_000
const REQUIRED = [
	'bin/color-map.js',
	'plugin.json',
	'skills/color-map/SKILL.md',
	'llms.txt',
	'schemas/palette.schema.json'
]

const out = JSON.parse(execSync('npm pack --dry-run --json', { stdio: ['ignore', 'pipe', 'ignore'] }))
const info = Array.isArray(out) ? out[0] : Object.values(out)[0]
const paths = new Set(info.files.map((f) => f.path))
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

const problems = []
if (info.size > CAP_PACKED) problems.push(`packed size ${info.size} B is over the ${CAP_PACKED} B cap`)
if (info.unpackedSize > CAP_UNPACKED)
	problems.push(`unpacked size ${info.unpackedSize} B is over the ${CAP_UNPACKED} B cap`)
for (const p of REQUIRED) if (!paths.has(p)) problems.push(`${p} is missing from the tarball`)
if (Object.keys(pkg.dependencies ?? {}).length > 0)
	problems.push('"dependencies" must stay empty: bundle it into the bin instead')

process.stdout.write(
	`pack: ${info.size} B packed (cap ${CAP_PACKED}), ${info.unpackedSize} B unpacked (cap ${CAP_UNPACKED}), ${info.entryCount} files\n`
)
if (problems.length > 0) {
	for (const p of problems) console.error(`pack: ${p}`)
	process.exit(1)
}
