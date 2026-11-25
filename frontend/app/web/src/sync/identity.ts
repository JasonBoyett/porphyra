export type SyncIdentity = {
	tag: string
	identity: Record<string, string | number | boolean | null>
}

export type SyncResourceView = {
	tag: string
	path: string
	identity: readonly string[]
}

const canonicalIdentity = (identity: SyncIdentity["identity"]) =>
	JSON.stringify(Object.entries(identity).sort(([left], [right]) => left.localeCompare(right)))

export const syncIdentityKey = (target: SyncIdentity) =>
	`${target.tag}:${canonicalIdentity(target.identity)}`

export const isSyncIdentity = (value: unknown): value is SyncIdentity => {
	if (typeof value !== "object" || value === null) return false
	const target = value as Partial<SyncIdentity>
	return (
		typeof target.tag === "string" &&
		target.tag.length > 0 &&
		typeof target.identity === "object" &&
		target.identity !== null &&
		!Array.isArray(target.identity) &&
		Object.keys(target.identity).length > 0 &&
		Object.values(target.identity).every(
			(value) =>
				value === null ||
				typeof value === "string" ||
				typeof value === "number" ||
				typeof value === "boolean",
		)
	)
}

const valuesAtPath = (data: unknown, path: string): unknown[] => {
	if (path === "$") return [data]
	if (path === "$[]") return Array.isArray(data) ? data : []
	const parts = path.replace(/^\$\.?/, "").split(".")
	return parts.reduce<unknown[]>((values, part) => {
		const arrayPart = part.endsWith("[]")
		const key = arrayPart ? part.slice(0, -2) : part
		return values.flatMap((value) => {
			if (typeof value !== "object" || value === null) return []
			const child = (value as Record<string, unknown>)[key]
			return arrayPart ? (Array.isArray(child) ? child : []) : [child]
		})
	}, [data])
}

export const syncIdentitiesIn = (
	data: unknown,
	views: readonly SyncResourceView[],
): SyncIdentity[] =>
	views.flatMap((view) =>
		valuesAtPath(data, view.path).flatMap((value) => {
			if (typeof value !== "object" || value === null) return []
			const source = value as Record<string, unknown>
			const identity = Object.fromEntries(
				view.identity.flatMap((field) => {
					const value = source[field]
					return value === null ||
						typeof value === "string" ||
						typeof value === "number" ||
						typeof value === "boolean"
						? [[field, value]]
						: []
				}),
			)
			return Object.keys(identity).length === view.identity.length
				? [{ tag: view.tag, identity }]
				: []
		}),
	)
