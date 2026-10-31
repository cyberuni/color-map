import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.spec.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.spec.ts', 'src/bin.ts', 'src/testing.ts'],
			reporter: ['text', 'lcov'],
			// Same bar as the library: a drop fails the build.
			thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 }
		}
	}
})
