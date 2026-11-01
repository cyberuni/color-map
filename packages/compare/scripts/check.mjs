// Reports whether the Compare page's data is stale. Read-only: it changes nothing.
//
//   pnpm --filter color-map-compare check
//
// Exits 1 when something is stale. Reasons it looks for:
//   - a competitor has a newer release on npm than the version pinned in package.json
//   - color-map's version differs from the one in compare.json
//   - color-map's source changed after the commit that last touched compare.json
// Then run the update-compare skill (.agents/skills/update-compare/SKILL.md).
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = resolve(pkgDir, '../..')
const dataFile = 'apps/website/src/data/compare.json'
const data = JSON.parse(readFileSync(resolve(root, dataFile), 'utf8'))
const pkg = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8'))
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, encoding: 'utf8' }).trim()

const stale = []

for (const [name, range] of Object.entries(pkg.devDependencies)) {
	if (!(name in data.versions) || range.startsWith('workspace:')) continue
	const latest = run('npm', ['view', name, 'version'])
	if (latest !== range) stale.push(`${name}: pinned ${range}, latest ${latest}`)
	if (data.versions[name] !== range) stale.push(`${name}: data has ${data.versions[name]}, pinned ${range}`)
}

const cmVersion = JSON.parse(readFileSync(resolve(root, 'packages/color-map/package.json'), 'utf8')).version
if (data.versions['color-map'] !== cmVersion) {
	stale.push(`color-map: data has ${data.versions['color-map']}, package is ${cmVersion}`)
}

const last = run('git', ['log', '-1', '--format=%H', '--', dataFile])
const changed = run('git', ['log', '--oneline', `${last}..HEAD`, '--', 'packages/color-map/src'])
if (changed) stale.push(`color-map source changed since the data was committed:\n  ${changed.split('\n').join('\n  ')}`)

if (stale.length === 0) {
	console.error(`compare data (${data.generatedAt}) is current.`)
} else {
	console.error(`compare data (${data.generatedAt}) is stale:\n- ${stale.join('\n- ')}`)
	process.exitCode = 1
}
