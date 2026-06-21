"use client"
import { usePathname } from "next/navigation"

export interface CopilotPageContext {
  section: string
  tab: string | null
  entity: string | null
  breadcrumb: string
  workspaceType: "operator" | "supplier" | "customer"
}

export function useCopilotPageContext(): CopilotPageContext {
  const pathname = usePathname()

  // Detect workspace type from path prefix
  let workspaceType: "operator" | "supplier" | "customer" = "operator"
  let cleanPath = pathname

  if (pathname.startsWith("/supplier/") || pathname === "/supplier") {
    workspaceType = "supplier"
    cleanPath = pathname.replace(/^\/supplier\/?/, "")
  } else if (
    pathname.startsWith("/customer/") ||
    pathname === "/customer" ||
    pathname.startsWith("/user/") ||
    pathname === "/user"
  ) {
    workspaceType = "customer"
    cleanPath = pathname.replace(/^\/customer\/?/, "").replace(/^\/user\/?/, "")
  } else {
    // Operator: /property-manager/ or legacy /app/
    cleanPath = pathname
      .replace(/^\/property-manager\/?/, "")
      .replace(/^\/app\/?/, "")
  }

  const parts = cleanPath.split("/").filter(Boolean)

  // Section maps per workspace type
  const operatorSections: Record<string, string> = {
    compliance: "Compliance",
    money: "Money & Payments",
    accounting: "Accounting",
    work: "Work & Maintenance",
    planning: "Planning",
    portfolio: "Portfolio",
    contacts: "Contacts",
    calendar: "Calendar",
    legal: "Legal",
    "workspace-settings": "Settings",
    automations: "Automations",
    ai: "AI Copilot",
    "": "Home Dashboard",
  }

  const supplierSections: Record<string, string> = {
    requests: "Requests & Quotes",
    jobs: "Active Jobs",
    schedule: "Schedule",
    invoices: "Invoices",
    team: "Team",
    reputation: "Reputation",
    insights: "Insights",
    settings: "Settings",
    "": "Dashboard",
  }

  const customerSections: Record<string, string> = {
    lets: "My Lets",
    stays: "My Stays",
    bookings: "My Bookings",
    profile: "Profile",
    messages: "Messages",
    "": "Home",
  }

  const sectionMap =
    workspaceType === "supplier"
      ? supplierSections
      : workspaceType === "customer"
        ? customerSections
        : operatorSections

  const section = sectionMap[parts[0] ?? ""] ?? capitalize(parts[0] ?? "Home")
  const subSection = parts[1] ? capitalize(parts[1].replace(/-/g, " ")) : null

  // Detect UUID entity IDs in the path
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const detectedEntityId = parts.find((p) => uuidRe.test(p)) ?? null
  // Fall back to the last segment as a slug if no UUID and path is deep enough
  const detectedSlug =
    !detectedEntityId && parts.length > 1 ? parts[parts.length - 1] : null

  const wsLabel =
    workspaceType === "supplier"
      ? "Supplier"
      : workspaceType === "customer"
        ? "Customer"
        : "PM"

  const breadcrumb = [wsLabel, section, subSection].filter(Boolean).join(" › ")

  return {
    section,
    tab: subSection,
    entity: detectedEntityId ?? detectedSlug,
    breadcrumb,
    workspaceType,
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
