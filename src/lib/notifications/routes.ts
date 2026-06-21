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
    case "property":        return entityId ? `/property-manager/portfolio/properties/${entityId}` : "/property-manager/portfolio/properties"
    case "unit":            return entityId ? `/property-manager/portfolio/units/${entityId}` : "/property-manager/portfolio/units"
    case "tenancy":         return entityId ? `/property-manager/portfolio/tenancies/${entityId}` : "/property-manager/portfolio/tenancies"
    case "contact":         return entityId ? `/property-manager/contacts/${entityId}` : "/property-manager/contacts"
    case "task":            return entityId ? `/property-manager/work/tasks/${entityId}` : "/property-manager/work/tasks"
    case "job":             return entityId ? `/property-manager/work/jobs/${entityId}` : "/property-manager/work/jobs"
    case "invoice":         return entityId ? `/property-manager/money/invoices/${entityId}` : "/property-manager/money/invoices"
    case "bill":            return "/property-manager/money/bills"
    case "compliance":
    case "compliance_item": return "/property-manager/compliance/overview"
    case "planning_set":    return entityId ? `/property-manager/planning/sets/${entityId}` : "/property-manager/planning/sets"
    case "calendar_event":  return entityId ? `/property-manager/calendar/events/${entityId}` : "/property-manager/calendar"
    case "conversation":
    case "message":         return entityId ? `/property-manager/messages/conversations/${entityId}` : "/property-manager/messages"
    default:                return null
  }
}
