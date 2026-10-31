// Heavy differential run of roundTo against Number(n.toFixed(p)): the same
// check as src/color/round-to.spec.ts, over many more values. By hand, not CI.
//
//   pnpm build && node scripts/fuzz-round-to.mjs [count] [seed]   default 20000000 and 1
//
// Exits 1 and prints the first mismatches if the fast path is ever not exact.
import { roundTo } from '../esm/color/serialize.js'

const count = Number(process.argv[2] ?? 20_000_000)
let seed = Number(process.argv[3] ?? 1) >>> 0
const rand = () => {
	seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
	return seed / 2 ** 32
}
const int = (n) => Math.floor(rand() * n)
const f64 = new Float64Array(1)
const u64 = new BigUint64Array(f64.buffer)
const next = (x, d) => {
	f64[0] = x
	u64[0] += BigInt(d)
	return f64[0]
}
const bad = []
let checked = 0
const check = (n, p) => {
	checked++
	const want = Number(n.toFixed(p))
	if (!Object.is(roundTo(n, p), want) && bad.push([n, p, roundTo(n, p), want]) > 20) throw new Error('too many')
}
try {
	while (checked < count) {
		const p = int(23)
		const kind = int(5)
		let n
		if (kind === 0)
			n = (int(2 ** 30) * 2 + 1) / 2 ** (p + 1) // exact tie
		else if (kind === 1)
			n = (int(2 ** 30) + 0.5) / 10 ** p // decimal tie, nearest double
		else if (kind === 2)
			n = rand() * 10 ** (int(46) - 22) // any magnitude
		else if (kind === 3)
			n = (int(2 ** 30) + 0.5 + (rand() - 0.5) * 2e-5) / 10 ** p // near a tie
		else n = int(2 ** 30) / 10 ** p // on the grid
		const d = int(7) - 3
		const x = kind < 2 || kind === 3 ? next(n, d) : n // neighbours of a tie
		for (const v of [x, -x]) check(v, p)
	}
	for (const n of [
		0,
		-0,
		Number.NaN,
		Number.POSITIVE_INFINITY,
		Number.NEGATIVE_INFINITY,
		Number.MIN_VALUE,
		Number.MAX_VALUE
	])
		for (let p = 0; p < 23; p++) check(n, p)
} catch (e) {
	if (e.message !== 'too many') throw e
}
if (bad.length) {
	process.stderr.write(`MISMATCH in ${checked} checks:\n`)
	for (const b of bad) process.stderr.write(`roundTo(${b[0]}, ${b[1]}) = ${b[2]}, toFixed gives ${b[3]}\n`)
	process.exit(1)
}
process.stdout.write(`${checked} values, 0 mismatches (seed ${process.argv[3] ?? 1})\n`)
