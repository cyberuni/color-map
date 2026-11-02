import { parse, parseGeneric } from './parse.js'

/**
 * `parse` takes a char-code scanner for the plain forms and leaves the rest to
 * the regex parser. This fuzzes generated valid and invalid strings, and
 * requires the same color or the same error message as the regex parser alone.
 */
const generic = (input: string) => parseGeneric(input, input.trim().toLowerCase())

let seed = 2024
const rand = () => {
	seed = (seed * 1664525 + 1013904223) >>> 0
	return seed / 2 ** 32
}
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]

const NAMES = [
	'rgb',
	'rgba',
	'hsl',
	'hsla',
	'hwb',
	'lab',
	'lch',
	'oklab',
	'oklch',
	'color',
	'RGB',
	'Oklch',
	'foo',
	'rg'
]
const SPACE_IDS = [
	'srgb',
	'display-p3',
	'a98-rgb',
	'prophoto-rgb',
	'rec2020',
	'xyz',
	'xyz-d50',
	'xyz-d65',
	'srgb-linear',
	'bogus'
]
const NUMBERS = [
	'0',
	'1',
	'255',
	'128',
	'0.5',
	'.5',
	'5.',
	'+1',
	'-1',
	'-0.25',
	'1e2',
	'1E2',
	'1e-2',
	'+.5e1',
	'5.e1',
	'300',
	'1e999'
]
const SUFFIXES = ['', '', '', '%', '%', 'deg', 'grad', 'rad', 'turn', 'px', 'e', '%%', 'DEG']
const WORDS = ['none', 'NONE', 'abc', '', '.', '+', '-', 'e1', '1e', '1e+', '1..2', '1 2', '#fff']
const GAPS = [' ', ' ', ' ', '  ', '\t', '\n', ' ', '\v']
const JOIN = [',', ', ', ' , ', ',', ',  ']
const ALPHABET = '0123456789abcdef.,/%+-() #eNoneg\t İ'

const token = (): string => (rand() < 0.12 ? pick(WORDS) : pick(NUMBERS) + pick(SUFFIXES))

function functional(): string {
	const name = pick(NAMES)
	const count = rand() < 0.8 ? 3 : Math.floor(rand() * 6)
	const parts = Array.from({ length: count }, token)
	if (name.toLowerCase() === 'color' && rand() < 0.85) parts.unshift(pick(SPACE_IDS))
	const comma = rand() < 0.35
	let body = parts.join(comma ? pick(JOIN) : pick(GAPS))
	if (rand() < 0.4) body += (comma ? pick(JOIN) : pick([' / ', '/', ' /', '/ ', ' / '])) + token()
	if (rand() < 0.05) body += ` / ${token()} / ${token()}`
	if (rand() < 0.2) body = pick(GAPS) + body
	if (rand() < 0.2) body += pick(GAPS)
	const open = rand() < 0.95 ? '(' : ' ('
	const close = rand() < 0.95 ? ')' : ''
	return name + open + body + close
}

const plain = (): string => pick(NUMBERS) + pick(['', '', '%'])
const angle = (): string => pick(NUMBERS) + pick(['', 'deg', 'grad', 'rad', 'turn'])
const maybeNone = (t: string): string => (rand() < 0.1 ? pick(['none', 'NONE']) : t)

/** Well-formed in the grammar, though a value may still be refused. */
function wellFormed(): string {
	const name = pick(['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'])
	const polar = name === 'hsl' || name === 'hsla' || name === 'hwb' || name === 'lch' || name === 'oklch'
	const hueAt = name === 'lch' || name === 'oklch' ? 2 : 0
	const parts: string[] = [0, 1, 2].map((i) => maybeNone(polar && i === hueAt ? angle() : plain()))
	if (name === 'color') parts.unshift(pick(SPACE_IDS.slice(0, 9)))
	const legacy = (name === 'rgb' || name === 'rgba' || name === 'hsl' || name === 'hsla') && rand() < 0.4
	const alpha = rand() < 0.4 ? maybeNone(pick(['0', '1', '0.5', '50%', '.25', '2', '-1'])) : undefined
	const gap = pick(GAPS.slice(0, 5))
	let body: string
	if (legacy) {
		body = parts.join(pick(JOIN)) + (alpha === undefined ? '' : pick(JOIN) + alpha)
	} else {
		body = parts.join(gap) + (alpha === undefined ? '' : pick([' / ', '/', ' /', '/ ']) + alpha)
	}
	if (rand() < 0.2) body = ` ${body} `
	return `${name}(${body})`
}

function hex(): string {
	const length = pick([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
	let digits = ''
	for (let i = 0; i < length; i++)
		digits += rand() < 0.03 ? pick(['g', 'G', 'z', ' ', '#']) : pick([...'0123456789abcdefABCDEF'])
	return `#${digits}`
}

function mutate(s: string): string {
	let out = s
	for (let n = Math.floor(rand() * 3); n > 0; n--) {
		const at = Math.floor(rand() * (out.length + 1))
		const op = rand()
		if (op < 0.4) out = out.slice(0, at) + pick([...ALPHABET]) + out.slice(at)
		else if (op < 0.7) out = out.slice(0, at) + out.slice(at + 1)
		else out = out.slice(0, at) + pick([...ALPHABET]) + out.slice(at + 1)
	}
	return out
}

const outcome = (f: (s: string) => unknown, input: string) => {
	try {
		return { color: f(input) }
	} catch (error) {
		return { error: (error as Error).message }
	}
}

const generate = (): string => {
	const base =
		rand() < 0.25
			? hex()
			: rand() < 0.03
				? pick(['red', 'transparent', 'currentcolor', '', '   ', 'rgb', '()'])
				: rand() < 0.5
					? wellFormed()
					: functional()
	const padded = rand() < 0.1 ? ` ${base} ` : base
	return rand() < 0.3 ? mutate(padded) : padded
}

describe('the scanner against the regex parser', () => {
	test('20000 generated strings give the same color or the same error', () => {
		let accepted = 0
		for (let i = 0; i < 20000; i++) {
			const input = generate()
			const got = outcome(parse, input)
			const want = outcome(generic, input)
			if ('color' in want) accepted++
			expect({ input, ...got }).toEqual({ input, ...want })
		}
		// The fuzz reaches both sides of the grammar.
		expect(accepted).toBeGreaterThan(3000)
		expect(accepted).toBeLessThan(18000)
	})

	test.each([
		'#fff',
		'#FFF8',
		'#336699',
		'#33669980',
		'rgb(255 0 0)',
		'rgb( 255   0 0 / 50% )',
		'rgba(255, 0, 0, 0.5)',
		'rgb(100%, 50%, 0%)',
		'hsl(120, 100%, 50%)',
		'hsla(0.5turn, 50%, 50%, 0.3)',
		'hwb(120 10% 20%)',
		'lab(50% 40 59.5)',
		'oklch(70% 0.1 200deg / 0.5)',
		'oklch(none none none)',
		'color(display-p3 1 0.5 0 / none)',
		'color(xyz 0.1 0.2 0.3)',
		// Errors come from the regex parser, with its messages.
		'rgb(1, 2 3)',
		'rgb(1,,2,3)',
		'rgb(255, none, 0)',
		'hsl(120, 100, 50)',
		'rgb(1 2 3 / 4 / 5)',
		'lab(1, 2, 3)',
		'color(bogus 1 2 3)',
		'#ggg',
		'#12345',
		'rgb(1 2)',
		'oklch(1 2 3px)',
		'rgb (1 2 3)'
	])('%s', (input) => {
		expect(outcome(parse, input)).toEqual(outcome(generic, input))
	})
})
