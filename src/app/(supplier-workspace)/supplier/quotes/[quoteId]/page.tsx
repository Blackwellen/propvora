"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/quotes/[quoteId] — quote detail (manifest image 43).

   Tabs Overview / Line Items / Messages / Versions / Activity, with status /
   value / expiry / win-chance KPIs and a "Convert to job" action. Reads the full
   PipelineRequest (which carries the quote) from the shared requests hook,
   matched by quoteId. "Revise quote" deep-links the route-backed Quote Builder.
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  LayoutGrid, List, MessagesSquare, History, GitBranch, Send, PoundSterling,
  CalendarClock, Sparkles, CircleDot, ArrowRightCircle,
} from "lucide-react"
import { SupplierDetailShell, type SupplierDetailTab } from "@/components/supplier-workspace/SupplierDetailShell"
import {
  SupplierCard, SupplierStatusBadge, SupplierButton, SupplierEmptyState,
  SupplierActionBar, SupplierBanner, SupplierLoadingState,
} from "@/components/supplier-workspace/ui"
import { useSupplierRequests } from "@/features/supplier/requests/data/hooks"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { moneyPence, shortDate, timeAgo, expiryLabel } from "@/components/supplier-workspace/format"
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

function Kpi({ icon: Icon, label, value }: { icon: typeof PoundSterling; label: string; value: string }) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span><Icon className="w-4 h-4 text-slate-400" /></div>
      <p className="text-lg font-bold mt-1 text-slate-900">{value}</p>
    </SupplierCard>
  )
}

export default function SupplierQuoteDetailPage() {
  const { quoteId } = useParams<{ quoteId: string }>()
  const { data: requests, loading } = useSupplierRequests()
  const { isTeam } = useSupplierPlan()
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const row = useMemo<PipelineRequest | null>(
    () => requests.find((r) => r.quoteId === quoteId || r.id === quoteId) ?? null,
    [requests, quoteId]
  )

  if (loading && !row) {
    return <div className="py-6"><SupplierLoadingState rows={5} /></div>
  }

  const r = row
  const amount = r?.quoteAmountPence ?? null
  const reviseHref = r ? `/supplier/quotes/new?requestId=${encodeURIComponent(r.id)}` : "/supplier/quotes/new"
  const accepted = r?.quoteStatus === "accepted"

  const tabs: SupplierDetailTab[] = [
    {
      key: "overview", label: "Overview", icon: LayoutGrid,
      render: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi icon={PoundSterling} label="Value" value={moneyPence(r?.quoteIncVatPence ?? amount)} />
            <Kpi icon={CalendarClock} label="Expiry" value={r?.quoteExpiresAt ? expiryLabel(r.quoteExpiresAt) : "—"} />
            <Kpi icon={Sparkles} label="Win chance" value={r?.winChance != null ? `${r.winChance}%` : "—"} />
            <Kpi icon={CircleDot} label="Status" value={r?.quoteStatus ? r.quoteStatus.replace(/_/g, " ") : "Draft"} />
          </div>
          <Section title="Quote overview">
            <p className="text-sm text-slate-600">{r?.scopeSummary || "Quote details appear here."}</p>
            {r && <p className="mt-2 text-sm text-slate-400">For {r.requesterCompany} · {r.serviceTitle}</p>}
          </Section>
          {isTeam && (
            <SupplierCard className="p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Approval workflow &amp; margin</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div><p className="text-[11px] text-slate-400">Estimator</p><p className="text-sm font-semibold text-slate-800">Mike Thompson</p></div>
                <div><p className="text-[11px] text-slate-400">Reviewer</p><p className="text-sm font-semibold text-slate-800">Alex Morgan</p></div>
                <div><p className="text-[11px] text-slate-400">Margin estimate</p><p className="text-sm font-semibold text-emerald-600">47%</p></div>
                <div><p className="text-[11px] text-slate-400">Approval</p><p className="text-sm font-semibold text-amber-600">Awaiting sign-off</p></div>
              </div>
              <div className="flex items-center gap-1">
                {["Drafted", "Submitted", "Approved", "Sent"].map((s, i) => (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${i < 2 ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400"}`}>{i < 2 ? "✓" : i + 1}</span>
                    <span className="text-[11px] text-slate-500">{s}</span>
                    {i < 3 && <span className={`flex-1 h-0.5 ${i < 1 ? "bg-[#2563EB]" : "bg-slate-200"}`} />}
                  </div>
                ))}
              </div>
            </SupplierCard>
          )}
        </div>
      ),
    },
    {
      key: "lineitems", label: "Line Items", icon: List, count: r?.lineItems.length || undefined,
      render: () => (
        <Section title="Line items">
          {!r || r.lineItems.length === 0 ? (
            <SupplierEmptyState icon={List} title="No line items" description="Itemise this quote to break down labour and materials." action={<Link href={reviseHref}><SupplierButton variant="outline">Edit quote</SupplierButton></Link>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="py-2 pr-3">Description</th><th className="py-2 px-3 text-right">Qty</th><th className="py-2 px-3 text-right">Unit</th><th className="py-2 pl-3 text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {r.lineItems.map((li) => (
                    <tr key={li.id}><td className="py-2.5 pr-3 text-slate-800">{li.description}</td><td className="py-2.5 px-3 text-right text-slate-600">{li.quantity}</td><td className="py-2.5 px-3 text-right text-slate-600">{moneyPence(li.unitPricePence)}</td><td className="py-2.5 pl-3 text-right font-semibold text-slate-900">{moneyPence(li.lineTotalPence)}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t border-slate-200"><td colSpan={3} className="py-2.5 pr-3 text-right text-sm font-medium text-slate-600">Total</td><td className="py-2.5 pl-3 text-right text-base font-bold text-slate-900">{moneyPence(amount)}</td></tr></tfoot>
              </table>
            </div>
          )}
        </Section>
      ),
    },
    {
      key: "messages", label: "Messages", icon: MessagesSquare, count: r?.messages.length || undefined,
      render: () => (
        <Section title="Messages" action={<Link href="/supplier/inbox" className="text-xs font-semibold text-blue-600">Open inbox</Link>}>
          {!r || r.messages.length === 0 ? <SupplierEmptyState icon={MessagesSquare} title="No messages" /> : (
            <ul className="space-y-2.5">{r.messages.map((m) => <li key={m.id} className="text-sm"><span className="font-semibold text-slate-800">{m.authorName}</span> <span className="text-xs text-slate-400">{m.createdAt ? timeAgo(m.createdAt) : ""}</span><p className="text-slate-600">{m.body}</p></li>)}</ul>
          )}
        </Section>
      ),
    },
    {
      key: "versions", label: "Versions", icon: GitBranch, count: r?.versions.length || undefined,
      render: () => (
        <Section title="Quote versions">
          {!r || r.versions.length === 0 ? <SupplierEmptyState icon={GitBranch} title="Single version" description="Revisions you send will be tracked here." /> : (
            <ul className="space-y-2.5">
              {r.versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-1">
                  <div><p className="text-sm font-semibold text-slate-800">v{v.version} · {v.label}</p><p className="text-xs text-slate-400">{v.createdAt ? shortDate(v.createdAt) : "—"}{v.note ? ` · ${v.note}` : ""}</p></div>
                  <div className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-900">{moneyPence(v.totalIncVatPence ?? v.amountPence)}</span><SupplierStatusBadge status={v.status} /></div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      ),
    },
    { key: "activity", label: "Activity", icon: History, render: () => <Section title="Activity"><ul className="space-y-2 text-sm text-slate-600">{r?.quoteSentAt && <li>Sent {shortDate(r.quoteSentAt)}</li>}{r?.acceptedAt && <li>Accepted {shortDate(r.acceptedAt)}</li>}{r?.followUpAt && <li>Follow-up due {shortDate(r.followUpAt)}</li>}{!r?.quoteSentAt && <li>Not yet sent.</li>}</ul></Section> },
  ]

  return (
    <>
      {banner && <div className="mb-3"><SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner></div>}
      <SupplierDetailShell
        backHref="/supplier/requests?tab=quoted"
        backLabel="Back to quotes"
        title={r ? `Quote · ${r.serviceTitle}` : `Quote ${String(quoteId).slice(0, 8)}`}
        subtitle={r ? `${r.ref} · ${r.requesterCompany}` : "Quote you've submitted"}
        status={r?.quoteStatus ? <SupplierStatusBadge status={r.quoteStatus} /> : <SupplierStatusBadge tone="slate">Draft</SupplierStatusBadge>}
        tabs={tabs}
        actionBar={
          <SupplierActionBar>
            <Link href={reviseHref}><SupplierButton variant="outline"><Send className="w-4 h-4" /> Revise quote</SupplierButton></Link>
            <SupplierButton
              disabled={!accepted}
              onClick={() => setBanner({ tone: "emerald", msg: accepted ? "Converting to job…" : "Quote must be accepted first." })}
            >
              <ArrowRightCircle className="w-4 h-4" /> Convert to job
            </SupplierButton>
          </SupplierActionBar>
        }
      />
    </>
  )
}
