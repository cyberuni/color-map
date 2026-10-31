import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		// `test` and `expect` stay global, as they were under jest, so the specs
		// need no per-file imports.
		globals: true,
		environment: 'node',
		include: ['src/**/*.spec.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			// bin.ts is the process entry point and testing.ts is a spec helper.
			exclude: ['src/**/*.spec.ts', 'src/cli/bin.ts', 'src/cli/testing.ts'],
			reporter: ['text', 'lcov'],
			// This package has been at 100% for its whole life. Pin it so a drop
			// fails the build instead of quietly showing up in a coverage report.
			thresholds: {
				branches: 100,
				functions: 100,
				lines: 100,
				statements: 100
			}
		}
	}
})
