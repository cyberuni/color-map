// @ts-check
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
	site: 'https://cyberuni.github.io',
	base: '/color-map/',
	// Astro 7's native Markdown processor applies GitHub-Flavored Markdown by default for both `.md`
	// and `.mdx`, so pipe tables render the same in every page without an explicit remark-gfm plugin.
	// (The old `markdown.remarkPlugins: [remarkGfm]` workaround is deprecated in v7 and no longer needed.)
	vite: {
		plugins: [tailwindcss()]
	},
	integrations: [
		starlight({
			title: 'color-map',
			description:
				'Parse, convert, mix and serialize every CSS color, and build design-system palettes from one brand color.',
			// The cyber-* family mark: a shared command reticle around a per-package glyph
			// (see docs/design/icon-system.md).
			//
			// The favicon self-themes: browser chrome follows the OS, so that one file
			// flips its own fill under `prefers-color-scheme` and needs no pair.
			//
			// The header logo cannot. Starlight switches on `data-theme`, which this site
			// defaults to dark independent of the OS — a single self-theming file renders
			// black on the dark header whenever the visitor's OS is set to light. So the
			// header ships as a pair and lets Starlight pick.
			favicon: '/img/logo.svg',
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				alt: 'color-map'
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/cyberuni/color-map'
				}
			],
			customCss: ['./src/styles/global.css', './src/styles/demo.css'],
			sidebar: [
				{ label: 'Introduction', slug: 'index' },
				{
					label: 'Demos',
					items: [
						{ label: 'Color converter', slug: 'converter' },
						{ label: 'Mix and relative color', slug: 'mix' },
						{ label: 'Palette builder', slug: 'palette' }
					]
				}
			]
		})
	]
})
