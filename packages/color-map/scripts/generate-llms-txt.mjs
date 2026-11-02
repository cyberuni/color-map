// Generates llms.txt from the package's public surface, so it cannot describe an
// export or a command that no longer exists:
//   - the library entry points come from `exports` in package.json, and each one's
//     exports are read from its source through the TypeScript compiler API;
//   - the commands come from the built CLI's command table.
//
//   node scripts/generate-llms-txt.mjs           write llms.txt
//   node scripts/generate-llms-txt.mjs --check   exit 1 when llms.txt on disk differs
//   node scripts/generate-llms-txt.mjs --gaps    print the exports with no doc comment, as markdown
//
// TypeScript 7 exposes only `version` to JS, so the compiler API comes from the
// `ts-6.0` alias.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import ts from 'ts-6.0'
import { commands, schemaCommand } from '../bin/index.js'

const root = new URL('../', import.meta.url)
const file = new URL('llms.txt', root)
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))

const site = 'https://cyberuni.github.io/color-map'
const docsDir = new URL('../../apps/website/src/content/docs/', root)
const schemaBase = 'https://unpkg.com/color-map/schemas'
const generator = 'https://github.com/cyberuni/color-map/blob/main/packages/color-map/scripts/generate-llms-txt.mjs'

// Every key of `exports` must be listed here. A new subpath that is missing fails
// the generation, so it cannot silently stay out of llms.txt. `page` is the docs
// page and the heading on it; `null` would mean "exported, documented nowhere".
const surface = {
	'./color': { page: 'library', heading: '`color-map/color`' },
	'./scale': { page: 'library', heading: '`color-map/scale`' },
	'./palette': { page: 'library', heading: '`color-map/palette`' },
	'./tokens': { page: 'library', heading: '`color-map/tokens`' },
	'./legacy': { page: 'library', heading: '`color-map/legacy`' },
	'.': { page: 'library' },
	// Not code: the schemas are linked from the Commands section, one per command.
	'./schemas/*': 'commands',
	'./package.json': 'metadata'
}

const exportKeys = Object.keys(pkg.exports)
for (const key of exportKeys) {
	if (!(key in surface)) throw new Error(`package.json exports "${key}", which generate-llms-txt.mjs does not map`)
}
for (const key of Object.keys(surface)) {
	if (!exportKeys.includes(key))
		throw new Error(`generate-llms-txt.mjs maps "${key}", which package.json no longer exports`)
}

// github-slugger, as Starlight uses it: lowercase, drop punctuation, spaces to dashes.
const slug = (heading) =>
	heading
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, '')
		.replace(/\s/g, '-')

function docsUrl({ page, heading }) {
	const mdx = readFileSync(new URL(`${page}.mdx`, docsDir), 'utf8')
	if (heading === undefined) return `${site}/${page}/`
	if (!mdx.split('\n').some((line) => /^#{2,6} /.test(line) && line.replace(/^#+ /, '') === heading))
		throw new Error(`docs page "${page}" has no heading ${heading}`)
	return `${site}/${page}/#${slug(heading)}`
}

// --- the library -----------------------------------------------------------

const entries = exportKeys
	.filter((key) => typeof surface[key] === 'object')
	.map((key) => {
		const types = pkg.exports[key].types
		const source = types.replace(/^\.\/esm\//, 'src/').replace(/\.d\.ts$/, '.ts')
		if (!existsSync(new URL(source, root))) throw new Error(`no source ${source} for exports "${key}"`)
		return {
			key,
			specifier: key === '.' ? pkg.name : `${pkg.name}/${key.slice(2)}`,
			source,
			url: docsUrl(surface[key])
		}
	})

const program = ts.createProgram(
	entries.map((e) => new URL(e.source, root).pathname),
	{ module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, strict: true, noEmit: true }
)
const checker = program.getTypeChecker()
const resolve = (symbol) => (symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol)
const isValue = (symbol) => (resolve(symbol).flags & ts.SymbolFlags.Value) !== 0
const docOf = (symbol) =>
	ts.displayPartsToString(resolve(symbol).getDocumentationComment(checker)).replace(/\s+/g, ' ').trim()
const isDocumented = (symbol) => docOf(symbol) !== '' || resolve(symbol).getJsDocTags(checker).length > 0
const isDeprecated = (symbol) =>
	resolve(symbol)
		.getJsDocTags(checker)
		.some((t) => t.name === 'deprecated')

for (const entry of entries) {
	const sourceFile = program.getSourceFile(new URL(entry.source, root).pathname)
	entry.exports = checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile))
}

const rootEntry = entries.find((e) => e.key === '.')
const subpaths = entries.filter((e) => e.key !== '.')
const subpathOf = new Map()
for (const entry of subpaths) for (const symbol of entry.exports) subpathOf.set(resolve(symbol), entry)
const rootOnly = rootEntry.exports.filter((s) => !subpathOf.has(resolve(s)))
const reexported = subpaths.filter((e) => rootEntry.exports.some((s) => subpathOf.get(resolve(s)) === e))

const names = (symbols) =>
	symbols
		.map((s) => s.name)
		.sort((a, b) => a.localeCompare(b))
		.map((n) => `\`${n}\``)
		.join(', ')
const list = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)

function entryLine(entry) {
	if (entry === rootEntry) {
		const deprecated = rootOnly.filter(isDeprecated)
		const other = rootOnly.filter((s) => !isDeprecated(s))
		return [
			`- [${entry.specifier}](${entry.url}): re-exports ${list(reexported.map((e) => `\`${e.specifier}\``))}`,
			other.length ? `, plus ${names(other)}` : '',
			deprecated.length
				? `. It also exports ${names(deprecated)}, deprecated: import them from \`${pkg.name}/legacy\``
				: '',
			'.'
		].join('')
	}
	const values = entry.exports.filter(isValue)
	const types = entry.exports.filter((s) => !isValue(s))
	return `- [${entry.specifier}](${entry.url}): ${names(values)}. Types: ${names(types)}.`
}

// The `Color` type, read from its declaration.
const colorEntry = subpaths.find((e) => e.exports.some((s) => s.name === 'Color'))
const colorSymbol = resolve(colorEntry.exports.find((s) => s.name === 'Color'))
const colorShape = checker
	.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(colorSymbol))
	.map((p) => `${p.name}${p.flags & ts.SymbolFlags.Optional ? '?' : ''}`)
	.join(', ')
const colorDoc = docOf(colorSymbol)
const componentSymbol = resolve(colorEntry.exports.find((s) => s.name === 'Component'))
const componentType = checker.typeToString(
	checker.getDeclaredTypeOfSymbol(componentSymbol),
	undefined,
	ts.TypeFormatFlags.InTypeAlias
)
const componentDoc = docOf(componentSymbol)

// The narrow forms: every `createX` beside an exported `x`. Each pair must hold the
// convention stated for it, or generation fails rather than state a false rule.
const valueType = (symbol) => checker.getTypeOfSymbol(resolve(symbol))
const firstParam = (type) => {
	const [signature] = type.getCallSignatures()
	return signature && checker.getTypeOfSymbol(signature.getParameters()[0])
}
const takesString = (type) => checker.isTypeAssignableTo(checker.getStringType(), type)
const narrowPairs = colorEntry.exports
	.filter((s) => /^create[A-Z]/.test(s.name))
	.map((narrow) => {
		const wideName = narrow.name[6].toLowerCase() + narrow.name.slice(7)
		return { narrow, wide: colorEntry.exports.find((s) => s.name === wideName) }
	})
	.filter((p) => p.wide)
for (const pair of narrowPairs) {
	const helper = valueType(pair.narrow).getCallSignatures()[0].getReturnType()
	if (takesString(firstParam(helper)))
		throw new Error(`the helper \`${pair.narrow.name}\` returns takes a CSS string; revise the narrow-forms convention`)
	pair.takesString = takesString(firstParam(valueType(pair.wide)))
}

const dependencies = Object.keys(pkg.dependencies ?? {})
// The spaces `convert` reaches: the members of `ColorSpaceId`.
const spaceCount = checker.getDeclaredTypeOfSymbol(resolve(colorEntry.exports.find((s) => s.name === 'ColorSpaceId')))
	.types.length

// --- the commands ----------------------------------------------------------

const optionNames = (c) => Object.keys(c.options ?? {}).map((o) => `--${o}`)
const argNames = (c) => (c.arguments ?? []).map((a) => (a.type?.isOptional ? `[${a.name}]` : `<${a.name}>`))
const usage = (c) =>
	`Usage: \`color-map ${[c.name, ...argNames(c)].join(' ')}\` with ${optionNames(c).join(', ') || 'no options'}.`
const commandLine = (c, url) => `- [${c.name}](${url}): ${c.description}. ${usage(c)}`
const schemaUrl = (c) => {
	if (!existsSync(new URL(`schemas/${c.name}.schema.json`, root))) throw new Error(`no schemas/${c.name}.schema.json`)
	return `${schemaBase}/${c.name}.schema.json`
}
const schema = schemaCommand(commands)

// --- the file --------------------------------------------------------------

const undocumented = [
	...subpaths.map((e) => ({ entry: e, symbols: e.exports.filter((s) => !isDocumented(s)) })),
	{ entry: rootEntry, symbols: rootOnly.filter((s) => !isDocumented(s)) }
].filter((g) => g.symbols.length)
const undocumentedCount = undocumented.reduce((n, g) => n + g.symbols.length, 0)

const lines = [
	`# ${pkg.name}`,
	'',
	'> Parse, convert, mix and serialize every CSS color, check WCAG 2 contrast, and build scales, semantic palettes and design tokens from one brand color. One package holds a TypeScript library, the `color-map` command and an agent skill.',
	'',
	'This file is generated by `scripts/generate-llms-txt.mjs` from the package exports and the command table. Do not edit it.',
	'',
	'Conventions that hold for the library:',
	'',
	`- ${dependencies.length ? `Runtime dependencies: ${list(dependencies)}` : 'No runtime dependencies'}${pkg.sideEffects === false ? ', and `"sideEffects": false`, so a bundler keeps only what you import' : ''}.`,
	`- \`${pkg.name}\` re-exports ${list(reexported.map((e) => `\`${e.specifier}\``))}. Without a bundler it loads every module, so import from a subpath to load less.`,
	`- \`Color\` is \`{ ${colorShape} }\`. ${colorDoc} \`Component\` is \`${componentType}\`. ${componentDoc}`,
	`- ${list(narrowPairs.map((p) => `\`${p.wide.name}\``))} each have a narrow form named \`create\` plus the name. It takes the spaces your colors are in and returns the helper over just those, so a bundle does not carry all ${spaceCount} spaces. \`createConverter\` does the same for \`convert\`.`,
	`- ${list(narrowPairs.filter((p) => p.takesString).map((p) => `\`${p.wide.name}\``))} also take a CSS color string; the other helpers above take a \`Color\`, so run strings through \`parse\` first. Every narrow form takes \`Color\` objects only.`,
	'',
	'Conventions that hold for every command:',
	'',
	'- Output is TOON on stdout by default; `--format json` gives JSON. Diagnostics go to stderr.',
	'- Colors are any CSS color string, including `color-mix()` and relative colors.',
	'- Contrast is WCAG 2. There is no other contrast algorithm.',
	'- `--full` adds every field. Empty results say so explicitly.',
	'- A failure exits 1 or 2 with `error`, `code` and `help` fields on stdout. Nothing prompts; unknown options fail.',
	'- Run it with `npx color-map <command>`, or install the `color-map` agent skill from this package.',
	'',
	'## Library',
	'',
	entryLine(rootEntry),
	...subpaths.map(entryLine),
	'',
	'## Commands',
	'',
	...commands.map((c) => commandLine(c, schemaUrl(c))),
	commandLine(schema, docsUrl({ page: 'cli', heading: 'Machine-readable help' })),
	'',
	'## Optional',
	'',
	'- [Source and README](https://github.com/cyberuni/color-map): the color-map library and CLI.',
	`- [Generator](${generator}): run it with \`--gaps\` to list the ${undocumentedCount} exports that have no doc comment.`,
	''
]
const text = lines.join('\n')

if (process.argv.includes('--gaps')) {
	const out = [`${undocumentedCount} exports have no doc comment.`, '']
	for (const { entry, symbols } of undocumented) {
		const label = entry === rootEntry ? `\`${entry.specifier}\` (root only)` : `\`${entry.specifier}\``
		out.push(`### ${label}: ${symbols.length}`, '')
		for (const s of [...symbols].sort((a, b) => a.name.localeCompare(b.name)))
			out.push(`- [ ] \`${s.name}\` (${isValue(s) ? 'value' : 'type'})`)
		out.push('')
	}
	process.stdout.write(`${out.join('\n')}\n`)
} else if (process.argv.includes('--check')) {
	let current = ''
	try {
		current = readFileSync(file, 'utf8')
	} catch {}
	if (current !== text) {
		console.error('packages/color-map/llms.txt is out of date: run `pnpm cm llms`')
		process.exit(1)
	}
} else writeFileSync(file, text)
