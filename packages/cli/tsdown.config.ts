import { defineConfig } from 'tsdown'

// Mirrors the library's ESM build: one file per module, so `esm/bin.js` stays a
// thin entry and the command modules keep their shape. The CLI is ESM only.
export default defineConfig({
	entry: ['src/index.ts', 'src/bin.ts', 'src/schemas.ts'],
	format: 'esm',
	outDir: 'esm',
	outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
	dts: true,
	sourcemap: true,
	unbundle: true
})
