import type { Vec3 } from './types.js'

/** A 3x3 matrix, flat, row by row. */
export type Matrix = readonly [number, number, number, number, number, number, number, number, number]

/** `m` times the column vector (x, y, z). Takes numbers rather than a Vec3, so callers need no array. */
export function multiply(m: Matrix, x: number, y: number, z: number): Vec3 {
	return [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z]
}

/** Keeps the sign, so out-of-gamut values survive the transfer function. */
export function signed(f: (abs: number) => number): (n: number) => number {
	return (n) => (n < 0 ? -f(-n) : f(n))
}

export function normalizeHue(h: number): number {
	return ((h % 360) + 360) % 360
}

export const D50: Vec3 = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585]
