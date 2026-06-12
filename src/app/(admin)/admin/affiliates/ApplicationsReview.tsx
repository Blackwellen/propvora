"use client"

import React, { useState } from "react"
import { Check, X, Mail, Globe } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { approveAffiliateApplication, rejectAffiliateApplication } from "@/lib/admin/affiliate-actions"
import type { AdminAffiliateApplication } from "@/lib/admin/data"

function statusBadge(s: string) {
  if (s === "approved") return <Badge variant="success" dot size="sm">Approved</Badge>
  if (s === "rejected") return <Badge variant="danger" dot size="sm">Rejected</Badge>
  if (s === "pending_review" || s === "submitted") return <Badge variant="warning" dot size="sm">Pending</Badge>
  return <Badge dot size="sm">{s}</Badge>
}

export default function ApplicationsReview({ rows }: { rows: AdminAffiliateApplication[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [local, setLocal] = useState(rows)

  async function act(id: string, kind: "approve" | "reject") {
    setBusy(id)
    try {
      const res = kind === "approve"
        ? await approveAffiliateApplication(id)
        : await rejectAffiliateApplication(id)
      if (res.ok) {
        setLocal((prev) => prev.map((r) => (r.id === id ? { ...r, status: kind === "approve" ? "approved" : "rejected" } : r)))
      }
    } finally {
      setBusy(null)
    }
  }

  if (local.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">No applications yet.</p>
  }

  return (
    <div className="divide-y divide-slate-100">
      {local.map((a) => {
        const pending = a.status === "pending_review" || a.status === "submitted"
        return (
          <div key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-800">{a.fullName}</p>
                {statusBadge(a.status)}
                {a.existingCustomer && <Badge variant="sky" size="sm">Customer</Badge>}
                {a.audienceType && <span className="text-[10px] text-slate-400">{a.audienceType}</span>}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {a.email}</span>
                {a.website && <span className="inline-flex items-center gap-1"><Globe className="w-3 h-3" /> {a.website}</span>}
                {a.country && <span>{a.country}</span>}
              </div>
              {a.promotionPlan && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{a.promotionPlan}</p>}
            </div>
            {pending && (
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" disabled={busy === a.id} onClick={() => act(a.id, "reject")}>
                  <X className="w-3.5 h-3.5" /> Reject
                </Button>
                <Button variant="primary" size="sm" disabled={busy === a.id} onClick={() => act(a.id, "approve")}>
                  <Check className="w-3.5 h-3.5" /> Approve
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
