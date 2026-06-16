import React from "react"
import { Badge } from "@/components/ui/Badge"

/** Honest, evidence-reviewed status badge for a supplier verification. */
export function SupplierStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "verified":
      return <Badge variant="success" dot size="sm">Verified</Badge>
    case "rejected":
      return <Badge variant="danger" dot size="sm">Rejected</Badge>
    case "more_info":
      return <Badge variant="warning" dot size="sm">Needs info</Badge>
    case "pending_review":
      return <Badge variant="primary" dot size="sm">Pending review</Badge>
    case "in_progress":
      return <Badge variant="sky" dot size="sm">In progress</Badge>
    case "suspended":
      return <Badge variant="danger" dot size="sm">Suspended</Badge>
    case "expired":
      return <Badge variant="warning" dot size="sm">Expired</Badge>
    default:
      return <Badge dot size="sm" className="capitalize">{status.replace(/_/g, " ")}</Badge>
  }
}

/** Level chip — labels are evidence-reviewed wording, never "fully vetted". */
export function LevelBadge({ level, label }: { level: number; label: string }) {
  const variant = level >= 5 ? "success" : level >= 3 ? "primary" : level >= 1 ? "sky" : "outline"
  return (
    <Badge variant={variant} size="sm">
      L{level} · {label}
    </Badge>
  )
}

/** Sub-check status (document / selfie / manual review). */
export function CheckBadge({ status }: { status: string }) {
  switch (status) {
    case "passed":
    case "approved":
      return <Badge variant="success" size="sm">Passed</Badge>
    case "failed":
    case "rejected":
      return <Badge variant="danger" size="sm">Failed</Badge>
    case "in_review":
    case "pending":
      return <Badge variant="primary" size="sm" className="capitalize">{status.replace(/_/g, " ")}</Badge>
    case "manual_required":
      return <Badge variant="warning" size="sm">Manual review</Badge>
    case "more_info":
      return <Badge variant="warning" size="sm">More info</Badge>
    default:
      return <Badge variant="outline" size="sm" className="capitalize">{status.replace(/_/g, " ")}</Badge>
  }
}

/** Evidence status (document / insurance / licence). */
export function EvidenceBadge({ status, expired }: { status: string; expired?: boolean }) {
  if (expired || status === "expired") return <Badge variant="danger" size="sm">Expired</Badge>
  switch (status) {
    case "accepted":
      return <Badge variant="success" size="sm">Accepted</Badge>
    case "rejected":
      return <Badge variant="danger" size="sm">Rejected</Badge>
    case "in_review":
      return <Badge variant="primary" size="sm">In review</Badge>
    default:
      return <Badge variant="outline" size="sm">Uploaded</Badge>
  }
}

/** Risk-flag severity chip. */
export function SeverityBadge({ severity }: { severity: string }) {
  const v = severity.toLowerCase()
  if (v === "high") return <Badge variant="danger" size="sm">High</Badge>
  if (v === "medium") return <Badge variant="warning" size="sm">Medium</Badge>
  return <Badge variant="outline" size="sm" className="capitalize">{severity}</Badge>
}
