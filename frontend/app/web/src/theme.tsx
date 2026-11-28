import { ThemeProvider as NextThemeProvider, useTheme, type ThemeProviderProps } from "next-themes"

const storageKey = "porphyra-theme-preference"

export const ThemeProvider = (props: ThemeProviderProps) => (
	<NextThemeProvider
		attribute="class"
		defaultTheme="system"
		disableTransitionOnChange
		enableColorScheme
		enableSystem
		storageKey={storageKey}
		{...props}
	/>
)

export const DevelopmentThemeSwitcher = () => {
	const { resolvedTheme, setTheme, theme = "system" } = useTheme()

	if (!import.meta.env.DEV) return null

	return (
		<div
			aria-label="Development theme switcher"
			className="fixed bottom-4 left-4 z-20 flex items-center gap-1 rounded-full border border-[color:var(--porphyra-surface-border)] bg-card/92 p-1 text-xs shadow-md backdrop-blur-md"
		>
			<span className="px-2 text-muted-foreground">
				Theme: {theme === "system" ? `System (${resolvedTheme ?? "light"})` : theme}
			</span>
			{(["light", "system", "dark"] as const).map((nextTheme) => (
				<button
					aria-pressed={theme === nextTheme}
					className={`rounded-full px-2 py-1 font-bold capitalize ${theme === nextTheme ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"}`}
					key={nextTheme}
					onClick={() => setTheme(nextTheme)}
					type="button"
				>
					{nextTheme}
				</button>
			))}
		</div>
	)
}
