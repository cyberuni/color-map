// Serves the package's llms.txt at /color-map/llms.txt. It is read from the
// installed package, not copied, so the site and the package cannot disagree.
// packages/color-map/scripts/generate-llms-txt.mjs writes it.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export function GET() {
	const file = new URL('llms.txt', `file://${require.resolve('color-map/package.json')}`)
	return new Response(readFileSync(file, 'utf8'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
