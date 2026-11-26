/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Do not make direct changes to this file.
 */

import type { ApiClientTransport } from "@/api/client-types"
import { mockOperation as mockOperation0 } from "./operations/getAllChurchMemberships"
import { mockOperation as mockOperation1 } from "./operations/getChurchMembership"
import { mockOperation as mockOperation2 } from "./operations/getDashboard"
import { mockOperation as mockOperation3 } from "./operations/getCampusEvents"
import { mockOperation as mockOperation4 } from "./operations/createCampusEvent"
import { mockOperation as mockOperation5 } from "./operations/getCampusEventTeamVolunteerRequests"
import { mockOperation as mockOperation6 } from "./operations/getMyVolunteerAssignments"
import { mockOperation as mockOperation7 } from "./operations/getMyVolunteerRequests"
import { mockOperation as mockOperation8 } from "./operations/getCampusEventPlanning"
import { mockOperation as mockOperation9 } from "./operations/createChurchEvent"
import { mockOperation as mockOperation10 } from "./operations/scheduleCampusEventMinistry"
import { mockOperation as mockOperation11 } from "./operations/scheduleCampusEventTeam"
import { mockOperation as mockOperation12 } from "./operations/updateCampusEventTeamRoleRequirements"
import { mockOperation as mockOperation13 } from "./operations/assignCampusEventVolunteer"
import { mockOperation as mockOperation14 } from "./operations/createVolunteerReplacement"
import { mockOperation as mockOperation15 } from "./operations/acceptVolunteerRequest"
import { mockOperation as mockOperation16 } from "./operations/declineVolunteerRequest"
import { mockOperation as mockOperation17 } from "./operations/changeCampusEventVolunteerRole"
import { mockOperation as mockOperation18 } from "./operations/dropCampusEventVolunteer"
import { mockOperation as mockOperation19 } from "./operations/cancelMyVolunteerAssignment"
import { mockOperation as mockOperation20 } from "./operations/confirmCampusEventTeam"
import { mockOperation as mockOperation21 } from "./operations/getCurrentUser"
import { mockOperation as mockOperation22 } from "./operations/health_health_get"

export const mockApiClientTransport: ApiClientTransport = {
	getAllChurchMemberships: mockOperation0,
	getChurchMembership: mockOperation1,
	getDashboard: mockOperation2,
	getCampusEvents: mockOperation3,
	createCampusEvent: mockOperation4,
	getCampusEventTeamVolunteerRequests: mockOperation5,
	getMyVolunteerAssignments: mockOperation6,
	getMyVolunteerRequests: mockOperation7,
	getCampusEventPlanning: mockOperation8,
	createChurchEvent: mockOperation9,
	scheduleCampusEventMinistry: mockOperation10,
	scheduleCampusEventTeam: mockOperation11,
	updateCampusEventTeamRoleRequirements: mockOperation12,
	assignCampusEventVolunteer: mockOperation13,
	createVolunteerReplacement: mockOperation14,
	acceptVolunteerRequest: mockOperation15,
	declineVolunteerRequest: mockOperation16,
	changeCampusEventVolunteerRole: mockOperation17,
	dropCampusEventVolunteer: mockOperation18,
	cancelMyVolunteerAssignment: mockOperation19,
	confirmCampusEventTeam: mockOperation20,
	getCurrentUser: mockOperation21,
	health_health_get: mockOperation22,
}
