import type { Page } from "@playwright/test"
import type { ApiOperationInput, ApiOperationResponse } from "@porphyra/frontend/api/types"

import { expect, test } from "./golden-helper"

type CreateChurchInput = ApiOperationInput<"createChurch">
type ChurchResponse = ApiOperationResponse<"createChurch">
type DashboardResponse = ApiOperationResponse<"getDashboard">

const churchId = "019b2680-2a8d-7000-8000-000000000001"

test.use({ timezoneId: "America/Chicago" })

const mockChurchCreation = async (page: Page) => {
	let submittedInput: CreateChurchInput | undefined
	let createdChurch: ChurchResponse | undefined

	await page.route("**/api/v1/dashboard/", async (route) => {
		const response: DashboardResponse = {
			viewer: {
				avatarUrl: "",
				email: "dev@a244.tech",
				id: "019b2680-2a8d-7000-9000-000000000001",
				name: "Development User",
			},
			churches:
				createdChurch === undefined
					? []
					: [
							{
								avatarUrl: "",
								campuses: createdChurch.campuses.map((campus) => ({
									id: campus.id,
									location: campus.location,
									name: campus.name,
								})),
								description: "",
								id: createdChurch.id,
								ministries: [],
								name: createdChurch.name,
							},
						],
		}

		await route.fulfill({ json: response })
	})

	await page.route("**/api/v1/churches/", async (route) => {
		submittedInput = route.request().postDataJSON() as CreateChurchInput
		const campusIds = submittedInput.campuses.map(
			(_, index) => `019b2680-2a8d-7000-8000-${String(index + 2).padStart(12, "0")}`,
		)
		const response: ChurchResponse = {
			id: churchId,
			name: submittedInput.name,
			primaryCampusId:
				submittedInput.primaryCampusIndex === null
					? null
					: (campusIds[submittedInput.primaryCampusIndex] ?? null),
			campuses: submittedInput.campuses.map((campus, campusIndex) => ({
				id: campusIds[campusIndex]!,
				name: campus.name,
				campusType: campus.campusType,
				location: {
					addressLine1: campus.address?.addressLine1 ?? null,
					addressLine2: campus.address?.addressLine2 ?? null,
					city: campus.address?.city ?? null,
					countryCode: campus.address?.countryCode ?? null,
					postalCode: campus.address?.postalCode ?? null,
					region: campus.address?.region ?? null,
					timeZone: campus.timeZone,
				},
				recurringServices: (campus.recurringServices ?? []).map((service, serviceIndex) => ({
					durationMinutes: service.durationMinutes ?? null,
					id: `019b2680-2a8d-7000-8100-${String(campusIndex * 10 + serviceIndex + 1).padStart(12, "0")}`,
					name: service.name,
					startsAt: service.startsAt,
					weekday: service.weekday,
				})),
			})),
		}
		createdChurch = response

		await route.fulfill({ json: response, status: 201 })
	})

	return () => submittedInput
}

test("creates a single-location church", async ({ golden, page }) => {
	const submittedInput = await mockChurchCreation(page)

	await golden.open("/church", async () => {
		await expect(page.getByText("No church yet", { exact: true })).toBeVisible()
	})

	await page.getByRole("button", { name: "Create church" }).click()
	await expect(page.getByText("Create your church", { exact: true })).toBeVisible()
	await golden.capture("church-onboarding-structure")

	await page.getByLabel("Church name").fill("Grace Fellowship")
	await page.getByRole("button", { name: "Add address" }).click()
	await page.getByLabel("Address line 1").fill("125 King Street West")
	await page.getByLabel("City").fill("Toronto")
	await page.getByLabel("State, province, or region").fill("Ontario")
	await page.getByLabel("Postal code").fill("M5H 1J9")
	await page.getByLabel("Country code").fill("CA")
	await page.getByRole("button", { name: "Add weekly service" }).click()
	await page.getByLabel("Service name").fill("Sunday Gathering")
	await golden.capture("church-onboarding-single-complete")

	await page.getByRole("button", { name: "Create church" }).click()
	await expect(page).toHaveURL(`/church/${churchId}`)
	await expect(page.getByRole("heading", { name: "Grace Fellowship" })).toBeVisible()
	await expect(page.getByText("Single-location church", { exact: true })).toBeVisible()
	await golden.capture("church-onboarding-created")

	expect(submittedInput()).toMatchObject({
		name: "Grace Fellowship",
		primaryCampusIndex: 0,
		campuses: [
			{
				campusType: "physical",
				name: "Grace Fellowship",
				recurringServices: [{ name: "Sunday Gathering", weekday: 6 }],
				timeZone: "America/Chicago",
			},
		],
	})
})

test("creates a multi-campus church", async ({ golden, page }) => {
	const submittedInput = await mockChurchCreation(page)

	await page.goto("/church")
	await page.getByRole("button", { name: "Create church" }).click()
	await page.getByRole("radio", { name: "Multiple campuses" }).click()
	await expect(page.getByRole("heading", { name: "Campuses" })).toBeVisible()
	await golden.capture("church-onboarding-multi-start")

	await page.getByLabel("Church name").fill("City Hope Church")
	await page.getByLabel("Location name").nth(0).fill("Downtown")
	await page.getByLabel("Location name").nth(1).fill("Church Online")
	await page.getByRole("radio", { name: "Online" }).nth(1).click()
	await page.getByRole("button", { name: "Make primary" }).first().click()

	await page.getByRole("button", { name: "Add campus" }).click()
	await page.getByLabel("Location name").nth(2).fill("Ministry Offices")
	await page.getByRole("radio", { name: "Administrative" }).nth(2).click()
	await page.getByRole("heading", { name: "Campuses" }).click()
	await golden.capture("church-onboarding-multi-complete")

	const createChurch = page.getByRole("button", { name: "Create church" })
	await expect(createChurch).toBeEnabled()
	await createChurch.click()
	await expect.poll(submittedInput).toBeDefined()
	await expect(page).toHaveURL(`/church/${churchId}`)
	await expect(page.getByRole("heading", { name: "City Hope Church" })).toBeVisible()
	await expect(page.getByText("Multi-campus church", { exact: true })).toBeVisible()
	await golden.capture("church-onboarding-created")

	expect(submittedInput()).toMatchObject({
		name: "City Hope Church",
		primaryCampusIndex: 1,
		campuses: [
			{ campusType: "physical", name: "Downtown" },
			{ campusType: "online", name: "Church Online" },
			{ campusType: "administrative", name: "Ministry Offices" },
		],
	})
})
