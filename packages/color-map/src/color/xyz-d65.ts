import type { Space } from './types.js'

/** The hub every other space converts through. */
export const xyzD65: Space = {
	id: 'xyz-d65',
	toXyz: (c) => c,
	fromXyz: (xyz) => xyz
}
