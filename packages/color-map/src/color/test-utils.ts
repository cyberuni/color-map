/** Packs 0 to 1 channels into a rounded `rrggbb` string, for comparing colors across libraries. */
export function hexOf(rgb: number[]): string {
	return rgb
		.map((v) =>
			Math.round(v * 255)
				.toString(16)
				.padStart(2, '0')
		)
		.join('')
}
