import { app } from "./app"

const port = 4000
console.log(`Porphyra auth server listening on http://localhost:${port}`)
Bun.serve({ fetch: app.fetch, port })
