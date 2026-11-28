import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"

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
			"react-hooks": reactHooks,
			porphyra: {
				rules: {
					"no-static-computed-text": noStaticComputedText,
				},
			},
		},
		rules: {
			"porphyra/no-static-computed-text": "error",
			"react-hooks/exhaustive-deps": "error",
			"react-hooks/no-deriving-state-in-effects": "error",
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/set-state-in-effect": "error",
		},
	},
)
