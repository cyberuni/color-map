import { rgbHex } from './index.js'

test('[0,0,0] => #000000', () => {
  expect(rgbHex([0, 0, 0])).toBe('#000000')
})

test('[255,128,16] => #ff8010', () => {
  expect(rgbHex([255, 128, 16])).toBe('#ff8010')
})

test('[255,128,16,0] => #ff8010', () => {
  expect(rgbHex([255, 128, 16, 0])).toBe('#ff8010')
})

test('[255,128,16,0.8] => #ff8010', () => {
  expect(rgbHex([255, 128, 16, 0.8])).toBe('#ff8010')
})
