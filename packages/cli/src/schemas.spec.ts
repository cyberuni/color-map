import { describe, expect, test } from 'vitest'
import { schemaOf } from './schemas.js'

describe('schemaOf', () => {
	test('reads every descriptor kind, requiredness and defaults', () => {
		const schema = schemaOf({
			name: 'demo',
			arguments: [
				{ name: 'a', type: { kind: 'string', isOptional: false } },
				{ name: 'b' },
				{ name: 'c', type: { kind: 'string', isOptional: true } }
			],
			options: {
				n: { type: { kind: 'number', isOptional: false, min: 1 }, default: 3, description: 'n' },
				i: { type: { kind: 'int', isOptional: true, max: 9 } },
				flag: { type: { kind: 'boolean', isOptional: true } },
				list: { type: { kind: 'array', isOptional: true, element: { kind: 'enum', values: ['x', 'y'] } } },
				lit: { type: { kind: 'literal', value: 1 } },
				need: { type: { kind: 'string', isOptional: false } },
				none: undefined
			}
		}) as any
		expect(schema.description).toBeUndefined()
		expect(schema.required).toEqual(['a', 'b', 'lit', 'need'])
		expect(schema.properties.n).toMatchObject({ type: 'number', minimum: 1, default: 3, description: 'n' })
		expect(schema.properties.i).toMatchObject({ type: 'integer', maximum: 9 })
		expect(schema.properties.list).toMatchObject({ type: 'array', items: { enum: ['x', 'y'] } })
		expect(schema.properties.lit).not.toHaveProperty('type')
		expect(schema.properties.none).toBeDefined()
		expect(schemaOf({ name: 'empty' }).properties).toEqual({})
	})
})
