import type { RGBA } from './interfaces.js'

export function rgbaString(rgba: RGBA) {
  return 'rgba(' + rgba.join(',') + ')';
}
