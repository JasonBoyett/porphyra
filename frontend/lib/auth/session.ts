export type AuthSession = {
  email: string
  accessToken: string
}

export const developmentSession: AuthSession = {
  email: "dev@a244.tech",
  accessToken: "development-token"
}
