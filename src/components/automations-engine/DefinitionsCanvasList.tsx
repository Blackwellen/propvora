"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { LayoutTemplate, Power, ChevronRight, Boxes } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"

type Definition = { id: string; name: string; enabled: boolean; version: number; source: string; trigger?: { type?: string } }

// Lists the v2 node-graph DEFINITIONS for the workspace and links each to its
// canvas. Read-only list — editing happens on the canvas. Tolerant of empty.
export default function DefinitionsCanvasList() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [defs, setDefs] = useState<Definition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""
    fetch(`/api/automations/definitions${q}`)
      .then((r) => r.json())
      .then((r) => { if (r.ok && Array.isArray(r.definitions)) setDefs(r.definitions as Definition[]) })
      .finally(() => setLoading(false))
  }, [workspaceId])

  if (loading) return <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
  if (defs.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
        <Boxes className="h-7 w-7 text-slate-300" />
        <p className="mt-2 text-sm font-medium text-slate-600">No node-graph automations yet.</p>
        <p className="text-xs text-slate-400">Install a recipe or use the AI builder to create one — it opens on the canvas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {defs.map((d) => (
        <Link key={d.id} href={`/property-manager/automations/canvas/${d.id}`}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[var(--color-brand-100)]">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${d.enabled ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "bg-slate-100 text-slate-400"}`}><LayoutTemplate className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-900">{d.name}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${d.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><Power className="h-2.5 w-2.5" /> {d.enabled ? "Enabled" : "Draft"}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">v{d.version}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-500">{d.source}</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
        </Link>
      ))}
    </div>
  )
}
