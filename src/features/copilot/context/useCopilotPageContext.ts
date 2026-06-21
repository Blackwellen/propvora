"use client"
import { usePathname } from "next/navigation"

export interface CopilotPageContext {
  section: string
  tab: string | null
  entity: string | null
  breadcrumb: string
  /** UUID of the entity on the current page (e.g. a property or tenancy ID), if any. */
  entityId: string | null
  /** The key name to use in pageContext JSON for the entityId (e.g. "propertyId"). */
  entityIdKey: string | null
}

/** UUID v4 pattern — used to detect entity IDs in path segments. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Maps a section + entity-bearing path to the correct pageContext key.
 * E.g. /property-manager/portfolio/properties/[uuid] → "propertyId"
 */
function resolveEntityKey(section: string, parentSegment: string | undefined): string {
  if (section === "Portfolio" || parentSegment === "properties") return "propertyId"
  if (parentSegment === "tenancies") return "tenancyId"
  if (parentSegment === "units") return "unitId"
  if (parentSegment === "jobs") return "jobId"
  if (parentSegment === "tasks") return "taskId"
  if (parentSegment === "contacts") return "contactId"
  if (parentSegment === "documents") return "documentId"
  return "entityId"
}

export function useCopilotPageContext(): CopilotPageContext {
  const pathname = usePathname()
  // Strip known shell prefixes
  const stripped = pathname
    .replace(/^\/(property-manager|app|user|customer|supplier)\//, "")
  const parts = stripped.split("/")

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
    stays: "Stays",
    services: "Services",
    suppliers: "Suppliers",
    "": "Home",
  }

  const section = sectionMap[parts[0] ?? ""] ?? capitalize(parts[0] ?? "Home")
  const tab = parts[1] && !UUID_RE.test(parts[1]) ? capitalize(parts[1].replace(/-/g, " ")) : null

  // Detect entity UUID in any path segment
  let entityId: string | null = null
  let entityIdKey: string | null = null
  for (let i = 1; i < parts.length; i++) {
    if (UUID_RE.test(parts[i])) {
      entityId = parts[i]
      entityIdKey = resolveEntityKey(section, parts[i - 1])
      break
    }
  }

  const breadcrumb = [section, tab].filter(Boolean).join(" › ")

  return {
    section,
    tab,
    entity: null,
    breadcrumb,
    entityId,
    entityIdKey,
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
