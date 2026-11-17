import { expect, test } from "@playwright/test"

type SocketDiagnostic = {
	error?: string
	url: string
}

test("seeded user reaches the app and opens authenticated realtime sync", async ({
	page,
}, testInfo) => {
	const consoleErrors: string[] = []
	const consoleWarnings: string[] = []
	const failedRequests: string[] = []
	const pageErrors: string[] = []
	const responses: Array<{ status: number; url: string }> = []
	const sockets: SocketDiagnostic[] = []

	page.on("console", (message) => {
		if (message.type() === "error") consoleErrors.push(message.text())
		if (message.type() === "warning") consoleWarnings.push(message.text())
	})
	page.on("pageerror", (error) => pageErrors.push(error.stack ?? error.message))
	page.on("requestfailed", (request) => {
		failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`)
	})
	page.on("response", (response) => {
		const url = response.url()
		if (url.includes("/api/")) responses.push({ status: response.status(), url })
	})
	page.on("websocket", (socket) => {
		const diagnostic: SocketDiagnostic = { url: socket.url() }
		sockets.push(diagnostic)
		socket.on("socketerror", (error) => {
			diagnostic.error = error
		})
	})

	await page.goto("/sign-in")
	await expect(page.getByLabel("Email")).toHaveValue("dev@a244.tech")
	await page.getByRole("button", { name: "Continue to Porphyra" }).click()

	await expect(page).toHaveURL(/\/app\/?$/)
	await expect(
		page.getByRole("heading", { name: "Serve your churches with clarity." }),
	).toBeVisible()
	await expect(page.getByText("Grace Harbor Church")).toBeVisible()
	await page.waitForTimeout(1_500)

	const diagnostics = {
		browser: testInfo.project.name,
		consoleErrors,
		consoleWarnings,
		failedRequests,
		pageErrors,
		responses,
		sockets,
	}
	await testInfo.attach("socket-diagnostics", {
		body: Buffer.from(JSON.stringify(diagnostics, null, 2)),
		contentType: "application/json",
	})
	console.log(JSON.stringify(diagnostics, null, 2))

	expect(pageErrors).toEqual([])
	expect(consoleWarnings.filter((warning) => warning.includes("realtime sync"))).toEqual([])
	expect(sockets.some((socket) => socket.url.endsWith("/api/v1/sync"))).toBe(true)
	expect(sockets.every((socket) => socket.error === undefined)).toBe(true)
})

test("captures the socket constructor error from a malformed legacy token", async ({
	page,
}, testInfo) => {
	const consoleWarnings: string[] = []
	const pageErrors: string[] = []

	page.on("console", (message) => {
		if (message.type() === "warning") consoleWarnings.push(message.text())
	})
	page.on("pageerror", (error) => pageErrors.push(error.stack ?? error.message))
	await page.addInitScript(() => {
		sessionStorage.setItem("porphyra-access-token", "invalid token")
	})

	await page.goto("/app")
	await expect(
		page.getByRole("heading", { name: "Serve your churches with clarity." }),
	).toBeVisible()
	await expect
		.poll(() => consoleWarnings.find((warning) => warning.includes("realtime sync")))
		.toBeDefined()

	const diagnostics = {
		browser: testInfo.project.name,
		consoleWarnings,
		pageErrors,
	}
	await testInfo.attach("malformed-token-diagnostics", {
		body: Buffer.from(JSON.stringify(diagnostics, null, 2)),
		contentType: "application/json",
	})
	console.log(JSON.stringify(diagnostics, null, 2))

	expect(pageErrors).toEqual([])
})
