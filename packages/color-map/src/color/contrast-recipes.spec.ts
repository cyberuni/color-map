/**
 * Recipes for contrast measures beyond WCAG 2. They run in CI so they do not
 * go stale. They use colorjs.io's own MIT-licensed APCA, not apca-w3.
 */
import Colorjs from 'colorjs.io'
import { type Color, type ContrastFn, contrast, findContrast, meets, onColor } from './index.js'

const toColorjs = (c: Color) =>
	new Colorjs(c.colorSpace === 'srgb' ? 'srgb' : c.colorSpace, c.components as [number, number, number])

// Recipe: APCA as a ContrastFn. Signed Lc, text on background.
const apca: ContrastFn = Object.assign((fg: Color, bg: Color) => toColorjs(bg).contrast(toColorjs(fg), 'APCA'), {
	algorithm: 'apca',
	thresholds: { body: 75, large: 60, 'non-text': 45 },
	polarity: 'signed'
} as const)

describe('APCA recipe', () => {
	test('contrast and meets', () => {
		expect(Math.abs(contrast('black', 'white', apca))).toBeGreaterThan(100)
		expect(meets('black', 'white', 'body', apca)).toBe(true)
		expect(meets('#aaa', 'white', 'body', apca)).toBe(false)
	})

	test('findContrast and onColor', () => {
		const r = findContrast('white', 75, { contrast: apca })
		expect(r.met).toBe(true)
		expect(Math.abs(r.contrast)).toBeGreaterThanOrEqual(75)
		const text = onColor('#ffe066', { contrast: apca, target: 75 })
		expect(Math.abs(contrast(text, '#ffe066', apca))).toBeGreaterThanOrEqual(75)
	})
})
