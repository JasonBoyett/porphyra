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
export type ApiOperationPath<TOperationId extends ApiOperationId> =
	operations[TOperationId] extends { parameters: { path: infer TData } }
		? TData
		: never;
export type ApiOperationQuery<TOperationId extends ApiOperationId> =
	operations[TOperationId] extends { parameters: { query?: infer TData } }
		? NonNullable<TData>
		: never;
type ApiOperationDataPart<TData> = [TData] extends [never] ? {} : TData;
export type ApiOperationInput<TOperationId extends ApiOperationId> =
	ApiOperationDataPart<ApiOperationPath<TOperationId>> &
		ApiOperationDataPart<ApiOperationQuery<TOperationId>> &
		ApiOperationDataPart<ApiOperationRequest<TOperationId>>;

type ApiSyncResourceActionMethod<
	TOperationId extends ApiOperationId,
	TBoundParameter extends PropertyKey,
> = keyof Omit<ApiOperationInput<TOperationId>, TBoundParameter> extends never
	? () => Promise<ApiOperationResponse<TOperationId>>
	: (
			input: Omit<ApiOperationInput<TOperationId>, TBoundParameter>,
		) => Promise<ApiOperationResponse<TOperationId>>;

export type AffectedVolunteerAction =
	components["schemas"]["AffectedVolunteerAction"];
export type AssignVolunteerRequest =
	components["schemas"]["AssignVolunteerRequest"];
export type CampusAddressRequest =
	components["schemas"]["CampusAddressRequest"];
export type CampusEventListItem = components["schemas"]["CampusEventListItem"];
export type CampusEventMinistryScheduleResponse =
	components["schemas"]["CampusEventMinistryScheduleResponse"];
export type CampusEventPlanningResponse =
	components["schemas"]["CampusEventPlanningResponse"];
export type CampusEventResponse = components["schemas"]["CampusEventResponse"];
export type CampusEventTeamScheduleResponse =
	components["schemas"]["CampusEventTeamScheduleResponse"];
export type CampusLocationResponse =
	components["schemas"]["CampusLocationResponse"];
export type CampusPermissionSnapshot =
	components["schemas"]["CampusPermissionSnapshot"];
export type CampusResponse = components["schemas"]["CampusResponse"];
export type CampusType = components["schemas"]["CampusType"];
export type ChurchMembership = components["schemas"]["ChurchMembership"];
export type ChurchPermissionSnapshot =
	components["schemas"]["ChurchPermissionSnapshot"];
export type ChurchResponse = components["schemas"]["ChurchResponse"];
export type ConfirmScheduleRequest =
	components["schemas"]["ConfirmScheduleRequest"];
export type CreateCampusEventRequest =
	components["schemas"]["CreateCampusEventRequest"];
export type CreateCampusRequest = components["schemas"]["CreateCampusRequest"];
export type CreateChurchEventRequest =
	components["schemas"]["CreateChurchEventRequest"];
export type CreateChurchRequest = components["schemas"]["CreateChurchRequest"];
export type CreateInvitationRequest =
	components["schemas"]["CreateInvitationRequest"];
export type CreateRecurringServiceRequest =
	components["schemas"]["CreateRecurringServiceRequest"];
export type CreatedInvitationResponse =
	components["schemas"]["CreatedInvitationResponse"];
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
export type InvitationResponse = components["schemas"]["InvitationResponse"];
export type MyVolunteerAssignmentResponse =
	components["schemas"]["MyVolunteerAssignmentResponse"];
export type MyVolunteerAssignmentsResponse =
	components["schemas"]["MyVolunteerAssignmentsResponse"];
export type RecurringServiceResponse =
	components["schemas"]["RecurringServiceResponse"];
export type RedeemInvitationRequest =
	components["schemas"]["RedeemInvitationRequest"];
export type RedeemedInvitationResponse =
	components["schemas"]["RedeemedInvitationResponse"];
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
export type SetPrimaryCampusRequest =
	components["schemas"]["SetPrimaryCampusRequest"];
export type TeamPermissionSnapshot =
	components["schemas"]["TeamPermissionSnapshot"];
export type TeamRoleResponse = components["schemas"]["TeamRoleResponse"];
export type TeamRoleResponseData =
	components["schemas"]["TeamRoleResponseData"];
export type UpdateCampusRequest = components["schemas"]["UpdateCampusRequest"];
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

export type ApiSyncResourceActionMethods<TTag extends string> =
	TTag extends "volunteer-requests"
		? {
				accept: ApiSyncResourceActionMethod<
					"acceptVolunteerRequest",
					"event_team_id" | "request_id"
				>;
				decline: ApiSyncResourceActionMethod<
					"declineVolunteerRequest",
					"event_team_id" | "request_id"
				>;
			}
		: TTag extends "volunteer-assignments"
			? {
					cancel: ApiSyncResourceActionMethod<
						"cancelMyVolunteerAssignment",
						"event_team_id" | "volunteer_id"
					>;
				}
			: TTag extends "campus-event-teams"
				? {
						updateRoleRequirements: ApiSyncResourceActionMethod<
							"updateCampusEventTeamRoleRequirements",
							"event_team_id"
						>;
						assignVolunteer: ApiSyncResourceActionMethod<
							"assignCampusEventVolunteer",
							"event_team_id"
						>;
						createVolunteerReplacement: ApiSyncResourceActionMethod<
							"createVolunteerReplacement",
							"event_team_id"
						>;
						changeVolunteerRole: ApiSyncResourceActionMethod<
							"changeCampusEventVolunteerRole",
							"event_team_id"
						>;
						dropVolunteer: ApiSyncResourceActionMethod<
							"dropCampusEventVolunteer",
							"event_team_id"
						>;
					}
				: {};
