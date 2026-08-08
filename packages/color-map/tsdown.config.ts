import { writeFile } from 'node:fs/promises'
import { defineConfig } from 'tsdown'

const entry = ['ts/index.ts']

// Three outputs, each pinned to the path it already publishes at, so replacing
// webpack/tsc with tsdown stays invisible to consumers:
//   esm/  — the ESM build plus the .d.ts that `types` points at
//   cjs/  — the CommonJS build, marked commonjs by its own package.json
//   dist/ — the browser bundle loaded by demo.html and via <script src>
export default defineConfig([
	{
		entry,
		format: 'esm',
		outDir: 'esm',
		outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
		dts: true,
		sourcemap: true,
		// Mirror the source tree rather than bundling, so the ESM output keeps the
		// per-module shape tsc used to emit and stays tree-shakeable downstream.
		unbundle: true
	},
	{
		entry,
		format: 'cjs',
		outDir: 'cjs',
		outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
		dts: true,
		sourcemap: true,
		hooks: {
			// The package root is `"type": "module"`, so cjs/index.js is only read as
			// CommonJS because of this marker. tsdown's `copy` treats `to` as a
			// directory, which is why this is written rather than copied.
			'build:done': () => writeFile('cjs/package.json', '{ "type": "commonjs" }\n')
		}
	},
	{
		// Named entry plus an explicit entryFileNames: tsdown would otherwise infix
		// the format and emit color-map.iife.es5.js, moving a published path.
		entry: { 'color-map': 'ts/index.ts' },
		format: 'iife',
		globalName: 'ColorMap',
		outDir: 'dist',
		outputOptions: { entryFileNames: '[name].es5.js' },
		target: 'es2015',
		minify: true,
		sourcemap: true
	}
])
