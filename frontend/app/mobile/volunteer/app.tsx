import { MobileDashboard } from "@porphyra/mobile-lib"

export default function Application() {
  return <MobileDashboard concern={{
    accent: "primary",
    eyebrow: "Volunteer care",
    title: "Volunteer",
    description: "Keep serving schedules clear, personal, and dependable.",
    actions: ["View my schedule", "Update availability", "Explore teams"]
  }} />
}
