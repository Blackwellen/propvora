import type { ReactNode } from "react"

// The Automations module chrome (header + route-aware tab strip + safety banner)
// is provided per-page by AutomationsModuleShell (src/features/automations/
// components). This layout is intentionally a thin pass-through so pages own
// their own full-width surface inside the app shell.
export default function AutomationsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
