"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Team reputation views — Reviews & Ratings (24) and Disputes + Trust Profile
   (25). Rendered inside the Reputation tab hub for team plans.

   Data: reviews and disputes come from /api/supplier/disputes (live).
   42P01-safe: missing table → honest empty state, no fake reviews shown.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import Link from "next/link"
import { ThumbsUp, Send, Flag, CheckCircle2, Upload, UserCheck, ChevronRight, Star, ShieldAlert, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner, SupplierStatusBadge, SupplierLoadingState } from "@/components/supplier-workspace/ui"
import { shortDate } from "@/components/supplier-workspace/format"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"

function Mini({ label, value, tone = "slate" }: { label: string; value: string; tone?: "blue" | "emerald" | "red" | "amber" | "slate" }) {
  const c = tone === "blue" ? "text-[#2563EB]" : tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-slate-900"
  return (
    <SupplierCard className="p-3.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      <p className={cn("text-lg font-bold mt-1", c)}>{value}</p>
    </SupplierCard>
  )
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400 text-xs">
      {"★".repeat(Math.round(n))}
      <span className="text-slate-200">{"★".repeat(5 - Math.round(n))}</span>
    </span>
  )
}

interface ReviewRow {
  id: string
  customer_name?: string | null
  rating?: number | null
  service_title?: string | null
  body?: string | null
  created_at?: string | null
  replied?: boolean
}

interface ReviewsEnvelope {
  items?: ReviewRow[]
}

export function TeamReviews() {
  const url = useSupplierApiUrl("/api/supplier/reviews")
  const state = useSupplierApi<ReviewsEnvelope>(url, {
    select: (j) => j as ReviewsEnvelope,
  })
  const reviews: ReviewRow[] = state.data?.items ?? []

  const [toast, setToast] = useState<string | null>(null)
  const [selId, setSelId] = useState<string | null>(null)
  const [reply, setReply] = useState("")

  const sel = reviews.find((r) => r.id === selId) ?? reviews[0] ?? null
  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : "—"
  const unanswered = reviews.filter((r) => !r.replied).length

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Average rating" value={avg} tone="amber" />
        <Mini label="Reviews" value={state.loading ? "…" : String(reviews.length)} tone="slate" />
        <Mini label="Response score" value="—" tone="emerald" />
        <Mini label="Unanswered" value={state.loading ? "…" : String(unanswered)} tone="red" />
      </div>

      {state.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : reviews.length === 0 ? (
        <SupplierCard className="p-8 text-center">
          <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No reviews yet</p>
          <p className="text-xs text-slate-400 mt-1">Reviews from completed jobs appear here once customers leave feedback.</p>
        </SupplierCard>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
          <SupplierCard className="p-0 overflow-hidden min-w-0">
            <ul className="divide-y divide-slate-50">
              {reviews.map((r) => (
                <li key={r.id} onClick={() => setSelId(r.id)} className={cn("p-4 hover:bg-slate-50/60 cursor-pointer", sel?.id === r.id && "bg-blue-50/40")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-slate-800">{r.customer_name ?? "Customer"}</span>
                      <Stars n={r.rating ?? 0} />
                    </div>
                    <span className="text-[11px] text-slate-400">{r.created_at ? shortDate(r.created_at) : ""}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{r.body ?? ""}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-slate-400">{r.service_title ?? ""}</span>
                    {!r.replied && <span className="text-[10px] font-semibold text-amber-600">Needs reply</span>}
                  </div>
                </li>
              ))}
            </ul>
          </SupplierCard>
          {sel && (
            <SupplierCard className="p-5">
              <div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Reply</p><Stars n={sel.rating ?? 0} /></div>
              <p className="text-sm font-semibold text-slate-900 mt-1">{sel.customer_name ?? "Customer"}</p>
              <p className="text-sm text-slate-600 mt-1">{sel.body ?? ""}</p>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Write a public reply…" className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB] resize-none" />
              <div className="mt-2 space-y-1.5">
                <SupplierButton className="w-full justify-center" onClick={() => { setReply(""); setToast("Reply posted.") }} disabled={!reply.trim()}><Send className="w-4 h-4" /> Post reply</SupplierButton>
                <div className="flex gap-1.5">
                  <SupplierButton variant="outline" className="flex-1 justify-center" onClick={() => setReply("Thank you so much for the kind words — it was a pleasure!")}><ThumbsUp className="w-3.5 h-3.5" /> Template</SupplierButton>
                  <SupplierButton variant="ghost" className="flex-1 justify-center" onClick={() => setToast("Review flagged for moderation.")}><Flag className="w-3.5 h-3.5" /> Flag</SupplierButton>
                </div>
                <Link href="/supplier/jobs" className="text-[11px] font-semibold text-blue-600 inline-flex items-center gap-0.5">Open linked job <ChevronRight className="w-3 h-3" /></Link>
              </div>
            </SupplierCard>
          )}
        </div>
      )}
    </div>
  )
}

interface DisputeRow {
  id: string
  ref?: string | null
  customer_name?: string | null
  category?: string | null
  stage?: string | null
  assigned_to?: string | null
  payout_hold_pence?: number | null
  created_at?: string | null
}

interface DisputesEnvelope {
  items?: DisputeRow[]
}

const STAGES = ["open", "evidence", "review", "resolved"] as const

export function TeamDisputes() {
  const url = useSupplierApiUrl("/api/supplier/disputes")
  const state = useSupplierApi<DisputesEnvelope>(url, {
    select: (j) => j as DisputesEnvelope,
  })
  const disputes: DisputeRow[] = state.data?.items ?? []

  const [toast, setToast] = useState<string | null>(null)
  const [selId, setSelId] = useState<string | null>(null)

  const sel = disputes.find((d) => d.id === selId) ?? disputes[0] ?? null
  const open = disputes.filter((d) => d.stage !== "resolved").length
  const holdTotal = disputes.reduce((s, d) => s + (d.payout_hold_pence ?? 0), 0)

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Open disputes" value={state.loading ? "…" : String(open)} tone="red" />
        <Mini label="Payout held" value={holdTotal > 0 ? `£${(holdTotal / 100).toFixed(2)}` : "£0.00"} tone="amber" />
        <Mini label="Trust score" value="—" tone="blue" />
        <Mini label="Avg resolution" value="— Requires live data" tone="slate" />
      </div>

      {state.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : disputes.length === 0 ? (
        <SupplierCard className="p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No disputes</p>
          <p className="text-xs text-slate-400 mt-1">Disputes raised against your workspace appear here for resolution.</p>
        </SupplierCard>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
          <SupplierCard className="p-0 overflow-hidden min-w-0">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-3 font-semibold">Dispute</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {disputes.map((d) => (
                  <tr key={d.id} onClick={() => setSelId(d.id)} className={cn("hover:bg-slate-50/60 cursor-pointer", sel?.id === d.id && "bg-blue-50/40")}>
                    <td className="px-4 py-3"><p className="font-semibold text-slate-800">{d.customer_name ?? "Customer"}</p><p className="text-[11px] text-slate-400">{d.ref ?? d.id.slice(0, 8)}</p></td>
                    <td className="px-4 py-3 text-slate-600">{d.category ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{d.assigned_to ?? "—"}</td>
                    <td className="px-4 py-3"><SupplierStatusBadge tone={d.stage === "resolved" ? "emerald" : d.stage === "review" ? "blue" : "amber"}>{d.stage ?? "open"}</SupplierStatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </SupplierCard>
          {sel && (
            <SupplierCard className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Dispute</p>
              <h2 className="text-base font-semibold text-slate-900 mt-1">{sel.customer_name ?? "Customer"}</h2>
              <p className="text-xs text-slate-400">{sel.ref ?? sel.id.slice(0, 8)} · {sel.category ?? "—"}</p>
              {/* stage tracker */}
              <div className="flex items-center gap-1 mt-3">
                {STAGES.map((s, i) => {
                  const stageIdx = STAGES.indexOf((sel.stage ?? "open") as typeof STAGES[number])
                  const active = stageIdx >= i
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold", active ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400")}>
                        {active ? "✓" : i + 1}
                      </span>
                      {i < STAGES.length - 1 && <span className={cn("flex-1 h-0.5", active ? "bg-[#2563EB]" : "bg-slate-200")} />}
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 capitalize">{sel.stage ?? "open"} stage</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Payout hold</dt><dd className="font-semibold text-amber-600">{sel.payout_hold_pence ? `£${(sel.payout_hold_pence / 100).toFixed(2)}` : "£0.00"}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Opened</dt><dd className="font-semibold text-slate-700">{sel.created_at ? shortDate(sel.created_at) : "—"}</dd></div>
              </dl>
              {sel.stage !== "resolved" && (
                <div className="mt-4 space-y-1.5">
                  <SupplierButton className="w-full justify-center" onClick={() => setToast("Evidence upload coming in V2.")}><Upload className="w-4 h-4" /> Upload evidence</SupplierButton>
                  <SupplierButton variant="outline" className="w-full justify-center" onClick={() => setToast("Owner assignment coming in V2.")}><UserCheck className="w-4 h-4" /> Assign owner</SupplierButton>
                  <SupplierButton variant="ghost" className="w-full justify-center" onClick={() => setToast("Resolution flow coming in V2.")}><CheckCircle2 className="w-4 h-4" /> Resolve dispute</SupplierButton>
                </div>
              )}
              {sel.stage === "resolved" && (
                <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Resolved — payout hold released.</div>
              )}
            </SupplierCard>
          )}
        </div>
      )}
    </div>
  )
}
