import type { ContactHealth, ContactMeta } from "./types"

export function scoreContactHealth(c: ContactMeta): ContactHealth {
  // Risk first
  if ((c.arrears ?? 0) > 0) return "risk"
  if (c.status === "archived") return "inactive"
  if (c.status === "inactive") return "inactive"

  // Needs data
  if (!c.email && !c.phone) return "needs_data"

  // Follow-up overdue
  if (c.next_follow_up) {
    const due = new Date(c.next_follow_up)
    if (due < new Date()) return "follow_up"
  }

  // Stale contact
  if (c.last_contacted) {
    const last = new Date(c.last_contacted)
    const daysSince = (Date.now() - last.getTime()) / 86400000
    if (daysSince > 60) return "watch"
    if (daysSince > 30 && c.contact_type === "applicant") return "follow_up"
  } else {
    return "needs_data"
  }

  return "healthy"
}

export function getNextBestAction(c: ContactMeta): string | null {
  if ((c.arrears ?? 0) > 0) return "Create arrears follow-up task"
  if (!c.email && !c.phone) return "Complete contact profile — no email or phone"
  if (c.next_follow_up && new Date(c.next_follow_up) < new Date()) return "Follow-up overdue — action now"
  if (c.contact_type === "applicant" && !c.next_follow_up) return "Set follow-up date for applicant"
  if (c.contact_type === "supplier" && !c.email) return "Add supplier email for portal access"
  if (c.last_contacted) {
    const days = (Date.now() - new Date(c.last_contacted).getTime()) / 86400000
    if (days > 60) return `Not contacted in ${Math.round(days)} days — send check-in`
  }
  return null
}
