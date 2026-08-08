import type { RGB, RGBA } from './interfaces.js'

/**
 * Convert `RGB` to `#rgb`
 * JavaScript note: no check for array length, use it properly.
 */
export function rgbHex(rgb: RGB | RGBA) {
  let hex = '#'
  for (let i = 0; i < 3; i++) {
    hex += d2h(rgb[i])
  }
  return hex
}

function d2h(d: number) {
  const s = (+d).toString(16)
  return s.length < 2 ? '0' + s : s
}
