import { MobileDashboard } from "@porphyra/mobile-lib"

export default function Application() {
  return <MobileDashboard concern={{
    accent: "primary",
    eyebrow: "Campus hospitality",
    title: "Kiosk",
    description: "A welcoming, dependable launch point for on-site ministry.",
    actions: ["Start check-in", "Choose campus", "View today’s teams"]
  }} />
}
