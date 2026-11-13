import { Hono } from "hono"
import { cors } from "hono/cors"
import { sign } from "hono/jwt"
import { authConfiguration } from "./better-auth"

export const app = new Hono()

app.use("*", cors({
  allowHeaders: ["Content-Type"],
  allowMethods: ["POST"],
  origin: "http://localhost:3000"
}))

app.get("/health", context => context.json({ status: "ok", service: "porphyra-auth" }))

app.get("/.well-known/jwks.json", context => context.json({ keys: [] }))

const issueDevelopmentAccessToken = async (email: string) => {
  const issuedAt = Math.floor(Date.now() / 1000)
  return sign({
    aud: authConfiguration.jwtAudience,
    email,
    exp: issuedAt + 60 * 60,
    iat: issuedAt,
    iss: "http://localhost:4000",
    name: email,
    sub: authConfiguration.developmentSubject
  }, authConfiguration.jwtSecret, "HS256")
}

app.post("/api/v1/auth/sign-in", async context => {
  const body: { email?: string } = await context.req.json().catch(() => ({}))
  const email = body.email || authConfiguration.developmentUser
  return context.json({
    accessToken: await issueDevelopmentAccessToken(email),
    email,
    tokenType: "Bearer"
  })
})

app.post("/api/v1/auth/sign-up", async context => {
  const body: { email?: string } = await context.req.json().catch(() => ({}))
  const email = body.email || authConfiguration.developmentUser
  return context.json({
    accessToken: await issueDevelopmentAccessToken(email),
    email,
    tokenType: "Bearer"
  }, 201)
})
