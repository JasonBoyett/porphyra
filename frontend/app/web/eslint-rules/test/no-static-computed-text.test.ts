import { ESLint } from "eslint"
import { describe, expect, it } from "vitest"

const lint = async (code: string) => {
	const eslint = new ESLint({ cwd: process.cwd() })
	return eslint.lintText(code, { filePath: "src/example.tsx" })
}

describe("no-static-computed-text", () => {
	it("rejects literal strings passed to ComputedText", async () => {
		const [result] = await lint('const view = <ComputedText value="Schedule volunteer" />')

		expect(result.messages).toMatchObject([
			{
				ruleId: "porphyra/no-static-computed-text",
				message:
					"Static user-facing copy must use Localized. ComputedText values must be derived at runtime.",
			},
		])
	})

	it("allows runtime-derived values", async () => {
		const [result] = await lint("const view = <ComputedText value={volunteer.name} />")

		expect(result.messages).toEqual([])
	})
})
