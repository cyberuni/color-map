import { rgbaString } from './index.js'

test('[255,128,16,0] => rgba(255,128,16,0)', () => {
  expect(rgbaString([255, 128, 16, 0])).toBe('rgba(255,128,16,0)')
})

test('[255,128,16,0.3] => rgba(255,128,16,0.3)', () => {
  expect(rgbaString([255, 128, 16, 0.3])).toBe('rgba(255,128,16,0.3)')
})
