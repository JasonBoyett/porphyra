import { useState } from "react"
import { Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { StatusBar } from "expo-status-bar"

export type MobileConcern = {
  accent: string
  description: string
  eyebrow: string
  title: string
  actions: readonly string[]
}

const AuthScreen = (props: { onContinue: () => void }) => (
  <View className="flex-1 justify-center bg-background px-6">
    <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Porphyra</Text>
    <Text className="mb-3 text-4xl font-bold text-foreground">Welcome back.</Text>
    <Text className="mb-7 leading-6 text-muted-foreground">Sign in to serve your church with clarity.</Text>
    <TextInput className="mb-3 rounded-xl bg-card px-4 py-4 text-foreground" defaultValue="dev@a244.tech" keyboardType="email-address" placeholder="Email" />
    <TextInput className="mb-5 rounded-xl bg-card px-4 py-4 text-foreground" defaultValue="password" placeholder="Password" secureTextEntry />
    <Pressable className="rounded-xl bg-primary px-5 py-4" onPress={props.onContinue}><Text className="text-center font-bold text-primary-foreground">Continue to Porphyra</Text></Pressable>
  </View>
)

const Dashboard = (props: { concern: MobileConcern }) => (
  <ScrollView className="flex-1 bg-background" contentContainerClassName="min-h-full px-5 pb-12 pt-16">
    <View className="mb-8 flex-row items-center justify-between"><View><Text className="text-2xl font-bold text-foreground">Porphyra</Text><Text className="text-xs font-semibold uppercase tracking-widest text-primary">Acts 2:44 Technology</Text></View><View className="h-10 w-10 items-center justify-center rounded-full bg-primary"><Text className="font-bold text-primary-foreground">D</Text></View></View>
    <View className="mb-6 rounded-3xl bg-primary p-6"><Text className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-foreground">{props.concern.eyebrow}</Text><Text className="mb-3 text-3xl font-bold text-primary-foreground">{props.concern.title}</Text><Text className="leading-6 text-primary-foreground">{props.concern.description}</Text></View>
    <Text className="mb-3 text-lg font-bold text-foreground">Grace Harbor Church</Text>
    <View className="mb-7 rounded-2xl bg-card p-5"><Text className="text-xs font-bold uppercase tracking-widest text-primary">Downtown Campus</Text><Text className="mt-2 text-xl font-bold text-foreground">Good morning, dev@a244.tech</Text><Text className="mt-2 leading-6 text-muted-foreground">You are signed in as an administrator, volunteer, and member.</Text></View>
    <Text className="mb-3 text-lg font-bold text-foreground">Start here</Text>
    <View className="gap-3">{props.concern.actions.map(action => <Pressable className="rounded-2xl bg-secondary px-5 py-4" key={action}><Text className="font-bold text-foreground">{action}</Text><Text className="mt-1 text-sm text-muted-foreground">Coming soon in Porphyra</Text></Pressable>)}</View>
  </ScrollView>
)

export const MobileDashboard = (props: { concern: MobileConcern }) => {
  const [screen, setScreen] = useState<"welcome" | "auth" | "dashboard">("welcome")
  if (screen === "auth") return <AuthScreen onContinue={() => setScreen("dashboard")} />
  if (screen === "dashboard") return <Dashboard concern={props.concern} />
  return <View className="flex-1 justify-between bg-background px-6 py-16"><StatusBar style="dark" /><View><Text className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Church planning by Acts 2:44 Technology</Text><Text className="mb-5 text-5xl font-bold text-foreground">More ministry. Less managing.</Text><Text className="text-lg leading-7 text-muted-foreground">Porphyra helps churches plan services, coordinate volunteers, and welcome people well.</Text></View><View className="gap-3"><Pressable className="rounded-xl bg-primary px-5 py-4" onPress={() => setScreen("auth")}><Text className="text-center font-bold text-primary-foreground">Sign in</Text></Pressable><Pressable className="rounded-xl bg-secondary px-5 py-4" onPress={() => setScreen("auth")}><Text className="text-center font-bold text-foreground">Create a free account</Text></Pressable></View></View>
}
