import { createRequire } from 'node:module'

const req = createRequire(process.argv[2] + '/')
const cm = await import(req.resolve('culori'))
const culori = cm.parse ? cm : cm.default
const jm = await import(req.resolve('colorjs.io'))
const Color = typeof jm.default === 'function' ? jm.default : jm.default.default
const inputs = [
	'oklch(70% 0.15 200)',
	'oklch(70% none 200)',
	'color(display-p3 1 0 0)',
	'color(rec2020 1 0 0)',
	'hwb(200 10% 20%)',
	'lab(50 40 -20 / 50%)',
	'color-mix(in oklch, red 40%, blue)',
	'oklch(from red l c calc(h + 180))',
	'rgb(from #f00 r g b / 50%)',
	'light-dark(white, black)',
	'contrast-color(red)',
	'rebeccapurple',
	'transparent',
	'currentcolor',
	'Canvas',
	'rgb(255 0 0 / 0.5)',
	'rgba(255,0,0,.5)',
	'hsl(120deg 100% 50%)',
	'hsl(0.5turn 100% 50%)'
]
for (const s of inputs) {
	let a, b
	try {
		const p = culori.parse(s)
		a = p ? JSON.stringify(p) : 'undefined'
	} catch (e) {
		a = 'THROW ' + e.message
	}
	try {
		const c = new Color(s)
		b = c.toString()
	} catch (e) {
		b = 'THROW ' + e.message.slice(0, 60)
	}
	console.log(s.padEnd(36), '| culori:', a.slice(0, 70), '| colorjs:', b.slice(0, 60))
}
// gamut mapping behaviour
const p3red = new Color('color(display-p3 1 0 0)')
console.log(
	'colorjs toGamut srgb default:',
	p3red.clone().toGamut({ space: 'srgb' }).toString(),
	' css method:',
	p3red.clone().toGamut({ space: 'srgb', method: 'css' }).toString()
)
console.log(
	'culori toGamut rgb:',
	culori.formatRgb(culori.toGamut('rgb')(culori.parse('color(display-p3 1 0 0)'))),
	' clamp:',
	culori.formatRgb(culori.clampRgb(culori.parse('color(display-p3 1 0 0)')))
)
console.log(
	'culori modes:',
	Object.keys(culori)
		.filter((k) => k.startsWith('mode'))
		.join(',')
)
console.log('colorjs spaces:', Object.keys(Color.spaces).join(','))
console.log('colorjs gamut methods default:', Color.defaults.gamut_mapping)
