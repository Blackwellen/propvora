"use client"

import { useMemo, useState } from "react"
import {
  Wrench, Search, ChevronRight, AlertTriangle, CalendarClock, CheckCircle2, Phone,
  LifeBuoy, MessageSquare, FileText, KeyRound, Clock,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  PortalCard, PortalSectionCard, PortalKpiStrip, StatusChip, PortalEmptyState,
  PortalButtonLink, PortalAlertBanner, type PortalKpi, type PortalTone,
} from "@/components/portals/portal-ui"

export interface MaintRow {
  id: string
  title: string
  status: string
  created_at: string | null
  scheduled_date?: string | null
  priority?: string | null
  area?: string | null
}

const STATUS: Record<string, { label: string; tone: PortalTone; next: string }> = {
  new: { label: "Submitted", tone: "blue", next: "Awaiting review" },
  scoped: { label: "Reviewing", tone: "blue", next: "Being assessed" },
  supplier_requested: { label: "Arranging", tone: "amber", next: "Finding contractor" },
  quote_received: { label: "Arranging", tone: "violet", next: "Quote in review" },
  approved: { label: "Approved", tone: "blue", next: "Scheduling visit" },
  scheduled: { label: "Scheduled", tone: "blue", next: "Visit booked" },
  in_progress: { label: "In progress", tone: "blue", next: "Work underway" },
  complete: { label: "Resolved", tone: "emerald", next: "Completed" },
  invoiced: { label: "Resolved", tone: "emerald", next: "Completed" },
  closed: { label: "Closed", tone: "slate", next: "Closed" },
  disputed: { label: "Disputed", tone: "red", next: "Under review" },
}
const DONE = ["complete", "invoiced", "closed"]
function fmtDate(iso: string | null | undefined) { if (!iso) return "—"; const d = new Date(iso); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }
function prio(p: string | null | undefined): { label: string; tone: PortalTone } {
  const v = (p ?? "medium").toLowerCase()
  if (v === "urgent" || v === "emergency") return { label: "Urgent", tone: "red" }
  if (v === "high") return { label: "High", tone: "amber" }
  if (v === "low") return { label: "Low", tone: "slate" }
  return { label: "Medium", tone: "blue" }
}

export default function PortalMaintenanceClient({ rows, base }: { rows: MaintRow[]; base: string }) {
  const [tab, setTab] = useState<"active" | "completed">("active")
  const [search, setSearch] = useState("")

  const open = rows.filter((r) => !DONE.includes(r.status))
  const scheduled = rows.filter((r) => r.status === "scheduled")
  const resolved90 = rows.filter((r) => DONE.includes(r.status) && r.created_at && Date.now() - new Date(r.created_at).getTime() < 90 * 86_400_000)

  const filtered = useMemo(() => {
    let r = tab === "active" ? open : rows.filter((x) => DONE.includes(x.status))
    if (search) { const q = search.toLowerCase(); r = r.filter((x) => x.title.toLowerCase().includes(q)) }
    return r
  }, [rows, tab, search, open])

  const kpis: PortalKpi[] = [
    { label: "Open requests", value: String(open.length), icon: Wrench, tone: open.length ? "amber" : "emerald", href: undefined },
    { label: "Visits scheduled", value: String(scheduled.length), icon: CalendarClock, tone: "blue" },
    { label: "Resolved (90 days)", value: String(resolved90.length), icon: CheckCircle2, tone: "emerald" },
    { label: "Emergency guidance", value: "Email us", sub: "support@propvora.com", icon: Phone, tone: "red" },
  ]

  return (
    <div className="space-y-5">
      <PortalKpiStrip kpis={kpis} cols={4} />

      <PortalAlertBanner tone="red" icon={AlertTriangle} title="What counts as an emergency?"
        action={<a href="mailto:support@propvora.com" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/70 text-red-700 text-[13px] font-semibold hover:bg-white"><Phone className="w-4 h-4" /> Email us now</a>}>
        Gas leaks, flooding, no heating in winter, or anything risking safety — contact us immediately and we will coordinate the response.
      </PortalAlertBanner>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1 bg-white border border-[#E2EAF6] rounded-xl p-1">
              <button onClick={() => setTab("active")} className={cn("h-8 px-3 rounded-lg text-xs font-semibold", tab === "active" ? "bg-[#2563EB] text-white" : "text-slate-500 hover:bg-slate-50")}>Active requests</button>
              <button onClick={() => setTab("completed")} className={cn("h-8 px-3 rounded-lg text-xs font-semibold", tab === "completed" ? "bg-[#2563EB] text-white" : "text-slate-500 hover:bg-slate-50")}>Completed</button>
            </div>
            <div className="relative w-full sm:w-56"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests…" className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E2EAF6] text-sm outline-none focus:border-[#2563EB]" /></div>
          </div>

          <PortalCard className="overflow-hidden">
            {filtered.length === 0 ? (
              <PortalEmptyState icon={Wrench} title={tab === "active" ? "No active requests" : "No completed requests"} description="Report a repair and track its progress here." action={<PortalButtonLink href={`${base}/maintenance/report`} variant="primary" icon={Wrench}>Report a repair</PortalButtonLink>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead><tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]">
                    <th className="px-4 py-3">Issue</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Reported</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Next step</th><th className="px-4 py-3 text-right">Action</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#F1F5FB]">
                    {filtered.map((r) => {
                      const st = STATUS[r.status] ?? { label: r.status, tone: "slate" as PortalTone, next: "—" }
                      const p = prio(r.priority)
                      return (
                        <tr key={r.id} className="hover:bg-[#FAFCFF]">
                          <td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Wrench className="w-4 h-4" /></span><div className="min-w-0"><p className="font-semibold text-[#071B4D] truncate max-w-[200px]">{r.title}</p><p className="text-[11px] text-slate-400">#{r.id.slice(0, 8).toUpperCase()}</p></div></div></td>
                          <td className="px-4 py-3"><StatusChip tone={p.tone}>{p.label}</StatusChip></td>
                          <td className="px-4 py-3 text-slate-500">{fmtDate(r.created_at)}</td>
                          <td className="px-4 py-3"><StatusChip tone={st.tone} dot>{st.label}</StatusChip></td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{st.next}</td>
                          <td className="px-4 py-3 text-right"><Link href={`${base}/maintenance/${r.id}`} className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]">View <ChevronRight className="w-3.5 h-3.5" /></Link></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </PortalCard>

          {/* Bottom support strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PortalButtonLink href={`${base}/messages`} icon={MessageSquare} className="justify-center">Message our team</PortalButtonLink>
            <PortalButtonLink href={`${base}/messages`} icon={MessageSquare} className="justify-center">View messages</PortalButtonLink>
            <PortalButtonLink href={`${base}/maintenance`} icon={Clock} className="justify-center">Maintenance history</PortalButtonLink>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <PortalSectionCard title="Quick help & troubleshooting" icon={LifeBuoy}>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Boiler low pressure? Check the gauge (1–1.5 bar).</li>
              <li>No hot water? Reset the boiler before reporting.</li>
              <li>Tripped fuse? Reset the consumer unit switch.</li>
            </ul>
          </PortalSectionCard>
          <PortalSectionCard title="Preferred access details" icon={KeyRound}>
            <p className="text-xs text-slate-500">Add access notes so contractors can reach you faster.</p>
            <PortalButtonLink href={`${base}/messages`} variant="ghost" className="mt-2">Update access details</PortalButtonLink>
          </PortalSectionCard>
          {scheduled.length > 0 && (
            <PortalSectionCard title="Upcoming appointment" icon={CalendarClock}>
              <p className="text-sm font-semibold text-[#071B4D]">{scheduled[0].title}</p>
              <p className="text-xs text-slate-400">{fmtDate(scheduled[0].scheduled_date ?? scheduled[0].created_at)}</p>
            </PortalSectionCard>
          )}
          <PortalCard className="p-4"><div className="flex items-start gap-2.5"><span className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><Phone className="w-4 h-4" /></span><div><p className="text-sm font-semibold text-[#071B4D]">Out-of-hours emergency</p><p className="text-xs text-slate-400 mt-0.5">Email <a href="mailto:support@propvora.com" className="font-semibold text-red-600">support@propvora.com</a> for gas, flood or fire — we always respond to urgent issues.</p></div></div></PortalCard>
        </div>
      </div>
    </div>
  )
}
