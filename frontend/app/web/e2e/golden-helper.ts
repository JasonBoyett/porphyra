import { expect, test as base, type Page, type TestInfo } from "@playwright/test"
import { mkdir, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const e2eDirectory = path.dirname(fileURLToPath(import.meta.url))
const goldensDirectory = path.join(e2eDirectory, "goldens")

const fileNamePart = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "")

type Golden = {
	capture: (name: string) => Promise<void>
	open: (path: string, ready: () => Promise<void>) => Promise<void>
}

const captureGolden = async (page: Page, testInfo: TestInfo, name: string): Promise<void> => {
	const testName = fileNamePart(testInfo.title)
	const projectName = fileNamePart(testInfo.project.name)
	const goldenName = fileNamePart(name)
	const snapshotName = [goldenName, `${testName}-${projectName}.png`]
	const failureDirectory = path.join(goldensDirectory, goldenName, "failures")
	const failurePath = path.join(failureDirectory, `${testName}-${projectName}.png`)

	try {
		await expect(page).toHaveScreenshot(snapshotName, { fullPage: true })
		await rm(failurePath, { force: true })
	} catch (error) {
		await mkdir(failureDirectory, { recursive: true })
		await page.screenshot({ fullPage: true, path: failurePath })
		throw error
	}
}

const signInAsDevelopmentUser = async (page: Page) => {
	await page.goto("/sign-in")
	await expect(page.getByLabel("Email")).toHaveValue("dev@a244.tech")
	await page.getByRole("button", { name: "Continue to Porphyra" }).click()
	await expect(page).toHaveURL(/\/app\/?$/)
}

export const test = base.extend<{ golden: Golden }>({
	golden: async ({ page }, use, testInfo) => {
		await signInAsDevelopmentUser(page)
		await use({
			capture: (name) => captureGolden(page, testInfo, name),
			open: async (destination, ready) => {
				await page.goto(destination)
				await ready()
				await captureGolden(page, testInfo, "default")
			},
		})
	},
})

export { expect }
