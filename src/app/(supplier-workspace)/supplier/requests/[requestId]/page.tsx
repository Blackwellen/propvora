"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/requests/[requestId] — request detail (manifest image 40).

   Tabs Overview / Scope / Files / Messages / Quote / Timeline, customer +
   property cards, budget/deadline/win-probability KPIs, risk flags, and a right
   quote rail with the AI recommendation. Reads the full PipelineRequest from the
   shared requests hook (live Supabase → 42P01-safe seed) and finds this row by
   id/ref. "Send quote" deep-links the route-backed Quote Builder.
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  LayoutGrid, FileText, MessagesSquare, History, Files, CheckCircle2, Send,
  PoundSterling, CalendarClock, Sparkles, AlertTriangle, Building2, User, MapPin,
  ShieldCheck, ThumbsDown,
} from "lucide-react"
import { SupplierDetailShell, type SupplierDetailTab } from "@/components/supplier-workspace/SupplierDetailShell"
import {
  SupplierCard, SupplierStatusBadge, SupplierButton, SupplierEmptyState,
  SupplierActionBar, SupplierBanner, SupplierLoadingState,
} from "@/components/supplier-workspace/ui"
import { useSupplierRequests } from "@/features/supplier/requests/data/hooks"
import { makeBlankPipelineRequest } from "@/features/supplier/requests/data/blank"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { moneyPence, shortDate, timeAgo } from "@/components/supplier-workspace/format"
import { UrgencyBadge, WinScoreRing } from "@/features/supplier/requests/components/primitives"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </SupplierCard>
  )
}

function budgetLabel(r: PipelineRequest): string {
  if (r.budgetMinPence == null && r.budgetMaxPence == null) return "Open"
  if (r.budgetMinPence != null && r.budgetMaxPence != null) return `${moneyPence(r.budgetMinPence)}–${moneyPence(r.budgetMaxPence)}`
  return moneyPence(r.budgetMaxPence ?? r.budgetMinPence)
}

function riskFlags(r: PipelineRequest): { tone: "red" | "amber"; label: string }[] {
  const flags: { tone: "red" | "amber"; label: string }[] = []
  if (!r.withinCoverage) flags.push({ tone: "red", label: "Outside your usual coverage area" })
  if (r.urgency === "emergency") flags.push({ tone: "red", label: "Emergency — fast response expected" })
  if (r.docsRequired > r.files.length) flags.push({ tone: "amber", label: `${r.docsRequired - r.files.length} document(s) still required` })
  if (r.dueAt && new Date(r.dueAt).getTime() - Date.now() < 24 * 3_600_000) flags.push({ tone: "amber", label: "Quote deadline within 24 hours" })
  return flags
}

export default function SupplierRequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const { data: requests, loading } = useSupplierRequests()
  const { isTeam } = useSupplierPlan()
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const req = useMemo(
    () => requests.find((r) => r.id === requestId || r.ref === requestId) ?? null,
    [requests, requestId]
  )

  if (loading && !req) {
    return <div className="py-6"><SupplierLoadingState rows={5} /></div>
  }

  const r = req ?? makeBlankPipelineRequest({ id: String(requestId), ref: String(requestId) })
  const flags = riskFlags(r)
  const newQuoteHref = `/supplier/quotes/new?requestId=${encodeURIComponent(r.id)}`

  const kpiRow = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Kpi icon={PoundSterling} label="Budget" value={budgetLabel(r)} />
      <Kpi icon={CalendarClock} label="Deadline" value={r.dueAt ? shortDate(r.dueAt) : "Flexible"} />
      <Kpi icon={Sparkles} label="Win probability" value={r.recommendation.winProbabilityPct != null ? `${r.recommendation.winProbabilityPct}%` : "—"} />
      <Kpi icon={ShieldCheck} label="Coverage" value={r.withinCoverage ? "In area" : "Outside"} tone={r.withinCoverage ? "emerald" : "red"} />
    </div>
  )

  const customerProperty = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <SupplierCard className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Requester</p>
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Building2 className="w-4 h-4" /></span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
              {r.requesterCompany}
              {r.requesterVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
            </p>
            {r.customerName && <p className="text-xs text-slate-400 flex items-center gap-1"><User className="w-3 h-3" />{r.customerName}{r.customerReturning ? " · returning" : ""}</p>}
          </div>
        </div>
      </SupplierCard>
      <SupplierCard className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Property</p>
        <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{r.property.address ?? "Address shared on acceptance"}</p>
        <p className="text-xs text-slate-400 mt-1">
          {[r.property.type, r.property.bedrooms ? `${r.property.bedrooms} bed` : null, r.property.heating].filter(Boolean).join(" · ") || "Details to follow"}
        </p>
      </SupplierCard>
    </div>
  )

  const tabs: SupplierDetailTab[] = [
    {
      key: "overview", label: "Overview", icon: LayoutGrid,
      render: () => (
        <div className="space-y-4">
          {kpiRow}
          {flags.length > 0 && (
            <div className="space-y-2">
              {flags.map((f, i) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${f.tone === "red" ? "bg-red-50 text-red-700 border border-red-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />{f.label}
                </div>
              ))}
            </div>
          )}
          {customerProperty}
          {isTeam && (
            <SupplierCard className="p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Assignment &amp; approval</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div><p className="text-[11px] text-slate-400">Estimator</p><p className="text-sm font-semibold text-slate-800">Mike Thompson</p></div>
                <div><p className="text-[11px] text-slate-400">Owner</p><p className="text-sm font-semibold text-slate-800">Alex Morgan</p></div>
                <div><p className="text-[11px] text-slate-400">Approval</p><p className="text-sm font-semibold text-amber-600">Required</p></div>
                <div><p className="text-[11px] text-slate-400">Quote deadline</p><p className="text-sm font-semibold text-slate-800">{r.dueAt ? shortDate(r.dueAt) : "Flexible"}</p></div>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Decision checklist</p>
              <ul className="space-y-1.5">
                {[["Coverage & trade fit confirmed", true], ["Estimator assigned", true], ["Margin target met", false], ["Commercial approval", false]].map(([l, ok]) => (
                  <li key={l as string} className="flex items-center gap-2 text-sm"><CheckCircle2 className={`w-4 h-4 ${ok ? "text-emerald-500" : "text-slate-300"}`} /><span className={ok ? "text-slate-600" : "text-slate-800 font-medium"}>{l as string}</span></li>
                ))}
              </ul>
            </SupplierCard>
          )}
          <Section title="Request summary">
            <p className="text-sm text-slate-600">{r.scopeSummary || "Details of this quote request appear here."}</p>
          </Section>
        </div>
      ),
    },
    {
      key: "scope", label: "Scope", icon: CheckCircle2,
      render: () => (
        <Section title="Requested scope">
          {r.scopeBullets.length === 0 ? (
            <p className="text-sm text-slate-500">{r.scopeSummary || "No itemised scope provided."}</p>
          ) : (
            <ul className="space-y-2">
              {r.scopeBullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{b}</li>
              ))}
            </ul>
          )}
        </Section>
      ),
    },
    {
      key: "files", label: "Files", icon: Files, count: r.files.length || undefined,
      render: () => (
        <Section title="Attached files">
          {r.files.length === 0 ? (
            <SupplierEmptyState icon={Files} title="No files attached" description="Photos and documents shared by the requester appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {r.files.map((f) => (
                <li key={f.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><FileText className="w-4 h-4" /></span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{f.fileName}</p><p className="text-xs text-slate-400">{f.kind} · {f.uploadedAt ? timeAgo(f.uploadedAt) : "—"}</p></div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      ),
    },
    {
      key: "messages", label: "Messages", icon: MessagesSquare, count: r.messages.length || undefined,
      render: () => (
        <Section title="Messages" action={<Link href="/supplier/inbox" className="text-xs font-semibold text-blue-600">Open inbox</Link>}>
          {r.messages.length === 0 ? (
            <SupplierEmptyState icon={MessagesSquare} title="No messages" description="Ask the requester a question about this job." />
          ) : (
            <ul className="space-y-2.5">
              {r.messages.map((m) => (
                <li key={m.id} className="text-sm"><span className="font-semibold text-slate-800">{m.authorName}</span> <span className="text-xs text-slate-400">{m.createdAt ? timeAgo(m.createdAt) : ""}</span><p className="text-slate-600">{m.body}</p></li>
              ))}
            </ul>
          )}
        </Section>
      ),
    },
    {
      key: "quote", label: "Quote", icon: FileText,
      render: () => (
        <Section title="Your quote">
          {r.quoteId ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-sm text-slate-500">Status</span>{r.quoteStatus && <SupplierStatusBadge status={r.quoteStatus} />}</div>
              <div className="flex items-center justify-between"><span className="text-sm text-slate-500">Amount</span><span className="text-sm font-semibold text-slate-900">{moneyPence(r.quoteAmountPence)}</span></div>
              <Link href={`/supplier/quotes/${r.quoteId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">View quote</Link>
            </div>
          ) : (
            <SupplierEmptyState icon={FileText} title="No quote yet" description="Price this request and send a quote." action={<Link href={newQuoteHref}><SupplierButton><Send className="w-4 h-4" /> Build quote</SupplierButton></Link>} />
          )}
        </Section>
      ),
    },
    { key: "timeline", label: "Timeline", icon: History, render: () => <Section title="Timeline"><ul className="space-y-2 text-sm text-slate-600"><li>Created {r.createdAt ? shortDate(r.createdAt) : "—"}</li>{r.quoteSentAt && <li>Quote sent {shortDate(r.quoteSentAt)}</li>}{r.acceptedAt && <li>Accepted {shortDate(r.acceptedAt)}</li>}</ul></Section> },
  ]

  return (
    <>
      {banner && <div className="mb-3"><SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner></div>}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
        <SupplierDetailShell
          backHref="/supplier/requests"
          backLabel="Back to requests"
          title={r.serviceTitle}
          subtitle={`${r.ref} · ${r.requesterCompany}`}
          status={<div className="flex items-center gap-2">{r.quoteStatus ? <SupplierStatusBadge status={r.quoteStatus} /> : <SupplierStatusBadge tone="sky">New request</SupplierStatusBadge>}<UrgencyBadge urgency={r.urgency} /></div>}
          tabs={tabs}
          actionBar={
            <SupplierActionBar>
              <SupplierButton variant="outline" onClick={() => setBanner({ tone: "emerald", msg: "Request declined." })}><ThumbsDown className="w-4 h-4" /> Decline</SupplierButton>
              <Link href={newQuoteHref}><SupplierButton><Send className="w-4 h-4" /> {r.quoteId ? "Revise quote" : "Build quote"}</SupplierButton></Link>
            </SupplierActionBar>
          }
        />

        {/* Quote rail */}
        <aside className="hidden xl:block sticky top-4 space-y-4">
          <SupplierCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Quote assistant</p>
              {r.winScore > 0 && <WinScoreRing score={r.winScore} />}
            </div>
            {r.recommendation.suggestedPricePence != null ? (
              <>
                <p className="text-2xl font-bold text-slate-900">{moneyPence(r.recommendation.suggestedPricePence)}</p>
                <p className="text-xs text-slate-400">Suggested price{r.recommendation.marginEstPct != null ? ` · ~${r.recommendation.marginEstPct}% margin` : ""}</p>
              </>
            ) : (
              <p className="text-sm text-slate-500">Price this request to see a win-probability estimate.</p>
            )}
            {r.recommendation.fitChecks.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {r.recommendation.fitChecks.map((c, i) => (
                  <li key={i} className={`flex items-start gap-2 text-xs ${c.ok ? "text-slate-600" : "text-slate-400"}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${c.ok ? "text-emerald-500" : "text-slate-300"}`} />{c.label}
                  </li>
                ))}
              </ul>
            )}
            <Link href={newQuoteHref} className="mt-4 block">
              <SupplierButton className="w-full justify-center"><Send className="w-4 h-4" /> Build quote</SupplierButton>
            </Link>
          </SupplierCard>
        </aside>
      </div>
    </>
  )
}

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof PoundSterling; label: string; value: string; tone?: "emerald" | "red" }) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span><Icon className="w-4 h-4 text-slate-400" /></div>
      <p className={`text-lg font-bold mt-1 ${tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-slate-900"}`}>{value}</p>
    </SupplierCard>
  )
}
