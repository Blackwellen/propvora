import React from "react"
import { Badge } from "@/components/ui/Badge"

/** Marketplace transaction status → coloured badge. */
export function TransactionStatusBadge({ status }: { status: string }) {
  const s = (status ?? "").toLowerCase()
  if (s === "captured" || s === "released")
    return <Badge variant="success" size="sm" dot>{label(s)}</Badge>
  if (s === "authorized" || s === "pending")
    return <Badge variant="warning" size="sm" dot>{label(s)}</Badge>
  if (s === "disputed")
    return <Badge variant="danger" size="sm" dot>{label(s)}</Badge>
  if (s === "refunded" || s === "cancelled")
    return <Badge variant="default" size="sm" dot>{label(s)}</Badge>
  return <Badge variant="outline" size="sm">{label(s)}</Badge>
}

/** Dispute status → coloured badge. */
export function DisputeStatusBadge({ status }: { status: string }) {
  const s = (status ?? "").toLowerCase()
  if (s === "open") return <Badge variant="warning" size="sm" dot>Open</Badge>
  if (s === "under_review") return <Badge variant="primary" size="sm" dot>Under review</Badge>
  if (s === "escalated") return <Badge variant="danger" size="sm" dot>Escalated</Badge>
  if (s === "resolved") return <Badge variant="success" size="sm" dot>Resolved</Badge>
  if (s === "rejected") return <Badge variant="default" size="sm" dot>Rejected</Badge>
  return <Badge variant="outline" size="sm">{label(s)}</Badge>
}

/** Payout status → coloured badge. */
export function PayoutStatusBadge({ status }: { status: string }) {
  const s = (status ?? "").toLowerCase()
  if (s === "paid") return <Badge variant="success" size="sm" dot>Paid</Badge>
  if (s === "pending") return <Badge variant="warning" size="sm" dot>Pending</Badge>
  if (s === "failed") return <Badge variant="danger" size="sm" dot>Failed</Badge>
  if (s === "reversed") return <Badge variant="default" size="sm" dot>Reversed</Badge>
  return <Badge variant="outline" size="sm">{label(s)}</Badge>
}

/** Workspace plan → badge. */
export function PlanBadge({ plan }: { plan: string | null }) {
  const p = (plan ?? "").toLowerCase()
  if (p === "enterprise") return <Badge variant="ai" size="sm">Enterprise</Badge>
  if (p === "business") return <Badge variant="primary" size="sm">Business</Badge>
  if (p === "pro") return <Badge variant="primary" size="sm">Pro</Badge>
  if (p === "trial") return <Badge variant="warning" size="sm">Trial</Badge>
  if (!p) return <Badge variant="outline" size="sm">—</Badge>
  return <Badge variant="default" size="sm">{label(p)}</Badge>
}

function label(s: string): string {
  if (!s) return "—"
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")
}
