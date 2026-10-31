import { fail, UNITS } from './parse.js'

const TOKEN = /\s*(?:(\d*\.?\d+(?:e[+-]?\d+)?)([a-z%]*)|([a-z][a-z0-9-]*)|([-+*/(),]))/y

/**
 * Evaluates the `calc()` subset relative colors accept: numbers (angles become
 * degrees), `+ - * /`, parentheses, `calc`, `min`, `max`, `clamp`, the
 * constants `pi` and `e`, and the channel keywords in `vars`.
 */
export function evaluate(text: string, vars: Record<string, number>): number {
	const tokens: string[] = []
	TOKEN.lastIndex = 0
	let end = 0
	for (let m = TOKEN.exec(text); m; m = TOKEN.exec(text)) {
		end = TOKEN.lastIndex
		if (m[1] === undefined) tokens.push(m[3] ?? m[4])
		else {
			const unit = UNITS[m[2]]
			if (unit === undefined) return fail(text, 'units other than angles are not supported in calc()', m[1] + m[2])
			tokens.push(String(Number(m[1]) * unit))
		}
	}
	if (end !== text.trimEnd().length) return fail(text, 'invalid calc() expression')
	let pos = 0
	const next = (): string => tokens[pos++]
	const eat = (t: string): boolean => (tokens[pos] === t ? ++pos > 0 : false)
	const need = (t: string): void => {
		if (!eat(t)) fail(text, `expected "${t}" in calc()`, tokens[pos])
	}
	function sum(): number {
		let v = product()
		for (;;) {
			if (eat('+')) v += product()
			else if (eat('-')) v -= product()
			else return v
		}
	}
	function product(): number {
		let v = unary()
		for (;;) {
			if (eat('*')) v *= unary()
			else if (eat('/')) v /= unary()
			else return v
		}
	}
	function unary(): number {
		if (eat('-')) return -unary()
		if (eat('+')) return unary()
		return atom()
	}
	function args(): number[] {
		const list = [sum()]
		while (eat(',')) list.push(sum())
		need(')')
		return list
	}
	function atom(): number {
		const t = next()
		if (t === undefined) return fail(text, 'unfinished calc() expression')
		if (/^[\d.]/.test(t)) return Number(t)
		if (t === '(') {
			const v = sum()
			need(')')
			return v
		}
		if (!/^[a-z]/.test(t)) return fail(text, 'unexpected token', t)
		if (eat('(')) {
			const list = args()
			if (t === 'calc' && list.length === 1) return list[0]
			if (t === 'min') return Math.min(...list)
			if (t === 'max') return Math.max(...list)
			if (t === 'clamp' && list.length === 3) return Math.min(list[2], Math.max(list[0], list[1]))
			return fail(text, 'unknown function', t)
		}
		if (t === 'pi') return Math.PI
		if (t === 'e') return Math.E
		const v = vars[t]
		if (typeof v === 'number') return v
		return fail(text, 'unknown keyword', t)
	}
	const value = sum()
	if (pos < tokens.length) return fail(text, 'unexpected token', tokens[pos])
	return value
}
