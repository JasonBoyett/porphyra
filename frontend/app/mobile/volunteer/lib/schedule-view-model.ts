export type Campus = {
  id: string
  label: string
}

export type VolunteerAssignment = {
  id: string
  dateLabel: string
  dayOfWeek: string
  month: string
  day: string
  campusId: Campus["id"]
  ministry: string
  team: string
  eventName: string
  location: string
  callTime?: string
  eventStartTime: string
  note?: string
}

export type VolunteerSchedule = {
  volunteer: { firstName: string; initials: string; avatarUrl: string }
  campuses: readonly Campus[]
  ministries: readonly string[]
  assignments: readonly VolunteerAssignment[]
}

// Local view-model data until the mobile app has a shared schedule API client.
// Keep this shape presentation-focused so an API adapter can replace it directly.
export const devVolunteerSchedule: VolunteerSchedule = {
  volunteer: {
    firstName: "Dev",
    initials: "DB",
    avatarUrl: "https://api.dicebear.com/10.x/clay/svg?seed=development%3Adev%40a244.tech",
  },
  campuses: [
    { id: "downtown", label: "Grace Harbor Church — Downtown" },
  ],
  ministries: ["Music", "Kids"],
  assignments: [
    {
      id: "sunday-worship-band",
      dateLabel: "Sunday, November 15",
      dayOfWeek: "SUN",
      month: "NOV",
      day: "15",
      campusId: "downtown",
      ministry: "Music",
      team: "Band",
      eventName: "Sunday Worship Service",
      location: "Downtown",
      callTime: "7:30 AM",
      eventStartTime: "9:00 AM",
      note: "Meet in the green room for soundcheck.",
    },
    {
      id: "sunday-worship-fourth-grade",
      dateLabel: "Sunday, November 15",
      dayOfWeek: "SUN",
      month: "NOV",
      day: "15",
      campusId: "downtown",
      ministry: "Kids",
      team: "Fourth Grade",
      eventName: "Sunday Worship Service",
      location: "Downtown",
      eventStartTime: "9:00 AM",
      note: "Review the lesson and prepare activity supplies.",
    },
  ],
}
