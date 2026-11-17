import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
	plugins: [tanstackRouter({ autoCodeSplitting: true, target: "react" }), react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src"),
		},
	},
})
