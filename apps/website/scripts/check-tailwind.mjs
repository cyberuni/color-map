// Compiles toTailwindTheme's output with Tailwind v4 and checks that the generated
// utilities carry the exported colors. Runs before `astro build`, so a theme block
// Tailwind rejects or ignores fails the site build.

import { semanticPalette } from 'color-map/palette'
import { createScale } from 'color-map/scale'
import { toTailwindTheme } from 'color-map/tokens'
import { compile } from 'tailwindcss'

const scale = createScale({ seed: '#3b82f6' })
const palette = semanticPalette({ brand: '#3b82f6' })

for (const [name, theme, candidates, expected] of [
	['scale', toTailwindTheme({ brand: scale }), ['bg-brand-500', 'text-brand-50', 'border-brand-950'], 3],
	['scale inline', toTailwindTheme({ brand: scale }, { inline: true }), ['bg-brand-500'], 1],
	['palette', toTailwindTheme(palette), ['bg-primary-5', 'text-roles-primary-fg', 'bg-roles-surface-bg'], 3]
]) {
	const { build } = await compile(`${theme}\n@tailwind utilities;`)
	const css = build(candidates)
	const rules = css.match(/\.[\w-]+\s*\{/g) ?? []
	if (rules.length !== expected) {
		process.stderr.write(
			`tailwind check "${name}": expected ${expected} utilities, got ${rules.length}\n${theme}\n${css}` + '\n'
		)
		process.exit(1)
	}
	if (!/oklch\(/.test(css)) {
		process.stderr.write(`tailwind check "${name}": no oklch color in the output\n${css}` + '\n')
		process.exit(1)
	}
}
process.stdout.write('tailwind check: toTailwindTheme output compiles under Tailwind v4' + '\n')
