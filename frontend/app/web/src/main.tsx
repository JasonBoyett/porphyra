import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Navigate,
  Outlet,
  RouterProvider,
  useNavigate,
} from "@tanstack/react-router"
import { createContext, useContext, useState } from "react"
import { createRoot } from "react-dom/client"
import { Heart, LogIn, MapPin, Music2, ShieldCheck, Users } from "lucide-react"
import "../../../lib/theme/globals.css"
import "./styles.css"
import { Button } from "./components/ui/button"
import { DevelopmentThemeSwitcher, ThemeProvider } from "./theme"

type Campus = { id: string; name: string; city: string }
type Team = { id: string; name: string }
type Ministry = { id: string; name: string; teams: Team[] }
type Church = {
  id: string
  name: string
  description: string
  campuses: Campus[]
  ministries: Ministry[]
}
type Dashboard = {
  viewer: { id: string; email: string; name: string }
  churches: Church[]
}
type AuthContextValue = {
  accessToken: string | null
  completeAuthentication: (accessToken: string) => void
  signOut: () => void
}

const queryClient = new QueryClient()
const authContext = createContext<AuthContextValue | null>(null)
const apiUrl = "http://localhost:8000"
const authUrl = "http://localhost:4000"

const getDashboard = async (accessToken: string): Promise<Dashboard> => {
  const response = await fetch(`${apiUrl}/api/v1/dashboard`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error("Unable to reach Porphyra API")
  return response.json() as Promise<Dashboard>
}

const useAuth = () => {
  const auth = useContext(authContext)
  if (auth === null) throw new Error("Authentication context is unavailable")
  return auth
}

const ConcernPanel = (props: { title: string; description: string }) => (
  <section className="concern-panel">
    <p className="eyebrow">Web workspace</p>
    <h2>{props.title}</h2>
    <p>{props.description}</p>
    <Button variant="secondary">Open {props.title}</Button>
  </section>
)

const DashboardView = () => {
  const { accessToken } = useAuth()
  if (accessToken === null) return <Navigate to="/sign-in" />

  const dashboard = useQuery({
    queryKey: ["dashboard", accessToken],
    queryFn: () => getDashboard(accessToken),
  })
  const churches = dashboard.data?.churches ?? []

  return (
    <div className="dashboard-shell" id="overview">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Good morning, {dashboard.data?.viewer.name ?? "friend"}</p>
          <h1>Serve your churches with clarity.</h1>
          <p>Choose a church below, or move between Planning, Volunteer, and Kiosk from the web workspace.</p>
        </div>
        <div className="role-list"><span>{churches.length} churches</span><span>Authenticated</span></div>
      </section>
      {dashboard.isLoading && <p>Loading churches…</p>}
      {dashboard.isError && <p className="error">The API is not running yet. Start it with <code>bun run dev</code>.</p>}
      <section className="church-grid">
        {churches.map(church => <article className="church-card" key={church.id}>
          <div className="church-avatar">▦</div>
          <div><p className="eyebrow">Church</p><h2>{church.name}</h2><p>{church.description}</p></div>
          <div className="campus-list">{church.campuses.map(campus => <span key={campus.id}><MapPin size={15} />{campus.name} · {campus.city}</span>)}</div>
          <div className="campus-list">{church.ministries.flatMap(ministry => ministry.teams.map(team => <span key={team.id}>{ministry.name} · {team.name}</span>))}</div>
        </article>)}
      </section>
    </div>
  )
}

const AppLayout = () => {
  const { accessToken, signOut } = useAuth()
  const navigate = useNavigate()

  if (accessToken === null) return <Navigate to="/sign-in" />

  const handleSignOut = () => {
    signOut()
    void navigate({ to: "/" })
  }

  return (
    <main>
      <header className="topbar">
        <Link className="brand" to="/app"><span>✦</span> Porphyra</Link>
        <nav aria-label="Application areas">
          <Link activeProps={{ className: "nav-active" }} to="/app">Overview</Link>
          <Link activeProps={{ className: "nav-active" }} to="/app/planning">Planning</Link>
          <Link activeProps={{ className: "nav-active" }} to="/app/volunteers">Volunteer</Link>
          <Link activeProps={{ className: "nav-active" }} to="/app/kiosk">Kiosk</Link>
        </nav>
        <button className="user-chip" onClick={handleSignOut}><span className="avatar">D</span> Sign out</button>
      </header>
      <Outlet />
    </main>
  )
}

const Welcome = () => {
  const navigate = useNavigate()

  return (
    <main className="welcome">
      <section className="welcome-copy">
        <p className="eyebrow">Church planning by Acts 2:44 Technology</p>
        <h1>Tools that help your church focus on ministry.</h1>
        <p className="lead">Porphyra brings service planning, volunteer coordination, team schedules, and campus operations together in one dependable platform.</p>
        <div className="cta-row">
          <Button onClick={() => void navigate({ to: "/sign-in" })}><LogIn size={18} /> Sign in</Button>
          <Button onClick={() => void navigate({ to: "/sign-in" })} variant="secondary">Create a free account</Button>
        </div>
        <p className="small">Free and open source. Built for churches of every size.</p>
      </section>
      <section className="mission-card"><div className="mission-icon"><Heart /></div><h2>Made for the people who make Sunday happen.</h2><p>We reduce administrative burden so staff and volunteers can serve people with more presence, care, and confidence.</p><div className="mission-grid"><span><Music2 /> Plan together</span><span><Users /> Serve together</span><span><ShieldCheck /> Steward wisely</span></div></section>
    </main>
  )
}

const AuthScreen = () => {
  const { completeAuthentication } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("dev@a244.tech")
  const [error, setError] = useState<string | null>(null)

  const signIn = async () => {
    setError(null)
    const response = await fetch(`${authUrl}/api/v1/auth/sign-in`, {
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    if (!response.ok) {
      setError("Unable to sign in. Please try again.")
      return
    }
    const data = await response.json() as { accessToken: string }
    completeAuthentication(data.accessToken)
    await navigate({ to: "/app" })
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <p className="eyebrow">Welcome to Porphyra</p>
        <h1>Sign in to serve your church.</h1>
        <p>Use the seeded development account to explore church, campus, ministry, and team workspaces.</p>
        <label>Email<input onChange={event => setEmail(event.target.value)} type="email" value={email} /></label>
        <label>Password<input defaultValue="password" type="password" /></label>
        {error && <p className="error">{error}</p>}
        <Button onClick={signIn}><LogIn size={18} /> Continue to Porphyra</Button>
        <button className="text-button" onClick={signIn}>Need an account? Create one</button>
      </section>
    </main>
  )
}

const rootRoute = createRootRoute({ component: Outlet })
const welcomeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Welcome })
const signInRoute = createRoute({ getParentRoute: () => rootRoute, path: "sign-in", component: AuthScreen })
const appRoute = createRoute({ getParentRoute: () => rootRoute, path: "app", component: AppLayout })
const appIndexRoute = createRoute({ getParentRoute: () => appRoute, path: "/", component: DashboardView })
const planningRoute = createRoute({ getParentRoute: () => appRoute, path: "planning", component: () => <ConcernPanel title="Planning" description="Prepare services, organize elements, and help every team arrive ready." /> })
const volunteerRoute = createRoute({ getParentRoute: () => appRoute, path: "volunteers", component: () => <ConcernPanel title="Volunteer" description="Coordinate teams and keep serving plans clear for every volunteer." /> })
const kioskRoute = createRoute({ getParentRoute: () => appRoute, path: "kiosk", component: () => <ConcernPanel title="Kiosk" description="Create welcoming, dependable on-site experiences for your campuses." /> })

const routeTree = rootRoute.addChildren([
  welcomeRoute,
  signInRoute,
  appRoute.addChildren([appIndexRoute, planningRoute, volunteerRoute, kioskRoute]),
])
const router = createRouter({ routeTree })

const Application = () => {
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem("porphyra-access-token"))
  const auth = {
    accessToken,
    completeAuthentication: (token: string) => {
      sessionStorage.setItem("porphyra-access-token", token)
      setAccessToken(token)
    },
    signOut: () => {
      sessionStorage.removeItem("porphyra-access-token")
      setAccessToken(null)
    },
  }

  return (
    <ThemeProvider>
      <authContext.Provider value={auth}><RouterProvider router={router} /></authContext.Provider>
      <DevelopmentThemeSwitcher />
    </ThemeProvider>
  )
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}><Application /></QueryClientProvider>,
)
