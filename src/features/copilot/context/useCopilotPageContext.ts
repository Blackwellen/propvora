"use client"
import { usePathname } from "next/navigation"

export interface CopilotPageContext {
  section: string
  tab: string | null
  entity: string | null
  breadcrumb: string
}

export function useCopilotPageContext(): CopilotPageContext {
  const pathname = usePathname()
  const parts = pathname.replace("/property-manager/", "").split("/")
  const sectionMap: Record<string, string> = {
    compliance: "Compliance",
    money: "Money",
    accounting: "Accounting",
    work: "Work",
    planning: "Planning",
    portfolio: "Portfolio",
    contacts: "Contacts",
    calendar: "Calendar",
    legal: "Legal",
    "workspace-settings": "Settings",
    "": "Home",
  }
  const section =
    sectionMap[parts[0] ?? ""] ?? capitalize(parts[0] ?? "Home")
  const tab = parts[1] ? capitalize(parts[1].replace(/-/g, " ")) : null
  // A record id may sit at parts[2]; we don't resolve its name here (avoids a
  // fake placeholder). The breadcrumb is route-derived only.
  const entity = null
  const breadcrumb = [section, tab].filter(Boolean).join(" › ")
  return { section, tab, entity, breadcrumb }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
