// Stamps the package version into the plugin manifests, so the plugin version
// follows the package version. Run by the root `version` script after
// `changeset version`; `--check` fails when a manifest is behind.
import { readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const { version } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
const manifests = [
	'plugin.json',
	'.claude-plugin/plugin.json',
	'.codex-plugin/plugin.json',
	'.cursor-plugin/plugin.json'
]
const check = process.argv.includes('--check')
let behind = false

for (const name of manifests) {
	const file = new URL(name, root)
	const text = readFileSync(file, 'utf8')
	const next = text.replace(/("version":\s*")[^"]*(")/, `$1${version}$2`)
	if (next === text) continue
	if (check) {
		console.error(`${name} is not at ${version}: run \`pnpm version\` at the repo root`)
		behind = true
	} else writeFileSync(file, next)
}
if (behind) process.exit(1)
