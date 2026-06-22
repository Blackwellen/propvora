"use client"

/* ──────────────────────────────────────────────────────────────────────────
   TeamCommandCentre — Team/Enterprise supplier overview.

   Manifest image 1 (Command Centre, default) and image 2 (Capacity & SLA Risk,
   ?section=capacity-risk). Plan-gated: only rendered for team/enterprise plans
   (Solo keeps the existing tab hub). Reuses the existing /supplier shell + the
   supplier-workspace UI kit. Actions are typed stubs (toast + audit TODO) until
   the dispatch/assignment endpoints are wired.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Users, Inbox, Wrench, AlertTriangle, Images as ImagesIcon, FileCheck2, TrendingUp,
  PoundSterling, Send, Truck, ShieldAlert, MessageSquare, ArrowRight, UserPlus,
  Gauge, Clock, MapPin, CalendarClock, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner } from "@/components/supplier-workspace/ui"
import { moneyPence } from "@/components/supplier-workspace/format"
import {
  TEAM_OVERVIEW_KPIS, TEAM_WORKER_LOAD, TEAM_DISPATCH_QUEUE, TEAM_QUOTE_APPROVALS,
  TEAM_REVENUE_BY_MEMBER, TEAM_COMPLIANCE_BLOCKERS, TEAM_RECENT_MESSAGES,
  TEAM_REVENUE_SNAPSHOT, TEAM_JOBS_AT_RISK, TEAM_CAPACITY_HEATMAP,
  type TeamKpi, type WorkerLoad,
} from "@/features/supplier/team/data/overview"

const KPI_ICON: Record<string, typeof Users> = {
  utilisation: Gauge, open_requests: Inbox, awaiting_assignment: Truck, active_jobs: Wrench,
  sla_risk: AlertTriangle, overdue_evidence: ImagesIcon, quote_approvals: FileCheck2, win_rate: TrendingUp,
}

const TONE_TEXT: Record<NonNullable<TeamKpi["tone"]>, string> = {
  emerald: "text-emerald-600", amber: "text-amber-600", red: "text-red-600", blue: "text-[#2563EB]", slate: "text-slate-900",
}

const WORKER_STATUS: Record<WorkerLoad["status"], { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-emerald-50 text-emerald-700" },
  busy: { label: "Busy", cls: "bg-blue-50 text-blue-700" },
  overbooked: { label: "Overbooked", cls: "bg-red-50 text-red-700" },
  off: { label: "Off", cls: "bg-slate-100 text-slate-500" },
}

export function TeamCommandCentre() {
  const params = useSearchParams()
  const section = params.get("section") === "capacity-risk" ? "capacity-risk" : "overview"
  const [toast, setToast] = useState<string | null>(null)
  const act = (msg: string) => setToast(msg) // STUB: TODO wire dispatch/assignment + audit

  if (section === "capacity-risk") return <CapacityRisk toast={toast} setToast={setToast} act={act} />

  return (
    <div className="space-y-5">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Command Centre</h1>
          <p className="text-sm text-slate-500">Your team at a glance — dispatch, approvals and risk in one place.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/supplier/jobs?tab=dispatch"><SupplierButton><Truck className="w-4 h-4" /> Assign work</SupplierButton></Link>
          <Link href="/supplier/requests?tab=quotes&view=approvals"><SupplierButton variant="outline"><FileCheck2 className="w-4 h-4" /> Quote approvals</SupplierButton></Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {TEAM_OVERVIEW_KPIS.map((k) => {
          const Icon = KPI_ICON[k.key] ?? Gauge
          return (
            <SupplierCard key={k.key} className="p-3.5">
              <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide leading-tight">{k.label}</span><Icon className="w-3.5 h-3.5 text-slate-300" /></div>
              <p className={cn("text-xl font-bold mt-1", TONE_TEXT[k.tone ?? "slate"])}>{k.value}</p>
              {k.sub && <p className="text-[10px] text-slate-400 truncate">{k.sub}</p>}
            </SupplierCard>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          {/* Team workload + dispatch queue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SupplierCard className="p-5">
              <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900">Team workload</h2><Link href="/supplier/schedule" className="text-xs font-semibold text-blue-600">Capacity</Link></div>
              {TEAM_WORKER_LOAD.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No team members yet. Invite your team to see workload here.</p>}
              <div className="space-y-2.5">
                {TEAM_WORKER_LOAD.map((w) => {
                  const st = WORKER_STATUS[w.status]
                  return (
                    <div key={w.id} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center shrink-0">{w.initials}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-semibold text-slate-800 truncate">{w.name}</p><span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", st.cls)}>{st.label}</span></div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={cn("h-full rounded-full", w.utilisationPct >= 90 ? "bg-red-500" : w.utilisationPct >= 70 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${w.utilisationPct}%` }} /></div>
                          <span className="text-[11px] text-slate-400 w-16 text-right">{w.jobsToday} jobs · {w.utilisationPct}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SupplierCard>

            <SupplierCard className="p-5">
              <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900">Dispatch queue</h2><Link href="/supplier/jobs?tab=dispatch" className="text-xs font-semibold text-blue-600">Open board</Link></div>
              {TEAM_DISPATCH_QUEUE.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">Nothing waiting to dispatch.</p>}
              <div className="space-y-2">
                {TEAM_DISPATCH_QUEUE.map((d) => (
                  <div key={d.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5">
                    <span className={cn("w-1.5 h-10 rounded-full shrink-0", d.priority === "emergency" ? "bg-red-500" : d.priority === "high" ? "bg-amber-500" : "bg-slate-300")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{d.title}</p>
                      <p className="text-[11px] text-slate-400">{d.area} · SLA {d.slaMins < 60 ? `${d.slaMins}m` : `${Math.round(d.slaMins / 60)}h`}{d.suggestedWorker ? ` · suggest ${d.suggestedWorker}` : ""}</p>
                    </div>
                    <SupplierButton size="sm" onClick={() => act(`Assigned ${d.ref}${d.suggestedWorker ? ` to ${d.suggestedWorker}` : ""}.`)}>Assign</SupplierButton>
                  </div>
                ))}
              </div>
            </SupplierCard>
          </div>

          {/* Quote approvals + revenue by member */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SupplierCard className="p-5">
              <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900">Quote approvals</h2><Link href="/supplier/requests?tab=quotes&view=approvals" className="text-xs font-semibold text-blue-600">Review all</Link></div>
              {TEAM_QUOTE_APPROVALS.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No quotes awaiting approval.</p>}
              <div className="space-y-2">
                {TEAM_QUOTE_APPROVALS.map((q) => (
                  <div key={q.id} className="flex items-center gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{q.customer} {q.riskFlag && <AlertTriangle className="w-3 h-3 text-amber-500 inline" />}</p>
                      <p className="text-[11px] text-slate-400">{q.ref} · {moneyPence(q.valuePence)} · {q.marginPct}% margin · {q.estimator}</p>
                    </div>
                    <Link href={`/supplier/quotes/${q.ref}`}><SupplierButton size="sm" variant="outline">Open</SupplierButton></Link>
                  </div>
                ))}
              </div>
            </SupplierCard>

            <SupplierCard className="p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Revenue by team member</h2>
              {TEAM_REVENUE_BY_MEMBER.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No team revenue yet.</p>}
              <div className="space-y-2.5">
                {TEAM_REVENUE_BY_MEMBER.map((m, i) => {
                  const max = TEAM_REVENUE_BY_MEMBER[0]?.revenuePence || 1
                  return (
                    <div key={m.name} className="flex items-center gap-2.5">
                      <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                      <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center justify-center shrink-0">{m.initials}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-medium text-slate-700 truncate">{m.name}</p><span className="text-[12px] font-bold text-slate-900">{moneyPence(m.revenuePence)}</span></div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1"><div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${(m.revenuePence / max) * 100}%` }} /></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SupplierCard>
          </div>

          {/* Compliance blockers + messages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SupplierCard className="p-5">
              <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-amber-500" /> Compliance blockers</h2><Link href="/supplier/compliance?tab=expiry-tracker" className="text-xs font-semibold text-blue-600">Resolve</Link></div>
              {TEAM_COMPLIANCE_BLOCKERS.length === 0 && <p className="text-sm text-slate-400 py-2">No compliance blockers.</p>}
              <ul className="space-y-2">
                {TEAM_COMPLIANCE_BLOCKERS.map((c) => (
                  <li key={c.id} className="flex items-start gap-2 text-sm">
                    <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", c.severity === "critical" ? "bg-red-500" : "bg-amber-500")} />
                    <span className="text-slate-700">{c.label}{c.worker ? <span className="text-slate-400"> · {c.worker}</span> : ""}</span>
                  </li>
                ))}
              </ul>
            </SupplierCard>

            <SupplierCard className="p-5">
              <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-slate-400" /> Recent messages</h2><Link href="/supplier/inbox" className="text-xs font-semibold text-blue-600">Inbox</Link></div>
              {TEAM_RECENT_MESSAGES.length === 0 && <p className="text-sm text-slate-400 py-2">No recent messages.</p>}
              <ul className="space-y-2.5">
                {TEAM_RECENT_MESSAGES.map((m) => (
                  <li key={m.id} className="flex items-start gap-2">
                    {m.unread && <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />}
                    <div className={cn("min-w-0 flex-1", !m.unread && "pl-4")}>
                      <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-semibold text-slate-800 truncate">{m.from}</p><span className="text-[11px] text-slate-400">{m.at}</span></div>
                      <p className="text-xs text-slate-500 truncate">{m.preview}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </SupplierCard>
          </div>
        </div>

        {/* Right action rail */}
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Revenue snapshot</h2>
            <p className="text-2xl font-bold text-slate-900">{moneyPence(TEAM_REVENUE_SNAPSHOT.grossPence)}</p>
            <p className="text-xs text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> +{TEAM_REVENUE_SNAPSHOT.changePct}% this month</p>
            <p className="text-xs text-slate-400 mt-1">Net {moneyPence(TEAM_REVENUE_SNAPSHOT.netPence)} after fees</p>
            <Link href="/supplier/finance?tab=earnings&view=team" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">Open finance <ArrowRight className="w-3.5 h-3.5" /></Link>
          </SupplierCard>

          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick actions</h2>
            <div className="space-y-1.5">
              <RailLink href="/supplier/requests" icon={Inbox} label="Open requests" />
              <RailLink href="/supplier/jobs?tab=dispatch" icon={Truck} label="Dispatch board" />
              <RailLink href="/supplier/overview?section=capacity-risk" icon={Gauge} label="Team capacity & risk" />
              <RailLink href="/supplier/requests?tab=quotes&view=approvals" icon={FileCheck2} label="Review quote approvals" />
              <button onClick={() => act("Invite sent.")} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><UserPlus className="w-4 h-4" /></span> Invite team member</button>
            </div>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

function RailLink({ href, icon: Icon, label }: { href: string; icon: typeof Inbox; label: string }) {
  return (
    <Link href={href} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><Icon className="w-4 h-4" /></span>
      {label}
      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
    </Link>
  )
}

// ── Capacity & SLA Risk (image 2) ─────────────────────────────────────────────

function heatColor(v: number): string {
  if (v >= 90) return "bg-red-500"
  if (v >= 70) return "bg-amber-400"
  if (v >= 40) return "bg-emerald-400"
  if (v > 0) return "bg-emerald-200"
  return "bg-slate-100"
}

function CapacityRisk({ toast, setToast, act }: { toast: string | null; setToast: (v: string | null) => void; act: (m: string) => void }) {
  const hours = ["08", "09", "10", "11", "12", "13", "14", "15"]
  const available = TEAM_WORKER_LOAD.filter((w) => w.status === "available").length
  const overbooked = TEAM_WORKER_LOAD.filter((w) => w.status === "overbooked").length

  return (
    <div className="space-y-5">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/supplier/overview" className="text-xs font-semibold text-slate-400 hover:text-slate-600">← Command Centre</Link>
          <h1 className="text-xl font-semibold text-slate-900 mt-1">Team Capacity &amp; SLA Risk</h1>
        </div>
        <Link href="/supplier/jobs?tab=dispatch"><SupplierButton><Truck className="w-4 h-4" /> Open dispatch</SupplierButton></Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <Mini label="Utilisation" value="—" icon={Gauge} tone="blue" />
        <Mini label="Available" value={String(available)} icon={Users} tone="emerald" />
        <Mini label="Overbooked" value={String(overbooked)} icon={AlertTriangle} tone="red" />
        <Mini label="Jobs at risk" value={String(TEAM_JOBS_AT_RISK.length)} icon={AlertTriangle} tone="amber" />
        <Mini label="Route conflicts" value="0" icon={MapPin} tone="amber" />
        <Mini label="Evidence overdue" value="0" icon={ImagesIcon} tone="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          {/* Capacity heatmap */}
          <SupplierCard className="p-5 overflow-x-auto">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Team booking heatmap</h2>
            {TEAM_CAPACITY_HEATMAP.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No capacity data yet. Add team members and bookings to see the heatmap.</p>}
            <div className="min-w-[520px]">
              <div className="grid grid-cols-[120px_repeat(8,1fr)] gap-1 mb-1">
                <span />
                {hours.map((h) => <span key={h} className="text-[10px] text-slate-400 text-center">{h}:00</span>)}
              </div>
              {TEAM_CAPACITY_HEATMAP.map((row) => (
                <div key={row.worker} className="grid grid-cols-[120px_repeat(8,1fr)] gap-1 mb-1 items-center">
                  <span className="text-[12px] font-medium text-slate-700 truncate">{row.worker}</span>
                  {row.hours.map((v, i) => (
                    <div key={i} className={cn("h-6 rounded", heatColor(v))} title={`${v}%`} />
                  ))}
                </div>
              ))}
            </div>
          </SupplierCard>

          {/* Jobs at risk */}
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Jobs at risk</h2>
            {TEAM_JOBS_AT_RISK.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No jobs currently at risk.</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="py-2 pr-3">Job</th><th className="py-2 px-3">Worker</th><th className="py-2 px-3">Reason</th><th className="py-2 px-3">SLA</th><th className="py-2 pl-3" /></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {TEAM_JOBS_AT_RISK.map((j) => (
                    <tr key={j.id}>
                      <td className="py-2.5 pr-3"><p className="font-semibold text-slate-800">{j.title}</p><p className="text-[11px] text-slate-400">{j.ref}</p></td>
                      <td className="py-2.5 px-3 text-slate-600">{j.worker ?? <span className="text-red-600 font-medium">Unassigned</span>}</td>
                      <td className="py-2.5 px-3 text-slate-500">{j.reason}</td>
                      <td className="py-2.5 px-3"><span className={cn("text-xs font-semibold", j.slaMins < 0 ? "text-red-600" : j.slaMins < 60 ? "text-amber-600" : "text-slate-600")}>{j.slaMins < 0 ? `${Math.abs(j.slaMins)}m over` : `${j.slaMins}m`}</span></td>
                      <td className="py-2.5 pl-3 text-right"><SupplierButton size="sm" variant="outline" onClick={() => act(`Reassigning ${j.ref}…`)}>Reassign</SupplierButton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SupplierCard>
        </div>

        {/* Worker panel */}
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Workers</h2>
            {TEAM_WORKER_LOAD.length === 0 && <p className="text-sm text-slate-400 py-2">No team members yet.</p>}
            <div className="space-y-2.5">
              {TEAM_WORKER_LOAD.map((w) => {
                const st = WORKER_STATUS[w.status]
                return (
                  <div key={w.id} className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center shrink-0">{w.initials}</span>
                    <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-slate-800 truncate">{w.name}</p><p className="text-[11px] text-slate-400">{w.role}{w.nextFreeAt ? ` · free ${w.nextFreeAt}` : ""}</p></div>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", st.cls)}>{st.label}</span>
                  </div>
                )
              })}
            </div>
            <button onClick={() => act("Opening engineer messaging…")} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><MessageSquare className="w-4 h-4" /> Message engineer</button>
          </SupplierCard>

          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick actions</h2>
            <div className="space-y-1.5">
              <button onClick={() => act("Escalated to SLA manager.")} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Clock className="w-4 h-4 text-amber-500" /> Escalate SLA</button>
              <RailLink href="/supplier/schedule" icon={CalendarClock} label="Open schedule" />
              <RailLink href="/supplier/jobs?tab=dispatch" icon={Truck} label="Dispatch board" />
            </div>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

function Mini({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Gauge; tone: "blue" | "emerald" | "red" | "amber" }) {
  return (
    <SupplierCard className="p-3.5">
      <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span><Icon className="w-3.5 h-3.5 text-slate-300" /></div>
      <p className={cn("text-xl font-bold mt-1", tone === "blue" ? "text-[#2563EB]" : tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-amber-600")}>{value}</p>
    </SupplierCard>
  )
}
