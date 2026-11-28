/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Do not make direct changes to this file.
 */

import type { ApiClientTransport } from "@/api/client-types"
import { mockOperation as mockOperation0 } from "./operations/getAllChurchMemberships"
import { mockOperation as mockOperation1 } from "./operations/getChurchMembership"
import { mockOperation as mockOperation2 } from "./operations/createChurch"
import { mockOperation as mockOperation3 } from "./operations/setPrimaryCampus"
import { mockOperation as mockOperation4 } from "./operations/deleteCampus"
import { mockOperation as mockOperation5 } from "./operations/updateCampus"
import { mockOperation as mockOperation6 } from "./operations/createInvitation"
import { mockOperation as mockOperation7 } from "./operations/revokeInvitation"
import { mockOperation as mockOperation8 } from "./operations/getInvitation"
import { mockOperation as mockOperation9 } from "./operations/redeemInvitation"
import { mockOperation as mockOperation10 } from "./operations/getDashboard"
import { mockOperation as mockOperation11 } from "./operations/getCampusEvents"
import { mockOperation as mockOperation12 } from "./operations/createCampusEvent"
import { mockOperation as mockOperation13 } from "./operations/getCampusEventTeamVolunteerRequests"
import { mockOperation as mockOperation14 } from "./operations/getMyVolunteerAssignments"
import { mockOperation as mockOperation15 } from "./operations/getMyVolunteerRequests"
import { mockOperation as mockOperation16 } from "./operations/getCampusEventPlanning"
import { mockOperation as mockOperation17 } from "./operations/createChurchEvent"
import { mockOperation as mockOperation18 } from "./operations/scheduleCampusEventMinistry"
import { mockOperation as mockOperation19 } from "./operations/scheduleCampusEventTeam"
import { mockOperation as mockOperation20 } from "./operations/updateCampusEventTeamRoleRequirements"
import { mockOperation as mockOperation21 } from "./operations/assignCampusEventVolunteer"
import { mockOperation as mockOperation22 } from "./operations/createVolunteerReplacement"
import { mockOperation as mockOperation23 } from "./operations/acceptVolunteerRequest"
import { mockOperation as mockOperation24 } from "./operations/declineVolunteerRequest"
import { mockOperation as mockOperation25 } from "./operations/changeCampusEventVolunteerRole"
import { mockOperation as mockOperation26 } from "./operations/dropCampusEventVolunteer"
import { mockOperation as mockOperation27 } from "./operations/cancelMyVolunteerAssignment"
import { mockOperation as mockOperation28 } from "./operations/confirmCampusEventTeam"
import { mockOperation as mockOperation29 } from "./operations/getCurrentUser"
import { mockOperation as mockOperation30 } from "./operations/getChurchPermissions"
import { mockOperation as mockOperation31 } from "./operations/health_health_get"

export const mockApiClientTransport: ApiClientTransport = {
	getAllChurchMemberships: mockOperation0,
	getChurchMembership: mockOperation1,
	createChurch: mockOperation2,
	setPrimaryCampus: mockOperation3,
	deleteCampus: mockOperation4,
	updateCampus: mockOperation5,
	createInvitation: mockOperation6,
	revokeInvitation: mockOperation7,
	getInvitation: mockOperation8,
	redeemInvitation: mockOperation9,
	getDashboard: mockOperation10,
	getCampusEvents: mockOperation11,
	createCampusEvent: mockOperation12,
	getCampusEventTeamVolunteerRequests: mockOperation13,
	getMyVolunteerAssignments: mockOperation14,
	getMyVolunteerRequests: mockOperation15,
	getCampusEventPlanning: mockOperation16,
	createChurchEvent: mockOperation17,
	scheduleCampusEventMinistry: mockOperation18,
	scheduleCampusEventTeam: mockOperation19,
	updateCampusEventTeamRoleRequirements: mockOperation20,
	assignCampusEventVolunteer: mockOperation21,
	createVolunteerReplacement: mockOperation22,
	acceptVolunteerRequest: mockOperation23,
	declineVolunteerRequest: mockOperation24,
	changeCampusEventVolunteerRole: mockOperation25,
	dropCampusEventVolunteer: mockOperation26,
	cancelMyVolunteerAssignment: mockOperation27,
	confirmCampusEventTeam: mockOperation28,
	getCurrentUser: mockOperation29,
	getChurchPermissions: mockOperation30,
	health_health_get: mockOperation31,
}
