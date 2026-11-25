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
	resolve: (
		key: string,
		contextualId: string,
		values?: TranslationValues,
		pluralize?: boolean,
	) => ResolvedTranslation
	resolveShared: (key: string, values?: TranslationValues, pluralize?: boolean) => string
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
}>

export const TranslationProvider = ({
	catalog,
	children,
	identityStrategy = defaultIdentityStrategy,
}: TranslationProviderProps) => {
	const [activeLocale, setLocale] = useState(() =>
		selectLocale(catalog, typeof navigator === "undefined" ? [] : navigator.languages),
	)
	const supportedLocales = useMemo(() => Object.keys(catalog.locales), [catalog])
	const value = useMemo<TranslationContextValue>(
		() => ({
			activeLocale,
			catalog,
			createScopeIdentity: identityStrategy,
			resolve: (key, contextualId, values, pluralize) =>
				resolveTranslation(catalog, activeLocale, key, contextualId, values, pluralize),
			resolveShared: (key, values, pluralize) =>
				resolveSharedTranslation(catalog, activeLocale, key, values, pluralize),
			setLocale,
			sourceLocale: catalog.sourceLocale,
			supportedLocales,
		}),
		[activeLocale, catalog, identityStrategy, supportedLocales],
	)
	return <translationContext.Provider value={value}>{children}</translationContext.Provider>
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
	return { contextualId, ...translation.resolve(key, contextualId, values, pluralize) }
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

type LocalizationValuesProp<T extends PorphyraTranslation<PorphyraTranslationKey>> =
	[TranslationValueNames<T>] extends [never]
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
} &
	LocalizationValuesProp<PorphyraTranslation<K>> &
	PluralizationProp<PorphyraTranslation<K>>

export const Localized = <K extends PorphyraTranslationKey>(props: LocalizedProps<K>) => {
	const { asChild = false, children, pluralize = false, str, values } = props
	const { contextualId, presentation, text } = useLocalizedString(str, values, pluralize)
	if (asChild) {
		if (!isValidElement(children)) {
			throw new Error(
				`Localized "${str}" requires exactly one element child when asChild is enabled.`,
			)
		}
		const child = children as ReactElement<{
			"data-localization-id"?: string
			children?: ReactNode
			style?: CSSProperties
		}>
		return cloneElement(child, {
			"data-localization-id": contextualId,
			style: { ...child.props.style, ...presentation },
			children: text,
		})
	}

	if (presentation === undefined) return text
	return (
		<span data-localization-id={contextualId} style={presentation as CSSProperties | undefined}>
			{text}
		</span>
	)
}

export const SimpleLocalized = <K extends PorphyraTranslationKey>({
	str,
	values,
}: Pick<LocalizedProps<K>, "str" | "values">) => useSimpleLocalizedString(str, values)

export const DevelopmentLocaleSwitcher = () => {
	const { activeLocale, setLocale, supportedLocales } = useTranslation()
	const localeLabel = useSimpleLocalizedString("common.locale")
	if (!import.meta.env.DEV || supportedLocales.length < 2) return null
	return (
		<div
			aria-label="Development locale switcher"
			className="fixed bottom-4 right-4 z-20 flex items-center gap-1 rounded-full border border-[color:var(--porphyra-surface-border)] bg-card/92 p-1 text-xs shadow-md backdrop-blur-md"
		>
			<span className="px-2 text-muted-foreground">
				{localeLabel}: {activeLocale}
			</span>
			{supportedLocales.map((locale) => (
				<button
					aria-pressed={activeLocale === locale}
					className={`rounded-full px-2 py-1 font-bold ${activeLocale === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"}`}
					key={locale}
					onClick={() => setLocale(locale)}
					type="button"
				>
					{locale}
				</button>
			))}
		</div>
	)
}
