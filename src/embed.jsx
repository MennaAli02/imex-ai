import "./process-polyfill.js"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { DataProvider } from "./data/DataContext"
import AppRoutes from "./AppRoutes"
import { setAuthToken } from "./lib/auth"
import "./index.css"

let root = null

export function mount(container, options = {}) {
  if (options.getToken) {
    setAuthToken(options.getToken)
  }
  root = createRoot(container)
  root.render(
    <DataProvider>
      <MemoryRouter initialEntries={["/appointments"]}>
        <AppRoutes />
      </MemoryRouter>
    </DataProvider>
  )
}

export function unmount() {
  if (root) {
    root.unmount()
    root = null
  }
}