import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react"

type ThemePreference = "dark" | "light" | "system"
type ResolvedTheme = Exclude<ThemePreference, "system">

type ThemeContextValue = {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

const storageKey = "porphyra-theme-preference"
const themeContext = createContext<ThemeContextValue | null>(null)

const getSystemTheme = (): ResolvedTheme => (
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
)

const resolveTheme = (preference: ThemePreference): ResolvedTheme => (
  preference === "system" ? getSystemTheme() : preference
)

const applyTheme = (theme: ResolvedTheme) => {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.style.colorScheme = theme
}

const getStoredPreference = (): ThemePreference => {
  const preference = localStorage.getItem(storageKey)
  return preference === "dark" || preference === "light" || preference === "system"
    ? preference
    : "system"
}

export const ThemeProvider = (props: PropsWithChildren) => {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(preference))

  useEffect(() => {
    const updateTheme = () => {
      const nextTheme = resolveTheme(preference)
      setResolvedTheme(nextTheme)
      applyTheme(nextTheme)
    }
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    updateTheme()
    mediaQuery.addEventListener("change", updateTheme)
    localStorage.setItem(storageKey, preference)

    return () => mediaQuery.removeEventListener("change", updateTheme)
  }, [preference])

  return <themeContext.Provider value={{ preference, resolvedTheme, setPreference }}>{props.children}</themeContext.Provider>
}

export const useTheme = () => {
  const theme = useContext(themeContext)
  if (theme === null) throw new Error("Theme context is unavailable")
  return theme
}

export const DevelopmentThemeSwitcher = () => {
  const { preference, resolvedTheme, setPreference } = useTheme()

  if (!import.meta.env.DEV) return null

  return (
    <div className="theme-switcher" aria-label="Development theme switcher">
      <span>Theme: {preference === "system" ? `System (${resolvedTheme})` : preference}</span>
      {(["light", "system", "dark"] as const).map(theme => (
        <button
          aria-pressed={preference === theme}
          className={preference === theme ? "theme-switcher-active" : ""}
          key={theme}
          onClick={() => setPreference(theme)}
          type="button"
        >
          {theme}
        </button>
      ))}
    </div>
  )
}
