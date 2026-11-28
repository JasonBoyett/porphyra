import { describe, expect, it, vi } from "vitest"

import { decorateResourceViews } from "./decorate-api-client"

describe("sync resource actions", () => {
	it("decorates nested planning teams and merges caller input with bound identity", async () => {
		const runAction = vi.fn().mockResolvedValue({})
		const planning = {
			ministries: [
				{
					teams: [{ id: "event-team-1", name: "Worship" }],
				},
			],
		}

		const decorated = decorateResourceViews(
			planning,
			"getCampusEventPlanning",
			runAction,
		) as typeof planning & {
			ministries: Array<{
				teams: Array<{
					assignVolunteer: (input: Record<string, unknown>) => Promise<unknown>
				}>
			}>
		}

		await decorated.ministries[0]?.teams[0]?.assignVolunteer({
			event_team_id: "caller-cannot-override-resource",
			roleName: "Guitar",
			teamMembershipId: "membership-1",
		})

		expect(runAction).toHaveBeenCalledWith("assignCampusEventVolunteer", {
			event_team_id: "event-team-1",
			roleName: "Guitar",
			teamMembershipId: "membership-1",
		})
	})
})
