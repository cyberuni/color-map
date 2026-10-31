import type { Color, ColorSpaceId, Component, Space, Vec3 } from './types.js'

/** Replaces `none` with 0, the way CSS does when converting. */
export function resolveComponents(components: Component[]): Vec3 {
	return [components[0] ?? 0, components[1] ?? 0, components[2] ?? 0]
}

/** Converts bare components between two spaces, through the XYZ-D65 hub. */
export function convertComponents(from: Space, to: Space, c: Vec3): Vec3 {
	return from === to ? c : to.fromXyz(from.toXyz(c))
}

/**
 * Builds `convert` over just the spaces given, so a bundle contains only those.
 * `none` components become 0 when the space changes.
 */
export function createConverter(...spaces: Space[]): (color: Color, to: ColorSpaceId) => Color {
	const byId = new Map(spaces.map((s) => [s.id, s]))
	const find = (id: ColorSpaceId): Space => {
		const space = byId.get(id)
		if (!space) throw new Error(`color-map: unknown color space "${id}"`)
		return space
	}
	return (color, to) => {
		const result: Color = {
			colorSpace: to,
			components:
				color.colorSpace === to
					? [...color.components]
					: convertComponents(find(color.colorSpace), find(to), resolveComponents(color.components))
		}
		if (color.alpha !== undefined) result.alpha = color.alpha
		return result
	}
}
