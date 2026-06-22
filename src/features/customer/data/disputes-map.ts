// ============================================================================
// Customer disputes — map the REAL rich `Dispute` (from marketplace_disputes
// via @/lib/disputes/load) into the customer-facing shape, carrying the real
// audit timeline + messages. No mock data.
// ============================================================================
import type { Dispute as RichDispute } from "@/features/bookings/disputes/data/map"
import type { Dispute as CustomerDispute, DisputeStatus } from "./bookings"

export interface CustomerDisputeLive extends CustomerDispute {
  timeline: { id: string; title: string; sub?: string; at: string; kind: string }[]
  messages: { id: string; who: string; when: string; text: string; support: boolean }[]
  evidenceCount: number
}

const fmtDate = (iso?: string) => {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return "—"
  }
}
const fmtDateTime = (iso: string) => {
  try {
    const d = new Date(iso)
    return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
  } catch {
    return iso
  }
}

const STATUS_MAP: Record<string, DisputeStatus> = {
  open: "Awaiting host response",
  awaiting_evidence: "Awaiting host response",
  in_review: "Awaiting Propvora",
  proposed: "Awaiting Propvora",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Awaiting Propvora",
}

const STAGE_INDEX: Record<string, number> = {
  intake: 0,
  evidence: 1,
  review: 3,
  resolution: 4,
  closed: 5,
}

const PLACEHOLDER_IMG = "/property-types/holiday.jpg"

export function mapToCustomerDispute(d: RichDispute): CustomerDisputeLive {
  const past = d.stage === "closed" || d.status === "resolved" || d.status === "closed"
  const refunded = d.total_released_pence ?? 0
  return {
    id: d.reference,
    bookingRef: d.booking_reference,
    property: d.property_name && d.property_name !== "—" ? d.property_name : "Booking dispute",
    location: d.property_location ?? "",
    image: d.property_image || PLACEHOLDER_IMG,
    dateRange: "—",
    nights: 0,
    bookingTotalPence: d.escrow_held_pence || d.amount_disputed_pence,
    claimedPence: d.amount_disputed_pence,
    refundRequestedPct: d.amount_disputed_pence > 0 ? 100 : 0,
    reason: d.issue_summary,
    reasonDetail: d.description,
    raised: fmtDate(d.opened_at),
    status: STATUS_MAP[d.status] ?? "Awaiting Propvora",
    since: fmtDate(d.updated_at),
    stageIndex: STAGE_INDEX[d.stage] ?? 0,
    past,
    resolvedNote: d.proposal
      ? `${past ? "Resolved" : "Proposed"} · ${refunded > 0 ? `£${(refunded / 100).toLocaleString("en-GB")} refunded` : "no refund"}`
      : undefined,
    timeline: d.timeline.map((t): CustomerDisputeLive["timeline"][number] => ({ id: t.id, title: t.label, sub: t.detail, at: fmtDateTime(t.at), kind: t.kind })),
    messages: d.messages.map((m): CustomerDisputeLive["messages"][number] => ({
      id: m.id,
      who: m.author_role === "adjudicator" || m.author_role === "system" ? "Propvora Support" : m.author,
      when: fmtDateTime(m.sent_at),
      text: m.body,
      support: m.author_role === "adjudicator" || m.author_role === "system",
    })),
    evidenceCount: d.evidence.length,
  }
}
