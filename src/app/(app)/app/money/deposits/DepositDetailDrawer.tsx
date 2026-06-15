"use client"

import React, { useEffect, useState } from "react"
import {
  X, Shield, CheckCircle, AlertCircle, Calendar, FileText, ExternalLink,
  Building2, User, Hash, Banknote, Clock, Loader2, Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

/* ─── Detail shape (live `deposits` row + best-effort joins) ───────────── */
export interface DepositDetail {
  id: string
  amount: number
  currency: string | null
  status: string
  deposit_type: string | null
  protection_scheme: string | null
  reference_number: string | null
  held_by: string | null
  received_date: string | null
  due_date: string | null
  return_due_date: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  contact_name: string | null
  contact_email: string | null
  property_line: string | null
  tenancy_status: string | null
  tenancy_start: string | null
  tenancy_end: string | null
  doc_name: string | null
  doc_url: string | null
  doc_id: string | null
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return "—"
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function statusChip(status: string) {
  switch (status) {
    case "protected": return { label: "Protected", bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircle className="w-3.5 h-3.5" /> }
    case "unprotected": return { label: "Unprotected", bg: "bg-red-50", text: "text-red-700", icon: <AlertCircle className="w-3.5 h-3.5" /> }
    case "return_due": return { label: "Return Due", bg: "bg-amber-50", text: "text-amber-700", icon: <Calendar className="w-3.5 h-3.5" /> }
    case "disputed": return { label: "Disputed", bg: "bg-red-50", text: "text-red-700", icon: <AlertCircle className="w-3.5 h-3.5" /> }
    case "expected": return { label: "Expected", bg: "bg-amber-50", text: "text-amber-700", icon: <Calendar className="w-3.5 h-3.5" /> }
    case "received": return { label: "Received", bg: "bg-blue-50", text: "text-blue-700", icon: <CheckCircle className="w-3.5 h-3.5" /> }
    case "returned": return { label: "Returned", bg: "bg-slate-50", text: "text-slate-600", icon: <CheckCircle className="w-3.5 h-3.5" /> }
    default: return { label: status || "Unknown", bg: "bg-slate-50", text: "text-slate-500", icon: <Shield className="w-3.5 h-3.5" /> }
  }
}

/* ─── Status history derived from real timestamps on the row ───────────── */
function buildHistory(d: DepositDetail): { label: string; date: string | null }[] {
  const items: { label: string; date: string | null }[] = []
  if (d.created_at) items.push({ label: "Deposit recorded", date: d.created_at })
  if (d.received_date) items.push({ label: "Funds received", date: d.received_date })
  if (d.protection_scheme || d.status === "protected") {
    items.push({ label: `Protected${d.protection_scheme ? ` · ${d.protection_scheme}` : ""}`, date: d.updated_at })
  }
  if (d.return_due_date) items.push({ label: "Return due", date: d.return_due_date })
  if (d.status === "returned") items.push({ label: "Deposit returned", date: d.updated_at })
  if (d.status === "disputed") items.push({ label: "Dispute raised", date: d.updated_at })
  return items
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={cn("text-sm text-slate-800 mt-0.5", mono && "font-mono")}>{value}</p>
    </div>
  )
}

export function DepositDetailDrawer({
  depositId,
  workspaceId,
  onClose,
}: {
  depositId: string
  workspaceId: string | undefined
  onClose: () => void
}) {
  const [detail, setDetail] = useState<DepositDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!workspaceId) { setLoading(false); setError("No workspace found — please refresh and try again"); return }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      // contact_id + property_id are real FKs → safe to embed via PostgREST.
      // tenancy_id + document_id are NOT FK-constrained, so they are fetched
      // with separate workspace-scoped reads rather than embedded joins.
      const sel =
        "id, amount, currency, status, deposit_type, protection_scheme, reference_number, held_by, received_date, due_date, return_due_date, notes, created_at, updated_at, tenancy_id, document_id, " +
        "contacts(display_name, email), properties(address_line1, city, postcode)"
      let row: Record<string, unknown> | null = null
      const { data, error: joinErr } = await supabase
        .from("deposits")
        .select(sel)
        .eq("id", depositId)
        .eq("workspace_id", workspaceId)
        .maybeSingle()
      if (!joinErr && data) {
        row = data as unknown as Record<string, unknown>
      } else {
        // Fallback: bare row without embedded relations.
        const { data: bare, error: bareErr } = await supabase
          .from("deposits")
          .select("id, amount, currency, status, deposit_type, protection_scheme, reference_number, held_by, received_date, due_date, return_due_date, notes, created_at, updated_at, tenancy_id, document_id")
          .eq("id", depositId)
          .eq("workspace_id", workspaceId)
          .maybeSingle()
        if (cancelled) return
        if (bareErr) {
          setError(bareErr.code === "42P01" ? "Deposits table not provisioned yet" : (bareErr.message ?? "Could not load deposit"))
          setLoading(false)
          return
        }
        row = bare as Record<string, unknown> | null
      }
      if (cancelled) return
      if (!row) { setError("Deposit not found"); setLoading(false); return }

      const contact = (Array.isArray(row.contacts) ? row.contacts[0] : row.contacts) as { display_name?: string; email?: string } | null
      const prop = (Array.isArray(row.properties) ? row.properties[0] : row.properties) as { address_line1?: string; city?: string; postcode?: string } | null

      // tenancy + document — separate workspace-scoped reads (no FK to embed).
      let ten: { status?: string; start_date?: string; end_date?: string } | null = null
      let doc: { id?: string; name?: string; url?: string } | null = null
      if (row.tenancy_id) {
        const { data: t } = await supabase
          .from("tenancies")
          .select("status, start_date, end_date")
          .eq("id", row.tenancy_id as string)
          .eq("workspace_id", workspaceId)
          .maybeSingle()
        ten = (t as { status?: string; start_date?: string; end_date?: string } | null) ?? null
      }
      if (row.document_id) {
        const { data: d } = await supabase
          .from("documents")
          .select("id, name, url")
          .eq("id", row.document_id as string)
          .eq("workspace_id", workspaceId)
          .maybeSingle()
        doc = (d as { id?: string; name?: string; url?: string } | null) ?? null
      }
      if (cancelled) return

      setDetail({
        id: row.id as string,
        amount: Number(row.amount ?? 0),
        currency: (row.currency as string) ?? "GBP",
        status: (row.status as string) ?? "received",
        deposit_type: (row.deposit_type as string) ?? null,
        protection_scheme: (row.protection_scheme as string) ?? null,
        reference_number: (row.reference_number as string) ?? null,
        held_by: (row.held_by as string) ?? null,
        received_date: (row.received_date as string) ?? null,
        due_date: (row.due_date as string) ?? null,
        return_due_date: (row.return_due_date as string) ?? null,
        notes: (row.notes as string) ?? null,
        created_at: (row.created_at as string) ?? null,
        updated_at: (row.updated_at as string) ?? null,
        contact_name: contact?.display_name ?? null,
        contact_email: contact?.email ?? null,
        property_line: prop ? [prop.address_line1, prop.city, prop.postcode].filter(Boolean).join(", ") || null : null,
        tenancy_status: ten?.status ?? null,
        tenancy_start: ten?.start_date ?? null,
        tenancy_end: ten?.end_date ?? null,
        doc_name: doc?.name ?? null,
        doc_url: doc?.url ?? null,
        doc_id: doc?.id ?? null,
      })
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [depositId, workspaceId])

  const sc = detail ? statusChip(detail.status) : null
  const history = detail ? buildHistory(detail) : []

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Deposit Details</h3>
              {detail && <p className="text-[11px] text-slate-400 font-mono">{detail.id.slice(0, 10).toUpperCase()}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <AlertCircle className="w-8 h-8 text-slate-300" />
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          ) : detail ? (
            <>
              {/* Amount + status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Amount held</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">
                    £{detail.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {sc && (
                  <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", sc.bg, sc.text)}>
                    {sc.icon}{sc.label}
                  </div>
                )}
              </div>

              {/* Parties */}
              <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
                <div className="flex items-start gap-3 p-3.5">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Tenant / Contact</p>
                    <p className="text-sm text-slate-800 mt-0.5 truncate">{detail.contact_name ?? "Not linked"}</p>
                    {detail.contact_email && <p className="text-xs text-slate-500 truncate">{detail.contact_email}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Property</p>
                    <p className="text-sm text-slate-800 mt-0.5">{detail.property_line ?? "Not linked"}</p>
                    {detail.tenancy_status && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tenancy: {detail.tenancy_status}
                        {detail.tenancy_start ? ` · from ${fmtDate(detail.tenancy_start)}` : ""}
                        {detail.tenancy_end ? ` to ${fmtDate(detail.tenancy_end)}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Protection */}
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-400" /> Protection
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Scheme" value={detail.protection_scheme ?? "Not protected"} />
                  <Field label="Reference" value={detail.reference_number ?? "—"} mono={!!detail.reference_number} />
                  <Field label="Held by" value={detail.held_by ?? "—"} />
                  <Field label="Type" value={detail.deposit_type ?? "—"} />
                </div>
                {detail.status !== "protected" && detail.status !== "returned" && (
                  <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700">
                      Deposits must be protected in an approved scheme within 30 days of receipt.
                    </p>
                  </div>
                )}
              </div>

              {/* Key dates */}
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" /> Key dates
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Received" value={fmtDate(detail.received_date)} />
                  <Field label="Due" value={fmtDate(detail.due_date)} />
                  <Field label="Return due" value={fmtDate(detail.return_due_date)} />
                  <Field label="Last updated" value={fmtDate(detail.updated_at)} />
                </div>
              </div>

              {/* Linked document */}
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" /> Linked document
                </p>
                {detail.doc_url ? (
                  <a
                    href={detail.doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-sm text-slate-700 flex-1 truncate">{detail.doc_name ?? "Deposit document"}</span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">No document attached.</p>
                )}
              </div>

              {/* Notes */}
              {detail.notes && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-slate-400" /> Notes
                  </p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{detail.notes}</p>
                </div>
              )}

              {/* Status history */}
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" /> Status history
                </p>
                {history.length === 0 ? (
                  <p className="text-sm text-slate-400">No history recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((h, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{h.label}</p>
                          <p className="text-xs text-slate-400">{fmtDate(h.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <a
            href="https://www.gov.uk/tenancy-deposit-protection"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            View approved schemes <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
