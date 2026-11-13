import { betterAuth } from "better-auth"
import { dash } from "@better-auth/infra"
import { Database } from "bun:sqlite"

export const authConfiguration = {
  applicationName: "Porphyra",
  developmentUser: "dev@a244.tech",
  databasePath: process.env.PORPHYRA_AUTH_DATABASE_PATH || "porphyra-auth.sqlite3",
  jwtAudience: "porphyra-api",
  jwtSecret: process.env.PORPHYRA_AUTH_JWT_SECRET || "porphyra-development-jwt-secret-2026"
} as const

const database = new Database(authConfiguration.databasePath)

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",
  database,
  emailAndPassword: { enabled: true },
  plugins: [dash({ apiKey: process.env.BETTER_AUTH_API_KEY })],
  secret: process.env.BETTER_AUTH_SECRET || authConfiguration.jwtSecret,
  trustedOrigins: ["http://localhost:3000"]
})
