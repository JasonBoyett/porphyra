import { createRoot } from "react-dom/client"

import "../../../lib/theme/globals.css"
import "../../../lib/theme/porphyra.css"
import "./styles.css"

import { App } from "@/app"

createRoot(document.getElementById("root")!).render(<App />)
