import { useMemo, useState } from "react"
import { Modal, Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"

type ScheduleFilter = "all" | "attention" | "confirmed" | "my-teams"
type ConfirmationState = "confirmed" | "needs-attention"

type Campus = {
  id: string
  churchName: string
  campusName: string
}

type Volunteer = {
  name: string
  email: string
}

type PlannedTeam = {
  id: string
  campusId: string
  ministry: string
  team: string
  callTime: string | null
  notes: string
  assignedVolunteer: Volunteer | null
  confirmation: ConfirmationState
  isMyTeam: boolean
}

const campuses: readonly Campus[] = [
  { id: "downtown", churchName: "Grace Harbor Church", campusName: "Downtown" },
]

const devVolunteer: Volunteer = { name: "A2:44 Tech", email: "dev@a244.tech" }
const eventStartLabel = "Event start 9:00 AM"

const plannedTeams: readonly PlannedTeam[] = [
  { id: "band", campusId: "downtown", ministry: "Music", team: "Band", callTime: "Call time 7:30 AM", notes: "Meet in the green room for soundcheck.", assignedVolunteer: devVolunteer, confirmation: "needs-attention", isMyTeam: true },
  { id: "choir", campusId: "downtown", ministry: "Music", team: "Choir", callTime: "Call time 8:00 AM", notes: "Warm up in the choir room before soundcheck.", assignedVolunteer: null, confirmation: "needs-attention", isMyTeam: false },
  { id: "toddlers", campusId: "downtown", ministry: "Kids", team: "Toddlers", callTime: "Call time 8:15 AM", notes: "Prepare the toddler room before families arrive.", assignedVolunteer: null, confirmation: "needs-attention", isMyTeam: false },
  { id: "fourth-grade", campusId: "downtown", ministry: "Kids", team: "Fourth Grade", callTime: null, notes: "Review the lesson and prepare activity supplies.", assignedVolunteer: devVolunteer, confirmation: "needs-attention", isMyTeam: true },
]

const filters: readonly { id: ScheduleFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "attention", label: "Needs attention" },
  { id: "confirmed", label: "Confirmed" },
  { id: "my-teams", label: "My teams" },
]

function ChoiceChip(props: { label: string; selected: boolean; onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable
      accessibilityLabel={props.accessibilityLabel ?? props.label}
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected }}
      className={`mr-2 rounded-full border px-4 py-2.5 ${props.selected ? "border-primary bg-primary" : "border-border bg-card"}`}
      onPress={props.onPress}
    >
      <Text className={`font-semibold ${props.selected ? "text-primary-foreground" : "text-foreground"}`}>{props.label}</Text>
    </Pressable>
  )
}

function FilterDropdown(props: { label: string; value: string; expanded: boolean; onPress: () => void }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-foreground">{props.label}</Text>
      <Pressable
        accessibilityHint={`Opens ${props.label.toLowerCase()} options`}
        accessibilityLabel={`${props.label}: ${props.value}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: props.expanded }}
        className="flex-row items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5"
        onPress={props.onPress}
      >
        <Text className="flex-1 font-semibold text-foreground">{props.value}</Text>
        <Text accessibilityElementsHidden className="ml-3 text-lg text-muted-foreground">⌄</Text>
      </Pressable>
    </View>
  )
}

function DropdownPopover(props: { title: string; options: readonly string[]; selected: string; visible: boolean; onClose: () => void; onSelect: (option: string) => void }) {
  return (
    <Modal animationType="fade" onRequestClose={props.onClose} transparent visible={props.visible}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable accessibilityLabel={`Close ${props.title} options`} className="flex-1" onPress={props.onClose} />
        <View accessibilityViewIsModal className="rounded-t-3xl bg-background px-5 pb-10 pt-6">
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">Select {props.title}</Text>
            <Pressable accessibilityLabel={`Close ${props.title} options`} accessibilityRole="button" className="rounded-full bg-secondary px-3 py-2" onPress={props.onClose}><Text className="font-bold text-foreground">Done</Text></Pressable>
          </View>
          {props.options.map((option) => {
            const selected = option === props.selected
            return <Pressable accessibilityRole="button" accessibilityState={{ selected }} className={`mb-2 rounded-xl border px-4 py-4 ${selected ? "border-primary bg-primary/10" : "border-border bg-card"}`} key={option} onPress={() => props.onSelect(option)}><Text className={`font-semibold ${selected ? "text-primary" : "text-foreground"}`}>{option}</Text></Pressable>
          })}
        </View>
      </View>
    </Modal>
  )
}

function ScheduleVolunteerModal(props: { team: PlannedTeam | undefined; visible: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!props.team) return null

  const scheduleTime = props.team.callTime ?? eventStartLabel
  return (
    <Modal animationType="slide" onRequestClose={props.onClose} transparent visible={props.visible}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable accessibilityLabel="Close volunteer scheduling" className="flex-1" onPress={props.onClose} />
        <View accessibilityViewIsModal className="rounded-t-3xl bg-background px-5 pb-10 pt-6">
          <Text className="text-xs font-bold uppercase tracking-widest text-primary">Schedule volunteer</Text>
          <Text className="mt-1 text-2xl font-bold text-foreground">{props.team.team}</Text>
          <Text className="mt-1 text-muted-foreground">{props.team.ministry} · {scheduleTime}</Text>
          <View className="mt-5 rounded-2xl bg-secondary p-4">
            <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Volunteer to assign</Text>
            <Text className="mt-1 font-bold text-foreground">{devVolunteer.name}</Text>
            <Text className="text-sm text-muted-foreground">{devVolunteer.email}</Text>
          </View>
          <Pressable accessibilityHint={`Assigns ${devVolunteer.name} to ${props.team.team}`} accessibilityLabel={`Assign ${devVolunteer.name} to ${props.team.team}`} className="mt-5 rounded-xl bg-primary px-4 py-4" onPress={props.onConfirm}><Text className="text-center font-bold text-primary-foreground">Assign {devVolunteer.name}</Text></Pressable>
          <Pressable accessibilityLabel="Cancel volunteer scheduling" className="mt-2 rounded-xl px-4 py-4" onPress={props.onClose}><Text className="text-center font-bold text-foreground">Cancel</Text></Pressable>
        </View>
      </View>
    </Modal>
  )
}

export default function Application() {
  const [campusId, setCampusId] = useState(campuses[0].id)
  const [ministry, setMinistry] = useState("All ministries")
  const [filter, setFilter] = useState<ScheduleFilter>("all")
  const [confirmationByTeam, setConfirmationByTeam] = useState<Record<string, ConfirmationState>>({})
  const [assignmentByTeam, setAssignmentByTeam] = useState<Record<string, Volunteer | null>>(() => Object.fromEntries(plannedTeams.map((team) => [team.id, team.assignedVolunteer])) as Record<string, Volunteer | null>)
  const [openDropdown, setOpenDropdown] = useState<"campus" | "ministry" | null>(null)
  const [teamToScheduleId, setTeamToScheduleId] = useState<string | null>(null)

  const campusTeams = useMemo(
    () => plannedTeams.filter((team) => team.campusId === campusId),
    [campusId],
  )
  const ministries = useMemo(
    () => ["All ministries", ...Array.from(new Set(campusTeams.map((team) => team.ministry)))],
    [campusTeams],
  )
  const visibleTeams = useMemo(() => campusTeams.filter((team) => {
    const confirmation = confirmationByTeam[team.id] ?? team.confirmation
    return (ministry === "All ministries" || team.ministry === ministry)
      && (filter === "all" || (filter === "attention" && confirmation === "needs-attention") || (filter === "confirmed" && confirmation === "confirmed") || (filter === "my-teams" && team.isMyTeam))
  }), [campusTeams, confirmationByTeam, filter, ministry])
  const teamsByMinistry = useMemo(() => ministries.slice(1).map((name) => ({ name, teams: visibleTeams.filter((team) => team.ministry === name) })).filter((group) => group.teams.length > 0), [ministries, visibleTeams])

  const changeCampus = (nextCampusId: string) => {
    setCampusId(nextCampusId)
    setMinistry("All ministries")
  }
  const toggleConfirmation = (team: PlannedTeam) => {
    const current = confirmationByTeam[team.id] ?? team.confirmation
    setConfirmationByTeam((states) => ({ ...states, [team.id]: current === "confirmed" ? "needs-attention" : "confirmed" }))
  }
  const selectedCampus = campuses.find((campus) => campus.id === campusId) ?? campuses[0]
  const campusLabel = `${selectedCampus.churchName} — ${selectedCampus.campusName}`
  const campusOptions = campuses.map((campus) => `${campus.churchName} — ${campus.campusName}`)

  const selectCampus = (option: string) => {
    const campus = campuses.find((item) => `${item.churchName} — ${item.campusName}` === option)
    if (campus) changeCampus(campus.id)
    setOpenDropdown(null)
  }
  const teamToSchedule = plannedTeams.find((team) => team.id === teamToScheduleId)
  const scheduleVolunteer = () => {
    if (!teamToSchedule) return
    setAssignmentByTeam((assignments) => ({ ...assignments, [teamToSchedule.id]: devVolunteer }))
    setTeamToScheduleId(null)
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView className="flex-1" contentContainerClassName="pb-12" showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-5 pt-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-primary">Service planning</Text>
          <Text className="mt-1 text-3xl font-bold text-foreground">Sunday Worship Service</Text>
          <Text className="mt-2 leading-6 text-muted-foreground">November 15 · Event start 9:00 AM</Text>
        </View>

        <View className="mb-2 px-5">
          <FilterDropdown expanded={openDropdown === "campus"} label="Campus" value={campusLabel} onPress={() => setOpenDropdown("campus")} />
          <FilterDropdown expanded={openDropdown === "ministry"} label="Ministry" value={ministry} onPress={() => setOpenDropdown("ministry")} />
        </View>

        <View className="mb-6">
          <Text className="mb-2 px-5 text-sm font-bold text-foreground">Show</Text>
          <ScrollView horizontal contentContainerClassName="px-5" showsHorizontalScrollIndicator={false}>
            {filters.map((item) => <ChoiceChip key={item.id} label={item.label} selected={item.id === filter} onPress={() => setFilter(item.id)} accessibilityLabel={`Show ${item.label.toLowerCase()} teams`} />)}
          </ScrollView>
        </View>

        <View className="px-5">
          <Text accessibilityLiveRegion="polite" className="mb-4 text-sm text-muted-foreground">{visibleTeams.length} planned {visibleTeams.length === 1 ? "team" : "teams"}</Text>
          {teamsByMinistry.map((group) => (
            <View className="mb-7" key={group.name}>
              <Text className="mb-3 text-xl font-bold text-foreground">{group.name}</Text>
              {group.teams.map((team) => {
                const confirmation = confirmationByTeam[team.id] ?? team.confirmation
                const needsAttention = confirmation === "needs-attention"
                const scheduleTime = team.callTime ?? eventStartLabel
                const assignedVolunteer = assignmentByTeam[team.id]
                return (
                  <View accessibilityLabel={`${team.team}, ${needsAttention ? "unconfirmed" : "confirmed"}`} className="mb-3 rounded-2xl border border-border bg-card p-5" key={team.id}>
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1"><Text className="text-lg font-bold text-foreground">{team.team}</Text><Text className="mt-1 font-semibold text-primary">{scheduleTime}</Text></View>
                      <View className={`rounded-full px-3 py-1 ${needsAttention ? "bg-destructive/10" : "bg-primary/10"}`}><Text className={`text-xs font-bold ${needsAttention ? "text-destructive" : "text-primary"}`}>{needsAttention ? "Unconfirmed" : "Confirmed"}</Text></View>
                    </View>
                    <Text className="mt-3 leading-5 text-muted-foreground">{team.notes}</Text>
                    <View className="mt-4 border-t border-border pt-4">
                      <View className="mb-2 flex-row items-center justify-between"><Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Roster</Text><Text className="text-xs font-semibold text-muted-foreground">{assignedVolunteer ? "1 volunteer" : "0 volunteers"}</Text></View>
                      {assignedVolunteer ? <View className="rounded-xl bg-secondary px-3 py-3"><Text className="font-semibold text-foreground">{assignedVolunteer.name}</Text><Text className="mt-0.5 text-sm text-muted-foreground">{assignedVolunteer.email}</Text></View> : <Text className="text-sm text-muted-foreground">No volunteer scheduled yet.</Text>}
                    </View>
                    {!assignedVolunteer && <Pressable accessibilityHint={`Opens scheduling for ${team.team}`} accessibilityLabel={`Schedule a volunteer for ${team.team}`} className="mt-4 rounded-xl border border-primary px-4 py-3" onPress={() => setTeamToScheduleId(team.id)}><Text className="text-center font-bold text-primary">Schedule volunteer</Text></Pressable>}
                    <Pressable accessibilityHint="Updates this team's confirmation status for this session" accessibilityLabel={`${needsAttention ? "Mark" : "Mark as needing"} ${team.team} ${needsAttention ? "confirmed" : "attention"}`} className={`mt-4 rounded-xl px-4 py-3 ${needsAttention ? "bg-primary" : "bg-secondary"}`} onPress={() => toggleConfirmation(team)}><Text className={`text-center font-bold ${needsAttention ? "text-primary-foreground" : "text-foreground"}`}>{needsAttention ? "Mark confirmed" : "Needs follow-up"}</Text></Pressable>
                  </View>
                )
              })}
            </View>
          ))}
          {teamsByMinistry.length === 0 && <View className="rounded-2xl bg-secondary p-5"><Text className="text-lg font-bold text-foreground">No teams match these filters</Text><Text className="mt-1 leading-6 text-muted-foreground">Try a different ministry or schedule view.</Text></View>}
        </View>
      </ScrollView>
      <DropdownPopover options={campusOptions} selected={campusLabel} title="campus" visible={openDropdown === "campus"} onClose={() => setOpenDropdown(null)} onSelect={selectCampus} />
      <DropdownPopover options={ministries} selected={ministry} title="ministry" visible={openDropdown === "ministry"} onClose={() => setOpenDropdown(null)} onSelect={(name) => { setMinistry(name); setOpenDropdown(null) }} />
      <ScheduleVolunteerModal team={teamToSchedule} visible={teamToScheduleId !== null} onClose={() => setTeamToScheduleId(null)} onConfirm={scheduleVolunteer} />
    </SafeAreaView>
  )
}
