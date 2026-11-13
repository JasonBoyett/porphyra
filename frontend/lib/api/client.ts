export type Organization = {
  id: string
  name: string
  description: string
  campuses: Campus[]
}

export type Campus = {
  id: string
  name: string
  city: string
}

export type Dashboard = {
  organizations: Organization[]
  viewer: {
    email: string
    roles: string[]
  }
}

const apiUrl = process.env.PORPHYRA_API_URL ?? "http://localhost:8000"

export const getDashboard = async (): Promise<Dashboard> => {
  const response = await fetch(`${apiUrl}/api/v1/dashboard`)
  if (!response.ok) throw new Error("Unable to load the Porphyra dashboard.")
  return response.json() as Promise<Dashboard>
}
