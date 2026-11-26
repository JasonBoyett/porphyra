import { expect, test } from "./golden-helper"

test("development user opens the application", async ({ golden, page }) => {
	await golden.open("/app", async () => {
		await expect(
			page.getByRole("heading", { name: "Serve your churches with clarity." }),
		).toBeVisible()
	})

	await page.getByRole("link", { name: "Planning" }).click()
	await expect(page.getByRole("heading", { name: "Sunday Worship Service" })).toBeVisible()
	await golden.capture("planning")
})
