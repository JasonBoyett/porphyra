import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { Heart, LogIn, MapPin, Music2, ShieldCheck, Users } from "lucide-react"
import { useState } from "react"
import { createRoot } from "react-dom/client"
import "../../../lib/theme/globals.css"
import "./styles.css"
import { Button } from "./components/ui/button"

type Campus = { id: string; name: string; city: string }
type Organization = { id: string; name: string; description: string; campuses: Campus[] }
type Dashboard = { viewer: { email: string; roles: string[] }; organizations: Organization[] }

const queryClient = new QueryClient()
const apiUrl = "http://localhost:8000"

const getDashboard = async (): Promise<Dashboard> => {
  const response = await fetch(`${apiUrl}/api/v1/dashboard`)
  if (!response.ok) throw new Error("Unable to reach Porphyra API")
  return response.json() as Promise<Dashboard>
}

const ConcernPanel = (props: { concern: string; title: string; description: string }) => (
  <section className="concern-panel" id={props.concern.toLowerCase()}>
    <p className="eyebrow">Web workspace</p>
    <h2>{props.title}</h2>
    <p>{props.description}</p>
    <Button variant="secondary">Open {props.title}</Button>
  </section>
)

const DashboardView = () => {
  const [concern, setConcern] = useState("Overview")
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard })
  const organizations = dashboard.data?.organizations ?? []

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#overview"><span>✦</span> Porphyra</a>
        <nav aria-label="Application areas">
          {["Overview", "Planning", "Volunteer", "Kiosk"].map((item) => (
            <button className={concern === item ? "nav-active" : ""} key={item} onClick={() => setConcern(item)}>{item}</button>
          ))}
        </nav>
        <div className="user-chip"><span className="avatar">D</span> dev@a244.tech</div>
      </header>
      <div className="dashboard-shell" id="overview">
        <section className="dashboard-hero">
          <div><p className="eyebrow">Good morning, A2:44 Tech</p><h1>Serve your churches with clarity.</h1><p>Choose a church below, or move between Planning, Volunteer, and Kiosk from the web workspace.</p></div>
          <div className="role-list">{["Administrator", "Volunteer", "Member"].map(role => <span key={role}>{role}</span>)}</div>
        </section>
        {dashboard.isLoading && <p>Loading churches…</p>}
        {dashboard.isError && <p className="error">The API is not running yet. Start it with <code>bun run dev:api</code>.</p>}
        <section className="church-grid">
          {organizations.map((organization) => <article className="church-card" key={organization.id}>
            <div className="church-avatar">▦</div><div><p className="eyebrow">Church</p><h2>{organization.name}</h2><p>{organization.description}</p></div>
            <div className="campus-list">{organization.campuses.map(campus => <span key={campus.id}><MapPin size={15}/>{campus.name} · {campus.city}</span>)}</div>
          </article>)}
        </section>
        {concern === "Planning" && <ConcernPanel concern="planning" title="Planning" description="Prepare services, organize elements, and help every team arrive ready." />}
        {concern === "Volunteer" && <ConcernPanel concern="volunteer" title="Volunteer" description="Coordinate teams and keep serving plans clear for every volunteer." />}
        {concern === "Kiosk" && <ConcernPanel concern="kiosk" title="Kiosk" description="Create welcoming, dependable on-site experiences for your campuses." />}
      </div>
    </main>
  )
}

const Welcome = (props: { onAuthenticate: () => void }) => (
  <main className="welcome">
    <section className="welcome-copy">
      <p className="eyebrow">Church planning by Acts 2:44 Technology</p>
      <h1>Tools that help your church focus on ministry.</h1>
      <p className="lead">Porphyra brings service planning, volunteer coordination, team schedules, and campus operations together in one dependable platform.</p>
      <div className="cta-row"><Button onClick={props.onAuthenticate}><LogIn size={18}/> Sign in</Button><Button variant="secondary" onClick={props.onAuthenticate}>Create a free account</Button></div>
      <p className="small">Free and open source. Built for churches of every size.</p>
    </section>
    <section className="mission-card"><div className="mission-icon"><Heart /></div><h2>Made for the people who make Sunday happen.</h2><p>We reduce administrative burden so staff and volunteers can serve people with more presence, care, and confidence.</p><div className="mission-grid"><span><Music2/> Plan together</span><span><Users/> Serve together</span><span><ShieldCheck/> Steward wisely</span></div></section>
  </main>
)

const AuthScreen = (props: { onComplete: () => void }) => (
  <main className="auth-screen">
    <section className="auth-card">
      <p className="eyebrow">Welcome to Porphyra</p>
      <h1>Sign in to serve your church.</h1>
      <p>Use the seeded development account to explore organization, campus, and team workspaces.</p>
      <label>Email<input defaultValue="dev@a244.tech" type="email" /></label>
      <label>Password<input defaultValue="password" type="password" /></label>
      <Button onClick={props.onComplete}><LogIn size={18}/> Continue to Porphyra</Button>
      <button className="text-button" onClick={props.onComplete}>Need an account? Create one</button>
    </section>
  </main>
)

const Application = () => {
  const [screen, setScreen] = useState<"welcome" | "auth" | "dashboard">("welcome")
  if (screen === "dashboard") return <DashboardView />
  if (screen === "auth") return <AuthScreen onComplete={() => setScreen("dashboard")} />
  return <Welcome onAuthenticate={() => setScreen("auth")} />
}

createRoot(document.getElementById("root")!).render(<QueryClientProvider client={queryClient}><Application /></QueryClientProvider>)
