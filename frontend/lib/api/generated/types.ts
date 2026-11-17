/**
 * This file was auto-generated from the Porphyra OpenAPI schemas.
 * Do not make direct changes to this file.
 */

import type { components, operations, paths } from "./openapi";

export type { components, operations, paths };

export type ApiRoute = keyof paths;
export type ApiOperationId = keyof operations;
export type ApiSuccessStatus = 200 | 201 | 202 | 204;
export type ApiJsonResponse<TResponse> = TResponse extends {
	content: { "application/json": infer TData };
}
	? TData
	: void;
export type ApiOperationResponse<TOperationId extends ApiOperationId> =
	operations[TOperationId] extends { responses: infer TResponses }
		? TResponses extends Record<number, unknown>
			? ApiJsonResponse<TResponses[Extract<keyof TResponses, ApiSuccessStatus>]>
			: never
		: never;
export type ApiOperationRequest<TOperationId extends ApiOperationId> =
	operations[TOperationId] extends {
		requestBody: { content: { "application/json": infer TData } };
	}
		? TData
		: never;

export type AssignVolunteerRequest =
	components["schemas"]["AssignVolunteerRequest"];
export type CampusEventListItem = components["schemas"]["CampusEventListItem"];
export type CampusEventMinistryScheduleResponse =
	components["schemas"]["CampusEventMinistryScheduleResponse"];
export type CampusEventPlanningResponse =
	components["schemas"]["CampusEventPlanningResponse"];
export type CampusEventResponse = components["schemas"]["CampusEventResponse"];
export type CampusEventTeamScheduleResponse =
	components["schemas"]["CampusEventTeamScheduleResponse"];
export type ChurchMembership = components["schemas"]["ChurchMembership"];
export type ConfirmScheduleRequest =
	components["schemas"]["ConfirmScheduleRequest"];
export type CreateCampusEventRequest =
	components["schemas"]["CreateCampusEventRequest"];
export type CreateChurchEventRequest =
	components["schemas"]["CreateChurchEventRequest"];
export type DashboardCampusResponse =
	components["schemas"]["DashboardCampusResponse"];
export type DashboardChurchResponse =
	components["schemas"]["DashboardChurchResponse"];
export type DashboardMinistryResponse =
	components["schemas"]["DashboardMinistryResponse"];
export type DashboardResponse = components["schemas"]["DashboardResponse"];
export type DashboardTeamResponse =
	components["schemas"]["DashboardTeamResponse"];
export type DashboardViewerResponse =
	components["schemas"]["DashboardViewerResponse"];
export type EventResponse = components["schemas"]["EventResponse"];
export type HTTPValidationError = components["schemas"]["HTTPValidationError"];
export type RoleTemplateData = components["schemas"]["RoleTemplateData"];
export type ScheduleMinistryRequest =
	components["schemas"]["ScheduleMinistryRequest"];
export type ScheduleTeamRequest = components["schemas"]["ScheduleTeamRequest"];
export type ScheduledMinistryResponse =
	components["schemas"]["ScheduledMinistryResponse"];
export type ScheduledTeamResponse =
	components["schemas"]["ScheduledTeamResponse"];
export type ScheduledVolunteerResponse =
	components["schemas"]["ScheduledVolunteerResponse"];
export type TeamRoleResponse = components["schemas"]["TeamRoleResponse"];
export type TeamRoleResponseData =
	components["schemas"]["TeamRoleResponseData"];
export type UpdateTeamRoleRequirementsRequest =
	components["schemas"]["UpdateTeamRoleRequirementsRequest"];
export type UpdateVolunteerRoleRequest =
	components["schemas"]["UpdateVolunteerRoleRequest"];
export type User = components["schemas"]["User"];
export type ValidationError = components["schemas"]["ValidationError"];
export type VolunteerAssignmentResponse =
	components["schemas"]["VolunteerAssignmentResponse"];
export type VolunteerRequestResponse =
	components["schemas"]["VolunteerRequestResponse"];
export type VolunteerRequestRosterResponse =
	components["schemas"]["VolunteerRequestRosterResponse"];
export type _RoleInfoForTemplate =
	components["schemas"]["_RoleInfoForTemplate"];
