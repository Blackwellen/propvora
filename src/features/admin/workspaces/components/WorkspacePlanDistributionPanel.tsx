import React from "react"
import Link from "next/link"
import { TrendingUp, Users, Sparkles, ChevronRight } from "lucide-react"
import { AdminSectionCard } from "@/components/admin/ui"

type PlanMixEntry = { label: string; value: number }
type WorkspaceRow = { id: string; name: string; memberCount: number }

interface Props {
  total: number | null
  planMix: PlanMixEntry[]
  topByMembers: WorkspaceRow[]
  newThisMonth: number | null
}

function fmt(n: number | null) { return n === null ? "—" : n.toLocaleString("en-GB") }

export function WorkspacePlanDistributionPanel({ total, planMix, topByMembers, newThisMonth }: Props) {
  return (
    <div className="space-y-4">
      <AdminSectionCard title="Plan distribution" icon={TrendingUp}>
        {planMix.length === 0 ? (
          <p className="text-[12px] text-slate-400 py-2">No workspaces yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {planMix.map((p) => {
              const pct = total ? Math.round((p.value / total) * 100) : 0
              return (
                <li key={p.label}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="capitalize text-slate-600">{p.label}</span>
                    <span className="font-semibold text-[#0B1B3F]">
                      {p.value} <span className="text-slate-400 font-normal">· {pct}%</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Top by activity" icon={Users}>
        {topByMembers.length === 0 ? (
          <p className="text-[12px] text-slate-400 py-2">No workspaces yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {topByMembers.map((w) => (
              <li key={w.id}>
                <Link href={`/admin/workspaces/${w.id}`} className="flex items-center justify-between gap-2 group">
                  <span className="text-[13px] font-medium text-[#0B1B3F] group-hover:text-[var(--brand)] truncate">{w.name}</span>
                  <span className="text-[12px] text-slate-500 shrink-0 inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {w.memberCount}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Growth" icon={Sparkles}>
        <p className="text-[26px] font-bold text-emerald-600 leading-none">+{fmt(newThisMonth)}</p>
        <p className="mt-1.5 text-[12px] text-slate-500">new workspaces created this month.</p>
      </AdminSectionCard>
    </div>
  )
}
