import { defineConfig, devices } from "@playwright/test"

import baseConfig from "./playwright.config"

const desktop = devices["Desktop Chrome"]
const mobile = devices["iPhone 13"]

export default defineConfig({
	...baseConfig,
	projects: [
		{ name: "desktop-light", use: { ...desktop, colorScheme: "light" } },
		{ name: "desktop-dark", use: { ...desktop, colorScheme: "dark" } },
		{ name: "mobile-light", use: { ...mobile, colorScheme: "light" } },
		{ name: "mobile-dark", use: { ...mobile, colorScheme: "dark" } },
		{
			name: "localization_test desktop dark",
			use: { ...desktop, colorScheme: "dark" },
		},
	],
	testMatch: "**/*.golden.e2e.ts",
})
