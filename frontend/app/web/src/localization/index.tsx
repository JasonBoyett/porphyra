import {
	interpolate,
	type ContextualOverride,
	type PorphyraTranslationKey,
	type PorphyraTranslation,
	type PresentationOverride,
	type PluralizedTranslation,
	resolvePluralizedTranslation,
	type TranslationCatalog,
	type TranslationValues,
	type TranslationValuesFor,
	type TranslationValueNames,
} from "@porphyra/frontend/localization"
import {
	createContext,
	cloneElement,
	isValidElement,
	useContext,
	useMemo,
	useState,
	type CSSProperties,
	type PropsWithChildren,
	type ReactElement,
	type ReactNode,
} from "react"

export type IdentityStrategy = (input: { scopeName: string; testKey?: string }) => string

type TranslationContextValue = {
	activeLocale: string
	catalog: TranslationCatalog
	createScopeIdentity: IdentityStrategy
	isLocalizationInspectionEnabled: boolean
	isLocalizationTestEnabled: boolean
	resolve: (
		key: string,
		contextualId: string,
		values?: TranslationValues,
		pluralize?: boolean,
	) => ResolvedTranslation
	resolveShared: (key: string, values?: TranslationValues, pluralize?: boolean) => string
	setLocalizationInspectionEnabled: (enabled: boolean) => void
	setLocale: (locale: string) => void
	sourceLocale: string
	supportedLocales: readonly string[]
}

type ScopeContextValue = {
	scopeId: string
}

export type ResolvedTranslation = {
	presentation?: PresentationOverride
	text: string
}

const translationContext = createContext<TranslationContextValue | null>(null)
const localizationScopeContext = createContext<ScopeContextValue | null>(null)

const localizationInspectionStyle: CSSProperties = {
	backgroundColor: "#ffeb00",
	color: "#000",
	outline: "2px solid #f00",
	outlineOffset: "2px",
}

const computedTextInspectionStyle: CSSProperties = {
	backgroundColor: "#bdefff",
	color: "#000",
	outline: "2px dashed #006b8f",
	outlineOffset: "2px",
}

const localizedTestMarkerStyle: CSSProperties = {
	backgroundColor: "#d9f99d",
	color: "#14532d",
	outline: "2px solid #4d7c0f",
	outlineOffset: "2px",
}

const computedTextTestMarkerStyle: CSSProperties = {
	backgroundColor: "#bae6fd",
	color: "#0c4a6e",
	outline: "2px dashed #0369a1",
	outlineOffset: "2px",
}

/** The inherited color used to expose visible text that bypasses localization primitives. */
export const defaultLocalizationTestSentinelColor = "#d100d1"

/**
 * Enables a test-only visual audit for visible text. Text not rendered by an
 * approved localization primitive inherits the sentinel color; approved output
 * receives its own explicit marker style.
 */
export type LocalizationTestOptions = Readonly<{
	sentinelColor?: string
}>

const localizationTestStyles = (sentinelColor: string) => `
[data-localization-test-container="true"],
[data-localization-test-container="true"] * {
	color: ${sentinelColor} !important;
}

[data-localization-test-container="true"] [data-localization-kind="localized"],
[data-localization-test-container="true"] [data-localization-kind="localized"] * {
	color: #14532d !important;
}

[data-localization-test-container="true"] [data-localization-kind="computed"],
[data-localization-test-container="true"] [data-localization-kind="computed"] * {
	color: #0c4a6e !important;
}
`

export const createLocalizedElementId = (scopeId: string, key: string) => `${scopeId}:${key}`

export const defaultIdentityStrategy: IdentityStrategy = ({ scopeName, testKey }) => {
	if (testKey !== undefined)
		throw new Error("LocalizationScope testKey requires an injected test identity strategy.")
	return scopeName
}

export const createTestIdentityStrategy =
	(namespace = "test"): IdentityStrategy =>
	({ testKey }) => {
		if (testKey === undefined)
			throw new Error("LocalizationScope requires testKey when using this test identity strategy.")
		return `${namespace}:${testKey}`
	}

const selectLocale = (catalog: TranslationCatalog, preferredLocales: readonly string[]): string => {
	const supported = Object.keys(catalog.locales)
	for (const preferred of preferredLocales) {
		const normalized = preferred.toLowerCase()
		const exact = supported.find((locale) => locale.toLowerCase() === normalized)
		if (exact !== undefined) return exact
		const language = normalized.split("-")[0]
		const fallback = supported.find((locale) => locale.toLowerCase().split("-")[0] === language)
		if (fallback !== undefined) return fallback
	}
	return catalog.sourceLocale
}

export const resolveTranslation = (
	catalog: TranslationCatalog,
	locale: string,
	key: string,
	contextualId: string,
	values?: TranslationValues,
	pluralize = false,
): ResolvedTranslation => {
	const contextual: ContextualOverride | undefined = catalog.contextual?.[locale]?.[contextualId]
	const source = catalog.locales[catalog.sourceLocale]?.[key]
	if (source === undefined) throw new Error(`Unknown localization key "${key}".`)
	const translation = contextual?.text ?? catalog.locales[locale]?.[key] ?? source
	return {
		presentation: contextual?.presentation,
		text: interpolate(resolvePluralizedTranslation(translation, { pluralize, values }), values),
	}
}

export const resolveSharedTranslation = (
	catalog: TranslationCatalog,
	locale: string,
	key: string,
	values?: TranslationValues,
	pluralize = false,
): string => {
	const source = catalog.locales[catalog.sourceLocale]?.[key]
	if (source === undefined) throw new Error(`Unknown localization key "${key}".`)
	const translation = catalog.locales[locale]?.[key] ?? source
	return interpolate(resolvePluralizedTranslation(translation, { pluralize, values }), values)
}

export type TranslationProviderProps = PropsWithChildren<{
	catalog: TranslationCatalog
	identityStrategy?: IdentityStrategy
	initialLocalizationInspectionEnabled?: boolean
	localizationTest?: boolean | LocalizationTestOptions
}>

export const TranslationProvider = ({
	catalog,
	children,
	identityStrategy = defaultIdentityStrategy,
	initialLocalizationInspectionEnabled = false,
	localizationTest = false,
}: TranslationProviderProps) => {
	const [activeLocale, setLocale] = useState(() =>
		selectLocale(catalog, typeof navigator === "undefined" ? [] : navigator.languages),
	)
	const [isLocalizationInspectionEnabled, setLocalizationInspectionEnabled] = useState(
		initialLocalizationInspectionEnabled,
	)
	const isLocalizationTestEnabled = localizationTest !== false
	const localizationTestSentinelColor =
		typeof localizationTest === "object"
			? (localizationTest.sentinelColor ?? defaultLocalizationTestSentinelColor)
			: defaultLocalizationTestSentinelColor
	const supportedLocales = useMemo(() => Object.keys(catalog.locales), [catalog])
	const value = useMemo<TranslationContextValue>(
		() => ({
			activeLocale,
			catalog,
			createScopeIdentity: identityStrategy,
			isLocalizationInspectionEnabled,
			isLocalizationTestEnabled,
			resolve: (key, contextualId, values, pluralize) =>
				resolveTranslation(catalog, activeLocale, key, contextualId, values, pluralize),
			resolveShared: (key, values, pluralize) =>
				resolveSharedTranslation(catalog, activeLocale, key, values, pluralize),
			setLocalizationInspectionEnabled,
			setLocale,
			sourceLocale: catalog.sourceLocale,
			supportedLocales,
		}),
		[
			activeLocale,
			catalog,
			identityStrategy,
			isLocalizationInspectionEnabled,
			isLocalizationTestEnabled,
			supportedLocales,
		],
	)
	const content = isLocalizationTestEnabled ? (
		<>
			<style data-localization-test-styles="true">
				{localizationTestStyles(localizationTestSentinelColor)}
			</style>
			<span data-localization-test-container="true" style={{ display: "contents" }}>
				{children}
			</span>
		</>
	) : (
		children
	)
	return <translationContext.Provider value={value}>{content}</translationContext.Provider>
}

export const useTranslation = () => {
	const context = useContext(translationContext)
	if (context === null) throw new Error("TranslationProvider is required to use localization.")
	return context
}

export type LocalizationScopeProps = PropsWithChildren<{
	/** Stable, application-wide semantic name. Repeated instances intentionally share one ID. */
	name: string
	testKey?: string
}>

export const LocalizationScope = ({ children, name, testKey }: LocalizationScopeProps) => {
	const translation = useTranslation()
	if (name.trim() === "") {
		throw new Error("Localization scope names must not be empty.")
	}
	const scopeId = translation.createScopeIdentity({ scopeName: name, testKey })
	return (
		<localizationScopeContext.Provider value={{ scopeId }}>
			{children}
		</localizationScopeContext.Provider>
	)
}

export const useLocalizationScopeId = (): string => {
	const scope = useContext(localizationScopeContext)
	if (scope === null) throw new Error("A localization scope is required to read its identity.")
	return scope.scopeId
}

export const useLocalizedString = (
	key: PorphyraTranslationKey,
	values?: TranslationValues,
	pluralize = false,
) => {
	const translation = useTranslation()
	const scope = useContext(localizationScopeContext)
	if (scope === null) throw new Error(`Localized "${key}" requires an enclosing LocalizationScope.`)
	const contextualId = createLocalizedElementId(scope.scopeId, key)
	return {
		contextualId,
		isLocalizationInspectionEnabled: translation.isLocalizationInspectionEnabled,
		isLocalizationTestEnabled: translation.isLocalizationTestEnabled,
		...translation.resolve(key, contextualId, values, pluralize),
	}
}

/**
 * Resolves a shared catalog value without requiring a LocalizationScope.
 * Use this while a usage does not yet have a reliable contextual identity.
 */
export const useSimpleLocalizedString = (
	key: PorphyraTranslationKey,
	values?: TranslationValues,
	pluralize = false,
): string => useTranslation().resolveShared(key, values, pluralize)

type LocalizationValuesProp<T extends PorphyraTranslation<PorphyraTranslationKey>> = [
	TranslationValueNames<T>,
] extends [never]
	? { values?: never }
	: { values: TranslationValuesFor<T> }

type PluralizationProp<T extends PorphyraTranslation<PorphyraTranslationKey>> =
	T extends PluralizedTranslation ? { pluralize?: boolean } : { pluralize?: false | undefined }

export type LocalizedProps<K extends PorphyraTranslationKey> = {
	str: K
	/**
	 * Applies localization metadata and any presentation override directly to
	 * this element. This avoids a wrapper around existing interactive or layout
	 * elements.
	 */
	asChild?: boolean
	children?: ReactElement
} & LocalizationValuesProp<PorphyraTranslation<K>> &
	PluralizationProp<PorphyraTranslation<K>>

export const Localized = <K extends PorphyraTranslationKey>(props: LocalizedProps<K>) => {
	const { asChild = false, children, pluralize = false, str, values } = props
	const {
		contextualId,
		isLocalizationInspectionEnabled,
		isLocalizationTestEnabled,
		presentation,
		text,
	} = useLocalizedString(str, values, pluralize)
	const markerStyle = isLocalizationTestEnabled
		? localizedTestMarkerStyle
		: isLocalizationInspectionEnabled
			? localizationInspectionStyle
			: undefined
	if (asChild) {
		if (!isValidElement(children)) {
			throw new Error(
				`Localized "${str}" requires exactly one element child when asChild is enabled.`,
			)
		}
		const child = children as ReactElement<{
			"data-localization-id"?: string
			"data-localization-kind"?: string
			children?: ReactNode
			style?: CSSProperties
		}>
		return cloneElement(child, {
			"data-localization-id": contextualId,
			"data-localization-kind": "localized",
			style: { ...child.props.style, ...presentation, ...markerStyle },
			children: text,
		})
	}

	if (presentation === undefined && markerStyle === undefined) return text
	return (
		<span
			data-localization-id={contextualId}
			data-localization-kind="localized"
			style={{ ...presentation, ...markerStyle } as CSSProperties}
		>
			{text}
		</span>
	)
}

export type ComputedTextProps = Readonly<{
	value: string | number
}>

/**
 * Marks text computed from application data as intentional. It deliberately
 * accepts a value instead of children so arbitrary markup cannot bypass the
 * localization test audit.
 */
export const ComputedText = ({ value }: ComputedTextProps) => {
	const { isLocalizationInspectionEnabled, isLocalizationTestEnabled } = useTranslation()
	const markerStyle = isLocalizationTestEnabled
		? computedTextTestMarkerStyle
		: isLocalizationInspectionEnabled
			? computedTextInspectionStyle
			: undefined
	if (markerStyle === undefined) return value
	return (
		<span data-localization-kind="computed" style={markerStyle}>
			{value}
		</span>
	)
}

export const SimpleLocalized = <K extends PorphyraTranslationKey>({
	str,
	values,
}: Pick<LocalizedProps<K>, "str" | "values">) => useSimpleLocalizedString(str, values)

export const DevelopmentLocaleSwitcher = () => {
	const {
		activeLocale,
		isLocalizationInspectionEnabled,
		setLocale,
		setLocalizationInspectionEnabled,
		supportedLocales,
	} = useTranslation()
	if (!import.meta.env.DEV || supportedLocales.length < 2) return null
	return (
		<div
			aria-label="Development locale switcher"
			className="fixed bottom-4 right-4 z-20 flex items-center gap-1 rounded-full border border-[color:var(--porphyra-surface-border)] bg-card/92 p-1 text-xs shadow-md backdrop-blur-md"
		>
			<span className="px-2 text-muted-foreground">
				<Localized str="common.locale" />
				<ComputedText value={`: ${activeLocale}`} />
			</span>
			{supportedLocales.map((locale) => (
				<button
					aria-pressed={activeLocale === locale}
					className={`rounded-full px-2 py-1 font-bold ${activeLocale === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"}`}
					key={locale}
					onClick={() => setLocale(locale)}
					type="button"
				>
					<ComputedText value={locale} />
				</button>
			))}
			<button
				aria-pressed={isLocalizationInspectionEnabled}
				className={`rounded-full px-2 py-1 font-bold ${isLocalizationInspectionEnabled ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"}`}
				onClick={() => setLocalizationInspectionEnabled(!isLocalizationInspectionEnabled)}
				type="button"
			>
				<Localized str="common.inspectStrings" />
			</button>
		</div>
	)
}
