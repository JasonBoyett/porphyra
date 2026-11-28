export type PresentationOverride = Readonly<{
	backgroundColor?: string;
	color?: string;
	fontSize?: string;
	fontStyle?: "italic" | "normal";
	fontWeight?: number | string;
	textDecoration?: string;
}>;

export type PluralizedTranslation = Readonly<{
	plural: string;
	singular: string;
}>;

export type Translation = string | PluralizedTranslation;

export type ContextualOverride = Readonly<{
	presentation?: PresentationOverride;
	text?: Translation;
}>;

export type LocaleCatalog = Readonly<Record<string, Translation>>;

export type TranslationCatalog = Readonly<{
	contextual?: Readonly<
		Record<string, Readonly<Record<string, ContextualOverride>>>
	>;
	locales: Readonly<Record<string, LocaleCatalog>>;
	sourceLocale: string;
}>;

export type TranslationValues = Readonly<Record<string, string | number>>;

export const interpolate = (
	template: string,
	values?: TranslationValues,
): string =>
	template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
		values?.[name] === undefined ? placeholder : String(values[name]),
	);

export const resolvePluralizedTranslation = (
	translation: Translation,
	{
		pluralize = false,
		values,
	}: Readonly<{ pluralize?: boolean; values?: TranslationValues }> = {},
): string => {
	if (typeof translation === "string") return translation;
	return pluralize && values?.count !== 1
		? translation.plural
		: translation.singular;
};

/**
 * The application catalog is intentionally data-only. React applications inject it
 * through their TranslationProvider rather than importing it from localized views.
 */
export const porphyraCatalog = {
	sourceLocale: "en",
	locales: {
		en: {
			"auth.email": "Email",
			"auth.password": "Password",
			"auth.signIn": "Sign in",
			"auth.signInFailed": "Unable to sign in. Please try again.",
			"auth.title": "Sign in to serve your church.",
			"auth.welcome": "Welcome to Porphyra",
			"auth.description":
				"Use the seeded development account to explore church, campus, ministry, and team workspaces.",
			"auth.continue": "Continue to Porphyra",
			"auth.createAccount": "Need an account? Create one",
			"common.all": "All",
			"common.close": "Close",
			"common.hello": "hello",
			"common.inspectStrings": "Inspect strings",
			"common.loading": "Loading…",
			"common.locale": "Locale",
			"common.porphyra": "Porphyra",
			"common.signOut": "Sign out",
			"churchOnboarding.addAddress": "Add address",
			"churchOnboarding.addService": "Add weekly service",
			"churchOnboarding.address": "Address (optional)",
			"churchOnboarding.addressDescription":
				"Add any international address using its two-letter country code.",
			"churchOnboarding.addressLine1": "Address line 1",
			"churchOnboarding.addressLine2": "Address line 2",
			"churchOnboarding.cancel": "Cancel",
			"churchOnboarding.campusDetails": "Location details",
			"churchOnboarding.campusName": "Location name",
			"churchOnboarding.churchName": "Church name",
			"churchOnboarding.city": "City",
			"churchOnboarding.countryCode": "Country code",
			"churchOnboarding.createChurch": "Create church",
			"churchOnboarding.creating": "Creating church…",
			"churchOnboarding.description":
				"Start with one location now. You can add more campus details as your church grows.",
			"churchOnboarding.duration": "Duration in minutes (optional)",
			"churchOnboarding.emptyDescription":
				"Create your church workspace to begin organizing locations, services, and ministry work.",
			"churchOnboarding.emptyTitle": "No church workspace yet",
			"churchOnboarding.friday": "Friday",
			"churchOnboarding.managementDescription":
				"Church management is ready for workspace",
			"churchOnboarding.managementTitle": "Church created",
			"churchOnboarding.monday": "Monday",
			"churchOnboarding.multi.addCampus": "Add campus",
			"churchOnboarding.multi.administrative": "Administrative",
			"churchOnboarding.multi.campusNamePlaceholder": "Downtown Campus",
			"churchOnboarding.multi.campusNumber": "Campus {number}",
			"churchOnboarding.multi.campusType": "Campus type",
			"churchOnboarding.multi.campusTypeDescription":
				"Choose the option that best describes this campus.",
			"churchOnboarding.multi.countryCodeDescription":
				"Use the two-letter ISO country code, such as US or GB.",
			"churchOnboarding.multi.description":
				"Add each campus, choose the primary campus, and include any regular weekly services.",
			"churchOnboarding.multi.invalidTimeZoneError":
				"Enter a valid IANA time zone.",
			"churchOnboarding.multi.makePrimary": "Make primary",
			"churchOnboarding.multi.minimumCampusesError":
				"Add at least two campuses for a multi-campus church.",
			"churchOnboarding.multi.ministryCenter": "Ministry center",
			"churchOnboarding.multi.nameRequiredError": "Enter a campus name.",
			"churchOnboarding.multi.noServices": "We don’t have services yet",
			"churchOnboarding.multi.online": "Online",
			"churchOnboarding.multi.physical": "Physical",
			"churchOnboarding.multi.primaryCampus": "Primary campus",
			"churchOnboarding.multi.primaryDescription":
				"Choose one primary campus for the church.",
			"churchOnboarding.multi.primaryRequiredError": "Choose a primary campus.",
			"churchOnboarding.multi.removeAddress": "Remove address",
			"churchOnboarding.multi.removeCampus": "Remove campus",
			"churchOnboarding.multi.removeService": "Remove service",
			"churchOnboarding.multi.serviceNameRequiredError":
				"Enter a service name.",
			"churchOnboarding.multi.serviceNumber": "Weekly service {number}",
			"churchOnboarding.multi.timeZoneDescription":
				"Enter a canonical IANA time zone, such as America/Chicago.",
			"churchOnboarding.multi.timeZoneRequiredError": "Enter a time zone.",
			"churchOnboarding.multi.title": "Campuses",
			"churchOnboarding.multi.typeRequiredError": "Choose a campus type.",
			"churchOnboarding.multi.weeklyServices": "Weekly services",
			"churchOnboarding.multi.weeklyServicesDescription":
				"Add the regular weekly services held by this campus.",
			"churchOnboarding.multipleCampuses": "Multiple campuses",
			"churchOnboarding.multiCampusUnavailable":
				"The multi-campus editor is being connected. Choose one location to continue for now.",
			"churchOnboarding.postalCode": "Postal code",
			"churchOnboarding.region": "State, province, or region",
			"churchOnboarding.remove": "Remove",
			"churchOnboarding.saturday": "Saturday",
			"churchOnboarding.serviceDescription":
				"Sunday is selected by default, and every detail can be edited.",
			"churchOnboarding.serviceName": "Service name",
			"churchOnboarding.singleLocation": "One location",
			"churchOnboarding.startTime": "Start time",
			"churchOnboarding.structure": "Church structure",
			"churchOnboarding.submitError":
				"We could not create the church. Your details are still here; please try again.",
			"churchOnboarding.sunday": "Sunday",
			"churchOnboarding.thursday": "Thursday",
			"churchOnboarding.timeZone": "IANA time zone",
			"churchOnboarding.timeZoneDetected": "Device time zone:",
			"churchOnboarding.title": "Create your church workspace",
			"churchOnboarding.tuesday": "Tuesday",
			"churchOnboarding.wednesday": "Wednesday",
			"churchOnboarding.weekday": "Weekday",
			"churchOnboarding.weeklyService": "Weekly recurring service (optional)",
			"dashboard.apiUnavailable": "The API is not running yet. Start it with",
			"dashboard.church": "Church",
			"dashboard.churches": "{count} churches",
			"dashboard.description":
				"Choose a church below, or move between Planning, Volunteer, and Kiosk from the web workspace.",
			"dashboard.friend": "friend",
			"dashboard.greeting": "Good morning, {name}",
			"dashboard.title": "Serve your churches with clarity.",
			"dashboard.loadingChurches": "Loading churches…",
			"kiosk.description":
				"Create welcoming, dependable on-site experiences for your campuses.",
			"kiosk.open": "Open {title}",
			"kiosk.title": "Kiosk",
			"kiosk.workspace": "Web workspace",
			"navigation.applicationAreas": "Application areas",
			"navigation.kiosk": "Kiosk",
			"navigation.overview": "Overview",
			"navigation.planning": "Planning",
			"navigation.volunteer": "Volunteer",
			"planning.allMinistries": "All ministries",
			"planning.confirmed": "Confirmed",
			"planning.cancelledAssignments": "Cancelled assignments",
			"planning.event": "Event",
			"planning.eventStartsAt": "Event starts at {time}",
			"planning.loadingSchedule": "Loading schedule…",
			"planning.ministry": "Ministry",
			"planning.myTeams": "My teams",
			"planning.needsAttention": "Needs attention",
			"planning.needsVolunteers": "Needs volunteers",
			"planning.noEvents": "No events are available to plan yet.",
			"planning.noTeams": "No teams match these filters",
			"planning.noTeamsDescription":
				"Try a different ministry or schedule view.",
			"planning.servicePlanning": "Service planning",
			"planning.role": "Role",
			"planning.roleAriaLabel": "{name}'s role",
			"planning.roster": "Roster",
			"planning.pendingRejections": "Pending rejections",
			"planning.awaitingConfirmation": "Awaiting confirmation",
			"planning.plannedTeamCount": {
				singular: "{count} planned team",
				plural: "{count} planned teams",
			},
			"planning.ready": "Ready",
			"planning.save": "Save",
			"planning.saveChanges": "Save changes",
			"planning.serviceRoles": "Service roles",
			"planning.show": "Show",
			"planning.volunteerCount": {
				singular: "{count} volunteer",
				plural: "{count} volunteers",
			},
			"planning.applyChanges": "Apply changes",
			"planning.cancel": "Cancel",
			"planning.callDate": "Call date",
			"planning.callTimeChangeDescription":
				"Changing this asks every scheduled volunteer to confirm again.",
			"planning.callTime": "Call time",
			"planning.changeRole": "Change role",
			"planning.chooseVolunteer": "Choose a volunteer for {role}.",
			"planning.confirmVolunteerChanges": "Confirm volunteer changes",
			"planning.confirmVolunteerChangesDescription":
				"Choose how to handle volunteers affected by these service changes. Reassigned volunteers receive a new request to confirm.",
			"planning.dropFromService": "Drop from service",
			"planning.dropVolunteer": "Drop volunteer",
			"planning.dropVolunteerDescription":
				"{name} will be removed from the roster and their role will become available to fill.",
			"planning.dropVolunteerTitle": "Drop {name} from this service?",
			"planning.editTeamDescription":
				"Update the roles this team needs and its call time for this service.",
			"planning.findReplacement": "{role} · Find replacement",
			"planning.noAvailableVolunteers": "No available volunteers",
			"planning.noAvailableVolunteersDescription":
				"No available volunteers for {role} on this date. Adjust team membership or availability to schedule someone.",
			"planning.noVolunteerScheduled": "No volunteer scheduled yet.",
			"planning.roleFilled": "Role is filled",
			"planning.roleFilledDescription":
				"This role was filled while this window was open.",
			"planning.reassign": "Reassign",
			"planning.scheduleVolunteer": "Schedule volunteer",
			"planning.sendingRequest": "Sending request…",
			"planning.teamCallTimeChanged":
				"The call time changed. Every scheduled volunteer will receive a new request to confirm.",
			"planning.unableToSendRequest": "Unable to send request",
			"planning.useDifferentDay": "Use a different day",
			"planning.addRole": "Add role",
			"planning.unableToLoad":
				"Unable to load this schedule. Please try again.",
			"planning.volunteerDeclined": "{name} declined",
			"planning.volunteerCancelled": "{name} cancelled their assignment",
			"planning.volunteerAccepted": "Accepted",
			"planning.volunteerPending": "Pending",
			"volunteers.myServing": "My serving",
			"volunteers.myMinistries": "My ministries",
			"volunteers.noRequestsWaiting":
				"You have no requests waiting for a response.",
			"volunteers.allCampuses": "All campuses",
			"volunteers.allMyMinistries": "All my ministries",
			"volunteers.campus": "Campus",
			"volunteers.callTime": "Call time",
			"volunteers.availability": "Availability",
			"volunteers.decline": "Decline",
			"volunteers.mySchedule": "My schedule",
			"volunteers.eventStartsAt": "Event starts at",
			"volunteers.assignmentTiming": "{eventName} starts at {eventStartTime}.",
			"volunteers.assignmentArrivalTiming":
				"{eventName} starts at {eventStartTime}. Please arrive at {callTime}.",
			"volunteers.assignmentStartsAt": "starts at",
			"volunteers.pleaseArriveAt": "Please arrive at",
			"volunteers.assignmentActions": "Assignment actions",
			"volunteers.cancelAssignment": "Cancel assignment",
			"volunteers.cancelAssignmentFailed":
				"Your assignment could not be cancelled. Please try again.",
			"volunteers.noAssignments": "Nothing scheduled here",
			"volunteers.noAssignmentsDescription":
				"Try another campus or one of your ministries.",
			"volunteers.openRole": "Open role",
			"volunteers.requestResponseFailed":
				"Your response could not be saved. Please try again.",
			"volunteers.requests": "Requests",
			"volunteers.upcoming": "Upcoming",
			"volunteers.upcomingSchedule": "Upcoming schedule",
			"volunteers.upcomingScheduleDescription":
				"Your assignments, with the time you need to arrive first.",
			"volunteers.assignmentCount": {
				singular: "{count} assignment",
				plural: "{count} assignments",
			},
			"volunteers.assignment": "assignment",
			"volunteers.assignments": "assignments",
			"volunteers.volunteerRequest": "Volunteer request",
			"volunteers.respondToServiceRequest": "Respond to this service request.",
			"volunteers.responseNeeded": "Response needed",
			"welcome.eyebrow": "Church planning by Acts 2:44 Technology",
			"welcome.title": "Tools that help your church focus on ministry.",
			"welcome.description":
				"Porphyra brings service planning, volunteer coordination, team schedules, and campus operations together in one dependable platform.",
			"welcome.createAccount": "Create a free account",
			"welcome.openSource":
				"Free and open source. Built for churches of every size.",
			"welcome.madeFor": "Made for the people who make Sunday happen.",
			"welcome.madeForDescription":
				"We reduce administrative burden so staff and volunteers can serve people with more presence, care, and confidence.",
			"welcome.planTogether": "Plan together",
			"welcome.serveTogether": "Serve together",
			"welcome.stewardWisely": "Steward wisely",
		},
		// A deliberately sparse offline locale used by development and fixture tests.
		// Missing values resolve to the declared source locale.
		test: {},
	},
} as const satisfies TranslationCatalog;

export type PorphyraTranslationKey =
	keyof (typeof porphyraCatalog)["locales"]["en"];

export type PorphyraTranslation<K extends PorphyraTranslationKey> =
	(typeof porphyraCatalog)["locales"]["en"][K];

type TemplateValues<T extends string> =
	T extends `${string}{${infer Name}}${infer Rest}`
		? Name | TemplateValues<Rest>
		: never;

export type TranslationValueNames<T extends Translation> = T extends string
	? TemplateValues<T>
	: T extends PluralizedTranslation
		? TemplateValues<T["singular"]> | TemplateValues<T["plural"]>
		: never;

export type TranslationValuesFor<T extends Translation> = Readonly<{
	[Name in TranslationValueNames<T>]: string | number;
}>;
