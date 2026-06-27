"use client"

/* ──────────────────────────────────────────────────────────────────────────
   TeamDispatchBoard — manifest image 8 (Team Jobs: Dispatch Board).

   Unassigned jobs + per-worker columns with skill/area match, route order,
   travel time, SLA risk and a route-map preview. Plan-gated (team/enterprise),
   reached via /supplier/jobs?tab=dispatch. Assign actions are typed stubs
   (toast + audit TODO) until the dispatch endpoint lands.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import Link from "next/link"
import { Truck, MapPin, Clock, AlertTriangle, ChevronRight, Zap, Navigation } from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner } from "@/components/supplier-workspace/ui"
import {
  DISPATCH_WORKERS, DISPATCH_UNASSIGNED, DISPATCH_ASSIGNED,
  type DispatchJob, type JobPriority,
} from "@/features/supplier/team/data/jobs"

const PRIORITY: Record<JobPriority, { cls: string; bar: string; label: string }> = {
  emergency: { cls: "bg-red-50 text-red-700", bar: "bg-red-500", label: "Emergency" },
  high: { cls: "bg-amber-50 text-amber-700", bar: "bg-amber-500", label: "High" },
  standard: { cls: "bg-slate-100 text-slate-600", bar: "bg-slate-300", label: "Standard" },
}

function slaLabel(m: number): string {
  return m < 60 ? `${m}m` : `${Math.round(m / 60)}h`
}

export function TeamDispatchBoard() {
  const [toast, setToast] = useState<string | null>(null)
  const [unassigned, setUnassigned] = useState<DispatchJob[]>(DISPATCH_UNASSIGNED)
  const [assigned, setAssigned] = useState<Record<string, DispatchJob[]>>(DISPATCH_ASSIGNED)

  function assign(job: DispatchJob, workerId: string) {
    // STUB: TODO POST dispatch + audit `job.dispatched`. Optimistic for now.
    const worker = DISPATCH_WORKERS.find((w) => w.id === workerId)
    setUnassigned((u) => u.filter((j) => j.id !== job.id))
    setAssigned((a) => ({ ...a, [workerId]: [...(a[workerId] ?? []), { ...job, assignedWorkerId: workerId }] }))
    setToast(`${job.ref} dispatched to ${worker?.name ?? "worker"}.`)
  }

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Mini label="Unassigned" value={String(unassigned.length)} tone="amber" icon={Truck} />
        <Mini label="Emergency" value={String(unassigned.filter((j) => j.priority === "emergency").length)} tone="red" icon={Zap} />
        <Mini label="Available workers" value={String(DISPATCH_WORKERS.filter((w) => w.status === "available").length)} tone="emerald" icon={MapPin} />
        <Mini label="On a job" value={String(DISPATCH_WORKERS.filter((w) => w.status === "on_job").length)} tone="blue" icon={Navigation} />
        <Mini label="Avg SLA" value="—" tone="slate" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        {/* Board */}
        <div className="space-y-4 min-w-0">
          {/* Unassigned queue */}
          <SupplierCard className="p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Unassigned jobs <span className="text-slate-400 font-normal">({unassigned.length})</span></h2>
            {unassigned.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">All jobs dispatched 🎉</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unassigned.map((j) => {
                  const p = PRIORITY[j.priority]
                  const match = DISPATCH_WORKERS.find((w) => w.trade === j.trade && w.status === "available")
                  return (
                    <div key={j.id} className="flex items-stretch gap-2.5 rounded-xl border border-slate-200 p-2.5">
                      <span className={cn("w-1.5 rounded-full shrink-0", p.bar)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">{j.title}</p>
                        <p className="text-[11px] text-slate-400">{j.ref} · {j.area} · {j.trade}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", p.cls)}>{p.label}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{slaLabel(j.slaMins)}</span>
                          {j.travelMins != null && <span className="text-[11px] text-slate-400">{j.travelMins}m away</span>}
                        </div>
                        <div className="mt-2">
                          <SupplierButton size="sm" onClick={() => assign(j, match?.id ?? DISPATCH_WORKERS[0]?.id ?? "")} className="w-full justify-center">
                            <Truck className="w-3.5 h-3.5" /> {match ? `Assign ${match.name.split(" ")[0]}` : "Assign"}
                          </SupplierButton>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SupplierCard>

          {/* Worker columns */}
          {DISPATCH_WORKERS.length === 0 && (
            <SupplierCard className="p-8 text-center"><Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">No team members yet</p><p className="text-xs text-slate-400 mt-1">Invite your team to assign and dispatch jobs.</p></SupplierCard>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DISPATCH_WORKERS.map((w) => {
              const jobs = assigned[w.id] ?? []
              return (
                <SupplierCard key={w.id} className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center shrink-0">{w.initials}</span>
                    <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-slate-800 truncate">{w.name}</p><p className="text-[11px] text-slate-400">{w.trade} · {w.area} · {jobs.length} assigned</p></div>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", w.status === "available" ? "bg-emerald-50 text-emerald-700" : w.status === "on_job" ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "bg-slate-100 text-slate-500")}>
                      {w.status === "available" ? "Available" : w.status === "on_job" ? "On job" : "Off"}
                    </span>
                  </div>
                  {jobs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-lg">No jobs assigned</p>
                  ) : (
                    <ol className="space-y-1.5">
                      {jobs.map((j, i) => {
                        const p = PRIORITY[j.priority]
                        return (
                          <li key={j.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
                            <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-500 flex items-center justify-center shrink-0">{i + 1}</span>
                            <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-slate-700 truncate">{j.title}</p><p className="text-[10px] text-slate-400">{j.ref}</p></div>
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", p.bar)} />
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </SupplierCard>
              )
            })}
          </div>
        </div>

        {/* Route map preview + quick actions */}
        <div className="space-y-4">
          <SupplierCard className="p-4">
            <div className="flex items-center justify-between mb-2"><h2 className="text-sm font-semibold text-slate-900">Route preview</h2></div>
            <div className="relative aspect-square rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(0deg,transparent 24%,rgba(0,0,0,.04) 25%,rgba(0,0,0,.04) 26%,transparent 27%),linear-gradient(90deg,transparent 24%,rgba(0,0,0,.04) 25%,rgba(0,0,0,.04) 26%,transparent 27%)", backgroundSize: "28px 28px" }} />
              <p className="relative text-xs text-slate-400 text-center px-4">Route preview appears once jobs are assigned</p>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">No route planned yet.</p>
          </SupplierCard>

          <SupplierCard className="p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Quick actions</h2>
            <div className="space-y-1.5">
              <button onClick={() => setToast("Auto-dispatch suggested 4 assignments.")} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Zap className="w-4 h-4 text-amber-500" /> Auto-suggest dispatch</button>
              <Link href="/supplier/jobs" className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Truck className="w-4 h-4 text-slate-400" /> All jobs <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" /></Link>
            </div>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

function Mini({ label, value, tone, icon: Icon }: { label: string; value: string; tone: "blue" | "emerald" | "red" | "amber" | "slate"; icon: typeof Truck }) {
  const c = tone === "blue" ? "text-[var(--brand)]" : tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-slate-900"
  return (
    <SupplierCard className="p-3.5">
      <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span><Icon className="w-3.5 h-3.5 text-slate-300" /></div>
      <p className={cn("text-xl font-bold mt-1", c)}>{value}</p>
    </SupplierCard>
  )
}
