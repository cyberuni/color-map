import { Writable } from 'node:stream'
import { createApp } from './cli.js'

/** Runs the CLI in process and returns what it wrote and how it exited. */
export async function run(...argv: string[]) {
	let out = ''
	let err = ''
	const sink = (append: (s: string) => void) =>
		new Writable({
			decodeStrings: false,
			write(chunk, _encoding, callback) {
				append(String(chunk))
				callback()
			}
		})
	const code = await createApp({
		version: '1.0.0',
		streams: { stdout: sink((s) => (out += s)), stderr: sink((s) => (err += s)) }
	}).parse(['node', 'color-map', ...argv])
	return { out, err, code: typeof code === 'number' ? code : 0 }
}

/** Runs with `--format json` and parses stdout. */
export async function runJson(...argv: string[]) {
	const r = await run(...argv, '--format', 'json')
	return { ...r, json: JSON.parse(r.out) as Record<string, any> }
}
