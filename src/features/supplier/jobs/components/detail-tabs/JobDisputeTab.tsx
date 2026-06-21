"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import {
  SupplierCard, SupplierStatusBadge, SupplierButton, SupplierBanner,
  SupplierLoadingState, SupplierDrawer, SupplierField,
  supplierInputClass, supplierTextareaClass,
  toneForStatus, humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierDisputeRow } from "@/components/supplier-workspace/types"

export interface JobDisputeTabProps {
  assignmentId: string
  workspaceId: string | null
  rows: SupplierDisputeRow[]
  loading: boolean
  refresh: () => void
}

export function JobDisputeTab({
  assignmentId, workspaceId, rows, loading, refresh,
}: JobDisputeTabProps) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState("payment")
  const [detail, setDetail] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function raise() {
    if (!workspaceId || !subject.trim()) { setErr("A subject is required."); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch("/api/supplier/disputes", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, assignmentId, subject: subject.trim(), category, detail: detail || undefined }),
      })
      if (!res.ok) { setErr("Couldn't raise the dispute."); return }
      setOpen(false); setSubject(""); setDetail(""); refresh()
    } catch { setErr("Network error.") }
    finally { setBusy(false) }
  }

  async function withdraw(disputeId: string) {
    if (!workspaceId) return
    const res = await fetch("/api/supplier/disputes", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, disputeId, action: "withdraw" }),
    })
    if (res.ok) refresh()
  }

  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-900">Disputes</h2>
        <SupplierButton size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <AlertTriangle className="w-3.5 h-3.5" /> Raise dispute
        </SupplierButton>
      </div>
      {loading ? (
        <SupplierLoadingState rows={2} />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400 py-3">
          No disputes on this job. Raise one if there is a problem with payment, scope, quality or access that you
          can&apos;t resolve directly.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((d) => (
            <li key={d.id} className="rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-900">{d.subject}</p>
                <SupplierStatusBadge tone={toneForStatus(d.status)}>{humaniseStatus(d.status)}</SupplierStatusBadge>
                <SupplierStatusBadge tone="slate">{humaniseStatus(d.category)}</SupplierStatusBadge>
              </div>
              {d.detail && <p className="text-xs text-slate-500 mt-1">{d.detail}</p>}
              {d.resolution && <p className="text-xs text-emerald-700 mt-1">Resolution: {d.resolution}</p>}
              <p className="text-[11px] text-slate-400 mt-1">
                Raised {timeAgo(d.created_at)} by {d.raised_by_side}
              </p>
              {(d.status === "open" || d.status === "under_review") && d.raised_by_side === "supplier" && (
                <button
                  onClick={() => withdraw(d.id)}
                  className="mt-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700"
                >
                  Withdraw
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <SupplierDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Raise a dispute"
        footer={
          <>
            <SupplierButton variant="secondary" onClick={() => setOpen(false)}>Cancel</SupplierButton>
            <SupplierButton onClick={raise} loading={busy}>Submit</SupplierButton>
          </>
        }
      >
        {err && <SupplierBanner tone="red" onDismiss={() => setErr(null)}>{err}</SupplierBanner>}
        <SupplierField label="Subject" required>
          <input
            className={supplierInputClass}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Payment not released after completion"
          />
        </SupplierField>
        <SupplierField label="Category">
          <select className={supplierInputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="payment">Payment</option>
            <option value="scope">Scope</option>
            <option value="quality">Quality</option>
            <option value="access">Access</option>
            <option value="other">Other</option>
          </select>
        </SupplierField>
        <SupplierField label="Detail" hint="What happened, and what outcome you're seeking.">
          <textarea className={supplierTextareaClass} value={detail} onChange={(e) => setDetail(e.target.value)} />
        </SupplierField>
      </SupplierDrawer>
    </SupplierCard>
  )
}
