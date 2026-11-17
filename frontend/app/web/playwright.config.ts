import { defineConfig, devices } from "@playwright/test"
import path from "node:path"
import { fileURLToPath } from "node:url"

const webDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryDirectory = path.resolve(webDirectory, "../../..")

export default defineConfig({
	expect: {
		timeout: 10_000,
	},
	fullyParallel: true,
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
	],
	reporter: "line",
	testDir: "./e2e",
	testMatch: "**/*.e2e.ts",
	timeout: 30_000,
	use: {
		baseURL: "http://localhost:3000",
		screenshot: "only-on-failure",
		trace: "retain-on-failure",
	},
	webServer: [
		{
			command: "bun run dev",
			cwd: path.join(repositoryDirectory, "server/auth"),
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
			url: "http://localhost:4000/health",
		},
		{
			command: "uv run fastapi dev app/main.py --port 8000",
			cwd: path.join(repositoryDirectory, "server/api"),
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
			url: "http://localhost:8000/health",
		},
		{
			command: "bun run dev",
			cwd: webDirectory,
			reuseExistingServer: !process.env.CI,
			timeout: 30_000,
			url: "http://localhost:3000/sign-in",
		},
	],
})
