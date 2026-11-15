export const apiTags = {
	dashboard: ["dashboard"] as const,
	planning: ["planning"] as const,
} as const

export type ApiTag = (typeof apiTags)[keyof typeof apiTags][number]
