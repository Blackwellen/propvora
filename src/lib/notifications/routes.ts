// Central entity → app route resolver.
// Shared by the notification service (to stamp `href`), the bell, and the
// command palette so links stay consistent in one place.

export type EntityType =
  | "property"
  | "unit"
  | "tenancy"
  | "contact"
  | "task"
  | "job"
  | "invoice"
  | "bill"
  | "compliance"
  | "compliance_item"
  | "planning_set"
  | "calendar_event"
  | "conversation"
  | "message"

/** Maps an entity record to its detail/section route, or null if unknown. */
export function resolveEntityHref(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
): string | null {
  if (!entityType) return null
  switch (entityType) {
    case "property":        return entityId ? `/app/portfolio/properties/${entityId}` : "/app/portfolio/properties"
    case "unit":            return entityId ? `/app/portfolio/units/${entityId}` : "/app/portfolio/units"
    case "tenancy":         return entityId ? `/app/portfolio/tenancies/${entityId}` : "/app/portfolio/tenancies"
    case "contact":         return entityId ? `/app/contacts/${entityId}` : "/app/contacts"
    case "task":            return entityId ? `/app/work/tasks/${entityId}` : "/app/work/tasks"
    case "job":             return entityId ? `/app/work/jobs/${entityId}` : "/app/work/jobs"
    case "invoice":         return entityId ? `/app/money/invoices/${entityId}` : "/app/money/invoices"
    case "bill":            return "/app/money/bills"
    case "compliance":
    case "compliance_item": return "/app/compliance/overview"
    case "planning_set":    return entityId ? `/app/planning/sets/${entityId}` : "/app/planning/sets"
    case "calendar_event":  return entityId ? `/app/calendar/events/${entityId}` : "/app/calendar"
    case "conversation":
    case "message":         return entityId ? `/app/messages/conversations/${entityId}` : "/app/messages"
    default:                return null
  }
}
