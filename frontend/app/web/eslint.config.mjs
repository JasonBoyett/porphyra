import tseslint from "typescript-eslint"

import { noStaticComputedText } from "./eslint-rules/no-static-computed-text.mjs"

export default tseslint.config(
	{
		ignores: ["dist/**", "e2e/goldens/**", "test-results/**", "src/routeTree.gen.ts"],
	},
	{
		files: ["src/**/*.{ts,tsx}"],
		languageOptions: {
			parser: tseslint.parser,
		},
		plugins: {
			porphyra: {
				rules: {
					"no-static-computed-text": noStaticComputedText,
				},
			},
		},
		rules: {
			"porphyra/no-static-computed-text": "error",
		},
	},
)
