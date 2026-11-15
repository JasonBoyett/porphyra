import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native"
import { devVolunteerSchedule, type VolunteerAssignment } from "./lib/schedule-view-model"

const ALL_CAMPUSES = "All campuses"
const ALL_MINISTRIES = "All my ministries"

type FilterOption = { value: string; label: string }

function FilterDropdown(props: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={`Opens the ${props.label.toLowerCase()} filter`}
      className="mt-2 flex-row items-center justify-between rounded-2xl border border-border bg-background px-4 py-3.5"
      onPress={props.onPress}
    >
      <Text className="flex-1 pr-3 text-sm font-semibold text-foreground" numberOfLines={1}>{props.value}</Text>
      <Text accessibilityElementsHidden className="text-lg font-bold text-primary">⌄</Text>
    </Pressable>
  )
}

function FilterMenu(props: { title: string; options: readonly FilterOption[]; selectedValue: string; onSelect: (value: string) => void; onClose: () => void }) {
  return (
    <Modal animationType="fade" transparent visible onRequestClose={props.onClose}>
      <View className="flex-1 justify-center bg-foreground/30 px-5">
        <Pressable accessibilityRole="button" accessibilityLabel="Close filter" className="absolute inset-0" onPress={props.onClose} />
        <View accessibilityViewIsModal className="overflow-hidden rounded-3xl bg-card shadow-xl">
          <View className="flex-row items-center justify-between border-b border-border px-5 py-5">
            <Text className="text-xl font-bold text-foreground">{props.title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" className="h-9 w-9 items-center justify-center rounded-full bg-muted" onPress={props.onClose}>
              <Text className="text-lg font-bold text-muted-foreground">×</Text>
            </Pressable>
          </View>
          <View className="p-2">
            {props.options.map((option) => {
              const selected = option.value === props.selectedValue
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={`flex-row items-center justify-between rounded-2xl px-4 py-4 ${selected ? "bg-primary/10" : "bg-card"}`}
                  key={option.value}
                  onPress={() => props.onSelect(option.value)}
                >
                  <Text className={`flex-1 pr-4 font-semibold ${selected ? "text-primary" : "text-foreground"}`}>{option.label}</Text>
                  {selected ? <Text accessibilityLabel="Selected" className="text-lg font-bold text-primary">✓</Text> : null}
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>
    </Modal>
  )
}

function AssignmentCard(props: { assignment: VolunteerAssignment }) {
  const { assignment } = props
  const timeLabel = assignment.callTime ? "Call time" : "Event start"
  const primaryTime = assignment.callTime ?? assignment.eventStartTime

  return (
    <View className="mb-4 flex-row overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <View className="w-20 items-center bg-muted px-2 py-5">
        <Text className="text-[10px] font-bold tracking-widest text-primary">{assignment.dayOfWeek}</Text>
        <Text className="mt-1 text-xs font-bold text-muted-foreground">{assignment.month}</Text>
        <Text className="text-3xl font-bold text-foreground">{assignment.day}</Text>
      </View>
      <View className="flex-1 p-5">
        <View className="mb-4 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-primary">{assignment.ministry}</Text>
            <Text className="mt-1 text-xl font-bold text-foreground">{assignment.team}</Text>
          </View>
          <View className="rounded-2xl bg-primary/10 px-3 py-2">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-primary">{timeLabel}</Text>
            <Text className="mt-0.5 text-lg font-bold text-primary">{primaryTime}</Text>
          </View>
        </View>
        <View className="border-t border-border pt-3">
          <Text className="font-semibold text-foreground">{assignment.eventName}</Text>
          <Text className="mt-1 text-sm text-muted-foreground">{assignment.location} · Starts {assignment.eventStartTime}</Text>
          {assignment.note ? <Text className="mt-3 text-sm leading-5 text-muted-foreground">{assignment.note}</Text> : null}
        </View>
      </View>
    </View>
  )
}

export default function Application() {
  const [campus, setCampus] = useState(ALL_CAMPUSES)
  const [ministry, setMinistry] = useState(ALL_MINISTRIES)
  const [openFilter, setOpenFilter] = useState<"campus" | "ministry" | null>(null)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const schedule = devVolunteerSchedule

  const campusOptions: readonly FilterOption[] = [
    { value: ALL_CAMPUSES, label: ALL_CAMPUSES },
    ...schedule.campuses.map((item) => ({ value: item.id, label: item.label })),
  ]
  const ministryOptions: readonly FilterOption[] = [
    { value: ALL_MINISTRIES, label: ALL_MINISTRIES },
    ...schedule.ministries.map((item) => ({ value: item, label: item })),
  ]
  const campusLabel = campusOptions.find((option) => option.value === campus)?.label ?? ALL_CAMPUSES

  const assignments = useMemo(() => schedule.assignments.filter((assignment) => {
    const matchesCampus = campus === ALL_CAMPUSES || assignment.campusId === campus
    const matchesMinistry = ministry === ALL_MINISTRIES || assignment.ministry === ministry
    return matchesCampus && matchesMinistry
  }), [campus, ministry, schedule.assignments])

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView className="flex-1" contentContainerClassName="pb-12" showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-6 pt-16">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold uppercase tracking-widest text-primary">My serving</Text>
              <Text className="mt-1 text-3xl font-bold text-foreground">Hi, {schedule.volunteer.firstName}.</Text>
            </View>
            {avatarFailed ? (
              <View accessibilityLabel={`${schedule.volunteer.firstName}'s profile photo is unavailable`} accessible className="h-11 w-11 items-center justify-center rounded-full bg-primary">
                <Text accessible={false} className="font-bold text-primary-foreground">{schedule.volunteer.initials}</Text>
              </View>
            ) : (
              <Image
                accessibilityLabel={`${schedule.volunteer.firstName}'s profile photo`}
                accessible
                className="h-11 w-11 rounded-full bg-muted"
                onError={() => setAvatarFailed(true)}
                source={{ uri: schedule.volunteer.avatarUrl }}
              />
            )}
          </View>
          <Text className="mt-3 text-base leading-6 text-muted-foreground">Your upcoming assignments, with the time you need to arrive first.</Text>
        </View>

        <View className="border-y border-border bg-card py-4">
          <View className="px-5">
            <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Campus</Text>
            <FilterDropdown label="Campus" value={campusLabel} onPress={() => setOpenFilter("campus")} />
            <Text className="mt-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">My ministries</Text>
            <FilterDropdown label="Ministry" value={ministry} onPress={() => setOpenFilter("ministry")} />
          </View>
        </View>

        <View className="px-5 pt-7">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-foreground">Upcoming</Text>
              <Text className="mt-1 text-sm text-muted-foreground">{assignments.length} assignment{assignments.length === 1 ? "" : "s"}</Text>
            </View>
            <Pressable accessibilityRole="button" className="rounded-full bg-secondary px-4 py-2.5">
              <Text className="text-sm font-bold text-secondary-foreground">Availability</Text>
            </Pressable>
          </View>
          {assignments.length > 0 ? assignments.map((assignment) => <AssignmentCard assignment={assignment} key={assignment.id} />) : (
            <View className="items-center rounded-3xl border border-dashed border-border bg-card px-6 py-12">
              <Text className="text-lg font-bold text-foreground">Nothing scheduled here</Text>
              <Text className="mt-2 text-center leading-6 text-muted-foreground">Try another campus or one of your ministries.</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {openFilter === "campus" ? <FilterMenu title="Choose a campus" options={campusOptions} selectedValue={campus} onClose={() => setOpenFilter(null)} onSelect={(value) => { setCampus(value); setOpenFilter(null) }} /> : null}
      {openFilter === "ministry" ? <FilterMenu title="Choose a ministry" options={ministryOptions} selectedValue={ministry} onClose={() => setOpenFilter(null)} onSelect={(value) => { setMinistry(value); setOpenFilter(null) }} /> : null}
    </View>
  )
}
