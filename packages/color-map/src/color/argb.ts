import type { Color } from './types.js'

const byte = (n: number): number => Math.min(255, Math.max(0, Math.round(n * 255)))

/** An sRGB color from a 32-bit ARGB integer, as Material Color Utilities uses. */
export function fromArgb(argb: number): Color {
	const n = argb >>> 0
	return {
		colorSpace: 'srgb',
		components: [((n >>> 16) & 255) / 255, ((n >>> 8) & 255) / 255, (n & 255) / 255],
		alpha: (n >>> 24) / 255
	}
}

/** The unsigned 32-bit ARGB integer for an sRGB color. Convert other spaces to `srgb` first. */
export function toArgb(color: Color): number {
	if (color.colorSpace !== 'srgb') throw new Error(`color-map: toArgb needs an srgb color, got "${color.colorSpace}"`)
	const [r, g, b] = color.components
	const a = color.alpha ?? 1
	return ((byte(a) << 24) | (byte(r ?? 0) << 16) | (byte(g ?? 0) << 8) | byte(b ?? 0)) >>> 0
}
