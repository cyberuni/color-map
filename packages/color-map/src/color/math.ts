import type { Vec3 } from './types.js'

export type Matrix = readonly [Vec3, Vec3, Vec3]

export function multiply(m: Matrix, v: Vec3): Vec3 {
	return [
		m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
		m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
		m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]
	]
}

export function map3(v: Vec3, f: (n: number) => number): Vec3 {
	return [f(v[0]), f(v[1]), f(v[2])]
}

/** Keeps the sign, so out-of-gamut values survive the transfer function. */
export function signed(f: (abs: number) => number): (n: number) => number {
	return (n) => (n < 0 ? -f(-n) : f(n))
}

export function toRad(deg: number): number {
	return (deg * Math.PI) / 180
}

export function toDeg(rad: number): number {
	return (rad * 180) / Math.PI
}

export function normalizeHue(h: number): number {
	return ((h % 360) + 360) % 360
}

export const D50: Vec3 = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585]
