import { Pressable, ScrollView, Text, View } from "react-native"
import { StatusBar } from "expo-status-bar"

export type MobileConcern = {
  accent: string
  description: string
  eyebrow: string
  title: string
  actions: readonly string[]
}

export const MobileDashboard = (props: { concern: MobileConcern }) => (
  <ScrollView className="flex-1 bg-background" contentContainerClassName="min-h-full px-5 pb-12 pt-16">
    <StatusBar style="dark" />
    <View className="mb-8 flex-row items-center justify-between">
      <View><Text className="text-2xl font-bold text-foreground">Porphyra</Text><Text className="text-xs font-semibold uppercase tracking-widest text-primary">Acts 2:44 Technology</Text></View>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary"><Text className="font-bold text-primary-foreground">D</Text></View>
    </View>
    <View className="mb-6 rounded-3xl bg-primary p-6">
      <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-foreground">{props.concern.eyebrow}</Text>
      <Text className="mb-3 text-3xl font-bold text-primary-foreground">{props.concern.title}</Text>
      <Text className="leading-6 text-primary-foreground">{props.concern.description}</Text>
    </View>
    <Text className="mb-3 text-lg font-bold text-foreground">Grace Harbor Church</Text>
    <View className="mb-7 rounded-2xl bg-card p-5">
      <Text className="text-xs font-bold uppercase tracking-widest text-primary">Downtown Campus</Text>
      <Text className="mt-2 text-xl font-bold text-foreground">Good morning, dev@a244.tech</Text>
      <Text className="mt-2 leading-6 text-muted-foreground">You are signed in as an administrator, volunteer, and member.</Text>
    </View>
    <Text className="mb-3 text-lg font-bold text-foreground">Start here</Text>
    <View className="gap-3">
      {props.concern.actions.map(action => <Pressable className="rounded-2xl bg-secondary px-5 py-4" key={action}><Text className="font-bold text-foreground">{action}</Text><Text className="mt-1 text-sm text-muted-foreground">Coming soon in Porphyra</Text></Pressable>)}
    </View>
  </ScrollView>
)
