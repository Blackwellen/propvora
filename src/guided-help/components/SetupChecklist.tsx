"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { SETUP_CHECKLIST } from "../data/defaultTutorialTemplates"
import type { ChecklistMetric } from "../tutorial-types"

const METRIC_TABLE: Record<ChecklistMetric, string> = {
  properties: "properties",
  units: "units",
  tenancies: "tenancies",
  contacts: "contacts",
  documents: "documents",
  team: "workspace_members",
}

async function countFor(
  supabase: ReturnType<typeof createClient>,
  metric: ChecklistMetric,
  workspaceId: string
): Promise<number> {
  try {
    const table = METRIC_TABLE[metric]
    const q = supabase.from(table).select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId)
    const { count, error } = await q
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

export default function SetupChecklist({ workspaceId, compact = false }: { workspaceId?: string; compact?: boolean }) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const entries = await Promise.all(
        SETUP_CHECKLIST.map(async (item) => [item.metric, await countFor(supabase, item.metric, workspaceId)] as const)
      )
      if (!cancelled) {
        const map: Record<string, number> = {}
        for (const [m, c] of entries) map[m] = c
        setCounts(map)
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [workspaceId])

  const items = SETUP_CHECKLIST.map((i) => ({ ...i, done: (counts[i.metric] ?? 0) > 0 }))
  const doneCount = items.filter((i) => i.done).length
  const pct = Math.round((doneCount / items.length) * 100)

  if (doneCount === items.length && !loading) {
    return compact ? null : (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">
        🎉 Your workspace is set up. Nice work!
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Get started</h3>
          <span className="text-xs font-semibold text-slate-500">{doneCount}/{items.length}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-[#2563EB] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ul className="divide-y divide-slate-50">
        {items.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 group">
              {item.done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? "text-slate-400 line-through" : "text-slate-800"}`}>{item.label}</p>
                {!item.done && !compact && <p className="text-xs text-slate-400">{item.description}</p>}
              </div>
              {!item.done && <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] shrink-0" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
