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
	return pluralize && values?.count !== 1 ? translation.plural : translation.singular;
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
			"common.signOut": "Sign out",
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
			"kiosk.title": "Kiosk",
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
			"planning.unableToLoad":
				"Unable to load this schedule. Please try again.",
			"planning.volunteerDeclined": "{name} declined",
			"planning.volunteerCancelled": "{name} cancelled their assignment",
			"volunteers.myServing": "My serving",
			"volunteers.myMinistries": "My ministries",
			"volunteers.allCampuses": "All campuses",
			"volunteers.allMyMinistries": "All my ministries",
			"volunteers.campus": "Campus",
			"volunteers.callTime": "Call time",
			"volunteers.eventStartsAt": "Event starts at",
			"volunteers.assignmentTiming": "{eventName} starts at {eventStartTime}.",
			"volunteers.assignmentArrivalTiming":
				"{eventName} starts at {eventStartTime}. Please arrive at {callTime}.",
			"volunteers.assignmentActions": "Assignment actions",
			"volunteers.cancelAssignment": "Cancel assignment",
			"volunteers.cancelAssignmentFailed":
				"Your assignment could not be cancelled. Please try again.",
			"volunteers.noAssignments": "Nothing scheduled here",
			"volunteers.noAssignmentsDescription":
				"Try another campus or one of your ministries.",
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
	T extends `${string}{${infer Name}}${infer Rest}` ? Name | TemplateValues<Rest> : never;

export type TranslationValueNames<T extends Translation> = T extends string
	? TemplateValues<T>
	: T extends PluralizedTranslation
		? TemplateValues<T["singular"]> | TemplateValues<T["plural"]>
		: never;

export type TranslationValuesFor<T extends Translation> = Readonly<{
	[Name in TranslationValueNames<T>]: string | number;
}>;
