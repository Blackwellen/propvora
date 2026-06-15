import React from "react"
import { Badge } from "@/components/ui/Badge"

/** Human label + premium badge for a verification status. */
export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
    case "verified":
      return <Badge variant="success" dot size="sm">Approved</Badge>
    case "rejected":
    case "declined":
      return <Badge variant="danger" dot size="sm">Rejected</Badge>
    case "requires_input":
      return <Badge variant="warning" dot size="sm">Needs info</Badge>
    case "processing":
      return <Badge variant="sky" dot size="sm">Processing</Badge>
    case "pending":
      return <Badge variant="primary" dot size="sm">Pending</Badge>
    default:
      return <Badge dot size="sm" className="capitalize">{status.replace(/_/g, " ")}</Badge>
  }
}

/** Risk level chip. Higher risk → warmer colour. */
export function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-[11px] text-slate-400">—</span>
  const l = level.toLowerCase()
  if (l === "high" || l === "critical")
    return <Badge variant="danger" size="sm" className="capitalize">{level}</Badge>
  if (l === "medium" || l === "elevated")
    return <Badge variant="warning" size="sm" className="capitalize">{level}</Badge>
  if (l === "low")
    return <Badge variant="success" size="sm" className="capitalize">{level}</Badge>
  return <Badge variant="outline" size="sm" className="capitalize">{level}</Badge>
}
