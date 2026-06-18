"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Team reputation views — Reviews & Ratings (24) and Disputes + Trust Profile
   (25). Rendered inside the Reputation tab hub for team plans. Reply / resolve
   actions are typed stubs (toast + audit TODO).
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import Link from "next/link"
import { ThumbsUp, Send, Flag, CheckCircle2, Upload, UserCheck, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner, SupplierStatusBadge } from "@/components/supplier-workspace/ui"
import { shortDate } from "@/components/supplier-workspace/format"

function Mini({ label, value, tone = "slate" }: { label: string; value: string; tone?: "blue" | "emerald" | "red" | "amber" | "slate" }) {
  const c = tone === "blue" ? "text-[#2563EB]" : tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-slate-900"
  return <SupplierCard className="p-3.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span><p className={cn("text-lg font-bold mt-1", c)}>{value}</p></SupplierCard>
}
function Stars({ n }: { n: number }) { return <span className="text-amber-400 text-xs">{"★".repeat(Math.round(n))}<span className="text-slate-200">{"★".repeat(5 - Math.round(n))}</span></span> }

interface Review { id: string; customer: string; rating: number; service: string; worker: string; body: string; at: string; replied: boolean }
const REVIEWS: Review[] = [
  { id: "r1", customer: "Priya Nair", rating: 5, service: "Boiler service", worker: "Jake Foster", body: "Fantastic — on time, tidy and explained everything.", at: new Date(Date.now() - 2 * 86400000).toISOString(), replied: false },
  { id: "r2", customer: "Daniel Osei", rating: 4, service: "Electrical EICR", worker: "Emma Collins", body: "Good work, slight delay on arrival.", at: new Date(Date.now() - 4 * 86400000).toISOString(), replied: true },
  { id: "r3", customer: "Sarah Mitchell", rating: 2, service: "Plumbing", worker: "Mike Thompson", body: "Leak came back a week later.", at: new Date(Date.now() - 6 * 86400000).toISOString(), replied: false },
]

export function TeamReviews() {
  const [toast, setToast] = useState<string | null>(null)
  const [reviews, setReviews] = useState(REVIEWS)
  const [sel, setSel] = useState<Review>(REVIEWS[0])
  const [reply, setReply] = useState("")
  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
  const unanswered = reviews.filter((r) => !r.replied).length

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Average rating" value={avg} tone="amber" />
        <Mini label="Reviews" value={String(reviews.length)} tone="slate" />
        <Mini label="Response score" value="87%" tone="emerald" />
        <Mini label="Unanswered" value={String(unanswered)} tone="red" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
        <SupplierCard className="p-0 overflow-hidden min-w-0">
          <ul className="divide-y divide-slate-50">
            {reviews.map((r) => (
              <li key={r.id} onClick={() => setSel(r)} className={cn("p-4 hover:bg-slate-50/60 cursor-pointer", sel.id === r.id && "bg-blue-50/40")}>
                <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="text-[13px] font-semibold text-slate-800">{r.customer}</span><Stars n={r.rating} /></div><span className="text-[11px] text-slate-400">{shortDate(r.at)}</span></div>
                <p className="text-sm text-slate-600 mt-1">{r.body}</p>
                <div className="flex items-center gap-2 mt-1.5"><span className="text-[11px] text-slate-400">{r.service} · {r.worker}</span>{!r.replied && <span className="text-[10px] font-semibold text-amber-600">Needs reply</span>}</div>
              </li>
            ))}
          </ul>
        </SupplierCard>
        <SupplierCard className="p-5">
          <div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Reply</p><Stars n={sel.rating} /></div>
          <p className="text-sm font-semibold text-slate-900 mt-1">{sel.customer}</p>
          <p className="text-sm text-slate-600 mt-1">{sel.body}</p>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Write a public reply…" className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB] resize-none" />
          <div className="mt-2 space-y-1.5">
            <SupplierButton className="w-full justify-center" onClick={() => { setReviews((rs) => rs.map((x) => x.id === sel.id ? { ...x, replied: true } : x)); setReply(""); setToast("Reply posted.") }} disabled={!reply.trim()}><Send className="w-4 h-4" /> Post reply</SupplierButton>
            <div className="flex gap-1.5">
              <SupplierButton variant="outline" className="flex-1 justify-center" onClick={() => setReply("Thank you so much for the kind words — it was a pleasure!")}><ThumbsUp className="w-3.5 h-3.5" /> Template</SupplierButton>
              <SupplierButton variant="ghost" className="flex-1 justify-center" onClick={() => setToast("Review flagged for moderation.")}><Flag className="w-3.5 h-3.5" /> Flag</SupplierButton>
            </div>
            {/* linked job */}
            <Link href="/supplier/jobs" className="text-[11px] font-semibold text-blue-600 inline-flex items-center gap-0.5">Open linked job <ChevronRight className="w-3 h-3" /></Link>
          </div>
        </SupplierCard>
      </div>
    </div>
  )
}

interface Dispute { id: string; ref: string; customer: string; category: string; stage: "open" | "evidence" | "review" | "resolved"; owner: string | null; payoutHoldPence: number; trustImpact: number; opened: string }
const DISPUTES: Dispute[] = [
  { id: "d1", ref: "DSP-2025-0647", customer: "Sarah Mitchell", category: "Quality", stage: "evidence", owner: "Mike Thompson", payoutHoldPence: 25750, trustImpact: -3, opened: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "d2", ref: "DSP-2025-0641", customer: "Northside Homes", category: "Scope", stage: "review", owner: "Alex Morgan", payoutHoldPence: 14000, trustImpact: -1, opened: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: "d3", ref: "DSP-2025-0633", customer: "Osei Lettings", category: "Payment", stage: "resolved", owner: "Alex Morgan", payoutHoldPence: 0, trustImpact: 0, opened: new Date(Date.now() - 20 * 86400000).toISOString() },
]
const STAGES = ["open", "evidence", "review", "resolved"] as const

export function TeamDisputes() {
  const [toast, setToast] = useState<string | null>(null)
  const [sel, setSel] = useState<Dispute>(DISPUTES[0])
  const open = DISPUTES.filter((d) => d.stage !== "resolved").length

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Open disputes" value={String(open)} tone="red" />
        <Mini label="Payout held" value="£397.50" tone="amber" />
        <Mini label="Trust score" value="72" tone="blue" />
        <Mini label="Avg resolution" value="6d" tone="slate" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
        <SupplierCard className="p-0 overflow-hidden min-w-0">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><th className="px-4 py-3 font-semibold">Dispute</th><th className="px-4 py-3 font-semibold">Category</th><th className="px-4 py-3 font-semibold">Owner</th><th className="px-4 py-3 font-semibold">Stage</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {DISPUTES.map((d) => (
                <tr key={d.id} onClick={() => setSel(d)} className={cn("hover:bg-slate-50/60 cursor-pointer", sel.id === d.id && "bg-blue-50/40")}>
                  <td className="px-4 py-3"><p className="font-semibold text-slate-800">{d.customer}</p><p className="text-[11px] text-slate-400">{d.ref}</p></td>
                  <td className="px-4 py-3 text-slate-600">{d.category}</td>
                  <td className="px-4 py-3 text-slate-600">{d.owner ?? "—"}</td>
                  <td className="px-4 py-3"><SupplierStatusBadge tone={d.stage === "resolved" ? "emerald" : d.stage === "review" ? "blue" : "amber"}>{d.stage}</SupplierStatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SupplierCard>
        <SupplierCard className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Dispute</p>
          <h2 className="text-base font-semibold text-slate-900 mt-1">{sel.customer}</h2>
          <p className="text-xs text-slate-400">{sel.ref} · {sel.category}</p>
          {/* stage tracker */}
          <div className="flex items-center gap-1 mt-3">
            {STAGES.map((s, i) => { const active = STAGES.indexOf(sel.stage) >= i; return (
              <div key={s} className="flex items-center gap-1 flex-1">
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold", active ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400")}>{active ? "✓" : i + 1}</span>
                {i < STAGES.length - 1 && <span className={cn("flex-1 h-0.5", active ? "bg-[#2563EB]" : "bg-slate-200")} />}
              </div>
            )})}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 capitalize">{sel.stage} stage</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Payout hold</dt><dd className="font-semibold text-amber-600">£{(sel.payoutHoldPence / 100).toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Trust impact</dt><dd className="font-semibold text-red-600">{sel.trustImpact} pts</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Opened</dt><dd className="font-semibold text-slate-700">{shortDate(sel.opened)}</dd></div>
          </dl>
          {sel.stage !== "resolved" ? (
            <div className="mt-4 space-y-1.5">
              <SupplierButton className="w-full justify-center" onClick={() => setToast("Evidence uploaded to dispute.")}><Upload className="w-4 h-4" /> Upload evidence</SupplierButton>
              <SupplierButton variant="outline" className="w-full justify-center" onClick={() => setToast("Owner assigned.")}><UserCheck className="w-4 h-4" /> Assign owner</SupplierButton>
              <SupplierButton variant="ghost" className="w-full justify-center" onClick={() => { setSel({ ...sel, stage: "resolved" }); setToast(`${sel.ref} resolved.`) }}><CheckCircle2 className="w-4 h-4" /> Resolve dispute</SupplierButton>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Resolved — payout hold released.</div>
          )}
        </SupplierCard>
      </div>
    </div>
  )
}

