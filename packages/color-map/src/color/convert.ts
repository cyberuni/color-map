import type { Color, ColorSpaceId, Component, Space, Vec3 } from './types.js'

/** Converts bare components between two spaces, through the XYZ-D65 hub. */
export function convertComponents(from: Space, to: Space, c: Vec3): Vec3 {
	return from === to ? c : to.fromXyz(from.toXyz(c))
}

/** The components of a color in another space: a copy in the same space, else `none` becomes 0. */
export type ComponentsIn = (color: Color, to: ColorSpaceId) => Component[]

/** {@link ComponentsIn} over the spaces given. */
export function componentsOver(spaces: Space[]): ComponentsIn {
	const byId = new Map(spaces.map((s) => [s.id, s]))
	const find = (id: ColorSpaceId): Space => {
		const space = byId.get(id)
		if (!space) throw new Error(`color-map: unknown color space "${id}"`)
		return space
	}
	return (color, to) => {
		if (color.colorSpace === to) return [...color.components]
		const from = find(color.colorSpace)
		const c = color.components
		// Different ids, so different spaces: straight through the hub, `none` as 0.
		return find(to).fromXyz(from.toXyz([c[0] ?? 0, c[1] ?? 0, c[2] ?? 0]))
	}
}

/**
 * Builds `convert` over just the spaces given, so a bundle contains only those.
 * `none` components become 0 when the space changes.
 */
export function createConverter(...spaces: Space[]): (color: Color, to: ColorSpaceId) => Color {
	const componentsIn = componentsOver(spaces)
	return (color, to) => {
		const result: Color = { colorSpace: to, components: componentsIn(color, to) }
		if (color.alpha !== undefined) result.alpha = color.alpha
		return result
	}
}
