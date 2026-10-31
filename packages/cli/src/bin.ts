#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { createApp } from './cli.js'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }

createApp({ version })
	.parse(process.argv)
	.then((code) => {
		if (typeof code === 'number') process.exitCode = code
	})
