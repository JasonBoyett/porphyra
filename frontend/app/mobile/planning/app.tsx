import { MobileDashboard } from "@porphyra/mobile-lib"

export default function Application() {
  return <MobileDashboard concern={{
    accent: "primary",
    eyebrow: "Service planning",
    title: "Planning",
    description: "Prepare meaningful services and help every team arrive ready.",
    actions: ["Create a service plan", "View this Sunday", "Browse teams"]
  }} />
}
