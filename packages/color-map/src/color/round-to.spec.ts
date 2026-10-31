import { roundTo } from './serialize.js'

// roundTo must equal Number(n.toFixed(p)) for every n and p, including -0 and NaN.
// The heavy run of the same check is scripts/fuzz-round-to.mjs.

const f64 = new Float64Array(1)
const u64 = new BigUint64Array(f64.buffer)
/** The double `steps` places after (or before, when negative) `x`. */
function step(x: number, steps: number): number {
	f64[0] = x
	const up = x > 0 === steps > 0
	u64[0] += BigInt(up ? Math.abs(steps) : -Math.abs(steps))
	return x === 0 ? (steps > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE) * Math.abs(steps) : f64[0]
}

let seed = 7
const rand = (): number => {
	seed = (seed * 1664525 + 1013904223) >>> 0
	return seed / 2 ** 32
}
const int = (n: number): number => Math.floor(rand() * n)

const PRECISIONS = Array.from({ length: 23 }, (_, i) => i)

function same(n: number, p: number): void {
	const expected = Number(n.toFixed(p))
	const got = roundTo(n, p)
	if (!Object.is(got, expected)) expect.fail(`roundTo(${n}, ${p}) = ${got}, toFixed gives ${expected}`)
}

describe('roundTo', () => {
	test('equals Number(n.toFixed(p)) on the special values, at every precision', () => {
		const special = [
			0,
			-0,
			Number.NaN,
			Number.POSITIVE_INFINITY,
			Number.NEGATIVE_INFINITY,
			Number.MIN_VALUE,
			Number.MAX_VALUE,
			Number.EPSILON,
			1e21,
			1e-21,
			1e9,
			999999999.9999999,
			0.5,
			1.5,
			2.5,
			1.005,
			2.675,
			0.1 + 0.2,
			255,
			127.5
		]
		for (const p of PRECISIONS) for (const n of special) for (const s of [n, -n]) same(s, p)
	})

	test('equals it on exact ties and the doubles next to them', () => {
		for (let i = 0; i < 6000; i++) {
			const p = PRECISIONS[int(12)]
			// (2j+1) / 2^(p+1) is an exact tie at p decimals; 10^p * k + 5 / 10^(p+1) is the nearest double to a decimal one.
			const dyadic = (2 * int(1 << 20) + 1) / 2 ** (p + 1)
			const decimal = (int(1 << 20) + 0.5) / 10 ** p
			for (const tie of [dyadic, decimal]) {
				for (const d of [-3, -2, -1, 0, 1, 2, 3]) {
					same(step(tie, d), p)
					same(-step(tie, d), p)
				}
			}
		}
	})

	test('equals it on random values of every magnitude, both signs', () => {
		for (let i = 0; i < 60000; i++) {
			const p = PRECISIONS[int(PRECISIONS.length)]
			const n = (rand() < 0.5 ? -1 : 1) * rand() * 10 ** (int(40) - 20)
			same(n, p)
		}
	})

	test('equals it near whole numbers and near ties at the precisions toCss uses', () => {
		for (let i = 0; i < 60000; i++) {
			const p = int(11)
			const k = int(1 << 24)
			for (const x of [(k + 0.5) / 10 ** p, k / 10 ** p, (k + 0.5 + (rand() - 0.5) * 1e-5) / 10 ** p]) same(x, p)
		}
	})

	test('hands what it cannot decide to toFixed, so bad precisions fail the same way', () => {
		for (const p of [-1, 101, Number.NaN]) {
			let expected: unknown
			try {
				expected = Number((0.5).toFixed(p))
			} catch (e) {
				expected = (e as Error).name
			}
			let got: unknown
			try {
				got = roundTo(0.5, p)
			} catch (e) {
				got = (e as Error).name
			}
			expect(got).toEqual(expected)
		}
		expect(roundTo(2.5, 1.9)).toBe(Number((2.5).toFixed(1.9)))
		expect(roundTo(2.5, '1' as unknown as number)).toBe(2.5)
	})
})
