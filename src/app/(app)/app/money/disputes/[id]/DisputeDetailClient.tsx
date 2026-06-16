"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import type { DisputeRecord, DisputeActionRow } from "@/lib/payments/disputes"

const TABS = [
  "Overview",
  "Timeline",
  "Evidence",
  "Money",
  "Payout",
  "Refunds",
  "Parties",
  "Resolution",
  "Audit",
] as const
type Tab = (typeof TABS)[number]

function fmtPence(p: number, c = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: c, maximumFractionDigits: 2 }).format((p || 0) / 100)
}

interface ActionDef {
  key: string
  label: string
  tone: "primary" | "danger" | "neutral"
  needsAmount?: boolean
  needsResolution?: boolean
}

const ACTIONS: ActionDef[] = [
  { key: "request-evidence", label: "Request evidence", tone: "neutral" },
  { key: "hold-payout", label: "Hold payout", tone: "danger" },
  { key: "release-payout", label: "Release payout", tone: "primary" },
  { key: "partial-refund", label: "Partial refund", tone: "danger", needsAmount: true },
  { key: "full-refund", label: "Full refund", tone: "danger", needsAmount: true },
  { key: "settle", label: "Settle", tone: "primary", needsResolution: true },
  { key: "suspend", label: "Suspend", tone: "neutral" },
  { key: "escalate", label: "Escalate", tone: "danger" },
  { key: "close", label: "Close", tone: "neutral" },
]

export default function DisputeDetailClient({
  dispute,
  actions,
}: {
  dispute: DisputeRecord
  actions: DisputeActionRow[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("Overview")
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [resolution, setResolution] = useState("")

  async function run(a: ActionDef) {
    setBusy(a.key)
    setError(null)
    try {
      const body: Record<string, unknown> = { action: a.key }
      if (a.needsAmount) {
        const pence = Math.round(parseFloat(amount || "0") * 100)
        if (!pence || pence <= 0) throw new Error("Enter a refund amount.")
        body.amountPence = pence
      }
      if (a.needsResolution) {
        if (!resolution.trim()) throw new Error("Enter a resolution note.")
        body.resolution = resolution.trim()
      }
      const res = await fetch(`/api/money/disputes/${dispute.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Action failed.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize bg-slate-100 text-slate-700">
                  {dispute.dispute_type}
                </span>
                <span className="text-xs text-slate-400">#{dispute.id.slice(0, 8)}</span>
              </div>
              <h1 className="mt-2 text-xl font-bold text-slate-900">{dispute.reason ?? "Dispute"}</h1>
              <p className="mt-1 text-sm text-slate-500 capitalize">
                Status: {dispute.status.replace(/_/g, " ")} · Priority: {dispute.priority}
                {dispute.payout_held && " · Payout held"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Disputed</p>
              <p className="text-lg font-bold text-slate-900">{fmtPence(dispute.amount_disputed_pence)}</p>
              {dispute.amount_refunded_pence > 0 && (
                <p className="text-xs text-red-600">{fmtPence(dispute.amount_refunded_pence)} refunded</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-0.5 overflow-x-auto border-b border-slate-100 px-2 [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  tab === t ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-6 text-sm text-slate-700">
            {tab === "Overview" && (
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Type" value={dispute.dispute_type} />
                <Field label="Status" value={dispute.status} />
                <Field label="Priority" value={dispute.priority} />
                <Field label="Payout held" value={dispute.payout_held ? "Yes" : "No"} />
                <Field label="Reason" value={dispute.reason ?? "—"} />
                <Field label="Detail" value={dispute.detail ?? "—"} />
              </dl>
            )}
            {tab === "Timeline" && <ActionList actions={actions} />}
            {tab === "Evidence" && (
              <p className="text-slate-500">
                {dispute.evidence_requested_at
                  ? `Evidence requested ${new Date(dispute.evidence_requested_at).toLocaleString("en-GB")}.`
                  : "No evidence has been requested yet."}
              </p>
            )}
            {tab === "Money" && (
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Amount disputed" value={fmtPence(dispute.amount_disputed_pence)} />
                <Field label="Amount refunded" value={fmtPence(dispute.amount_refunded_pence)} />
                <Field label="Payment" value={dispute.payment_id ? dispute.payment_id.slice(0, 8) : "—"} />
                <Field label="Transaction" value={dispute.transaction_id ? dispute.transaction_id.slice(0, 8) : "—"} />
              </dl>
            )}
            {tab === "Payout" && (
              <p className="text-slate-500">
                Payout is currently <strong>{dispute.payout_held ? "HELD" : "open"}</strong>. Use the actions panel to hold or release.
              </p>
            )}
            {tab === "Refunds" && (
              <p className="text-slate-500">
                {dispute.amount_refunded_pence > 0
                  ? `${fmtPence(dispute.amount_refunded_pence)} refunded so far. Card refunds are confirmed by Stripe webhooks.`
                  : "No refunds recorded. Refund decisions here record intent + audit; the card refund is webhook-confirmed."}
              </p>
            )}
            {tab === "Parties" && (
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Raised by" value={dispute.raised_by_workspace_id?.slice(0, 8) ?? "—"} />
                <Field label="Against" value={dispute.against_workspace_id?.slice(0, 8) ?? "—"} />
                <Field label="Assigned admin" value={dispute.assigned_admin?.slice(0, 8) ?? "—"} />
              </dl>
            )}
            {tab === "Resolution" && (
              <p className="text-slate-500">{dispute.resolution ?? "Not yet resolved."}</p>
            )}
            {tab === "Audit" && <ActionList actions={actions} />}
          </div>
        </div>
      </div>

      {/* Actions rail */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Admin actions</h3>
          {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
          <div className="flex flex-col gap-3 mb-4">
            <div>
              <label className="text-[11px] font-medium text-slate-500">Refund amount (£)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500">Resolution note</label>
              <input
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="e.g. Refunded in full"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => run(a)}
                disabled={busy !== null}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 text-left ${
                  a.tone === "primary"
                    ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                    : a.tone === "danger"
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {busy === a.key ? "Working…" : a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800 capitalize break-words">{value}</dd>
    </div>
  )
}

function ActionList({ actions }: { actions: DisputeActionRow[] }) {
  if (actions.length === 0) return <p className="text-slate-500">No actions recorded yet.</p>
  return (
    <ol className="flex flex-col gap-3">
      {actions.map((a) => (
        <li key={a.id} className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800 capitalize">{a.action.replace(/_/g, " ")}</p>
            {a.detail && <p className="text-xs text-slate-500">{a.detail}</p>}
            {a.amount_pence > 0 && <p className="text-xs text-slate-500">{fmtPence(a.amount_pence)}</p>}
            <p className="text-[11px] text-slate-400">{new Date(a.created_at).toLocaleString("en-GB")}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
