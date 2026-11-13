import { Hono } from "hono"
import { authConfiguration } from "./better-auth"

export const app = new Hono()

app.get("/health", context => context.json({ status: "ok", service: "porphyra-auth" }))

app.get("/.well-known/jwks.json", context => context.json({ keys: [] }))

app.post("/api/v1/auth/sign-in", async context => {
  const body: { email?: string } = await context.req.json().catch(() => ({}))
  return context.json({
    accessToken: "development-token",
    email: body.email || authConfiguration.developmentUser,
    tokenType: "Bearer"
  })
})

app.post("/api/v1/auth/sign-up", async context => {
  const body: { email?: string } = await context.req.json().catch(() => ({}))
  return context.json({
    accessToken: "development-token",
    email: body.email || authConfiguration.developmentUser,
    tokenType: "Bearer"
  }, 201)
})
