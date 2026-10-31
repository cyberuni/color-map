import { signed } from './math.js'

export const identity = (n: number): number => n

export const srgbToLinear = signed((a) => (a <= 0.04045 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4))
export const srgbToGamma = signed((a) => (a > 0.0031308 ? 1.055 * a ** (1 / 2.4) - 0.055 : 12.92 * a))

export const power = (gamma: number): [(n: number) => number, (n: number) => number] => [
	signed((a) => a ** gamma),
	signed((a) => a ** (1 / gamma))
]

export const prophotoToLinear = signed((a) => (a <= 16 / 512 ? a / 16 : a ** 1.8))
export const prophotoToGamma = signed((a) => (a >= 1 / 512 ? a ** (1 / 1.8) : 16 * a))
