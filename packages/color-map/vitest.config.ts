import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		// `test` and `expect` stay global, as they were under jest, so the specs
		// need no per-file imports.
		globals: true,
		environment: 'node',
		include: ['ts/**/*.spec.ts'],
		coverage: {
			provider: 'v8',
			include: ['ts/**/*.ts'],
			exclude: ['ts/**/*.spec.ts'],
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
