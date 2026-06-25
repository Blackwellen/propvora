import type { PortalTone } from "@/components/portals/portal-ui"

/** Prospect/application status → friendly label + tone (matches prospects.status enum). */
export const APPLICATION_STATUS_META: Record<string, { label: string; tone: PortalTone }> = {
  new: { label: "Received", tone: "blue" },
  contacted: { label: "In contact", tone: "blue" },
  viewing_scheduled: { label: "Viewing booked", tone: "violet" },
  viewing_done: { label: "Viewing done", tone: "violet" },
  referencing: { label: "Referencing", tone: "amber" },
  offered: { label: "Offer made", tone: "amber" },
  accepted: { label: "Accepted", tone: "emerald" },
  rejected: { label: "Not progressed", tone: "red" },
  withdrawn: { label: "Withdrawn", tone: "slate" },
}

/** Viewing status → label + tone (matches viewings.status enum). */
export const VIEWING_STATUS_META: Record<string, { label: string; tone: PortalTone }> = {
  scheduled: { label: "Scheduled", tone: "blue" },
  completed: { label: "Completed", tone: "emerald" },
  no_show: { label: "Missed", tone: "red" },
  cancelled: { label: "Cancelled", tone: "slate" },
}
