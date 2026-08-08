import type { RGB, RGBA, Alpha } from './interfaces.js'

export function createColors(
  from: RGB | RGBA,
  to: RGB | RGBA,
  shades: number,
  alpha: Alpha = [
    from.length === 4 ? from[3] : to.length === 4 ? to[3] : 1,
    to.length === 4 ? to[3] : from.length === 4 ? from[3] : 1
  ]): RGBA[] {
  const start = [...from]
  const diff = [
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2],
    alpha[1] - alpha[0]
  ]

  if (start.length === 3)
    start.push(alpha[0])

  const inc = 1 / Math.max(shades - 1, 1)

  const rgba: any[] = []
  for (let i = 0; i < shades; i++) {
    const color = [
      Math.round(start[0] + i * diff[0] * inc),
      Math.round(start[1] + i * diff[1] * inc),
      Math.round(start[2] + i * diff[2] * inc),
      start[3] + i * diff[3] * inc
    ]
    rgba.push(color)
  }
  return rgba
}
