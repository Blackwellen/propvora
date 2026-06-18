"use client"

import React, { Suspense, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Inbox, Send, Trophy, XCircle, Archive } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { SupplierTabs, type SupplierTabItem } from "@/components/supplier-workspace/ui"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { useSupplierRequests } from "./data/hooks"
import { REQUEST_TABS, type RequestTab } from "./data/types"
import { RequestsToastProvider } from "./components/primitives"
import { NewTab } from "./components/NewTab"
import { QuotedTab } from "./components/QuotedTab"
import { WonTab } from "./components/WonTab"
import { LostTab } from "./components/LostTab"
import { ArchivedTab } from "./components/ArchivedTab"

/* ──────────────────────────────────────────────────────────────────────────
   Solo Supplier → Requests — the sales pipeline.

   Five route-aware tabs (?tab=new|quoted|won|lost|archived, default new):
   New · Quoted · Won · Lost · Archived. Plan-gated via useSupplierPlan() —
   built SOLO-first; Team extension points left where relevant (no team-only
   controls are added here).
─────────────────────────────────────────────────────────────────────────── */

const TAB_META: { key: RequestTab; label: string; icon: React.ElementType }[] = [
  { key: "new", label: "New", icon: Inbox },
  { key: "quoted", label: "Quoted", icon: Send },
  { key: "won", label: "Won", icon: Trophy },
  { key: "lost", label: "Lost", icon: XCircle },
  { key: "archived", label: "Archived", icon: Archive },
]

function isTab(v: string | null): v is RequestTab {
  return v != null && (REQUEST_TABS as string[]).includes(v)
}

function RequestsPipelineInner() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { isTeam } = useSupplierPlan() // Team extension point: drives shared-pipeline / assignment controls (not surfaced for Solo)

  const urlTab = params.get("tab")
  const active: RequestTab = isTab(urlTab) ? urlTab : "new"

  const env = useSupplierRequests()
  const all = env.data

  const byTab = useMemo(() => {
    const m: Record<RequestTab, typeof all> = { new: [], quoted: [], won: [], lost: [], archived: [] }
    for (const r of all) m[r.tab].push(r)
    return m
  }, [all])

  function selectTab(key: string) {
    const next = new URLSearchParams(Array.from(params.entries()))
    next.set("tab", key)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  const tabItems: SupplierTabItem[] = TAB_META.map((t) => ({
    key: t.key,
    label: t.label,
    icon: t.icon,
    count: env.loading ? undefined : byTab[t.key].length,
  }))

  return (
    <RequestsToastProvider>
      <div className="space-y-5">
        <MobileTopBar title="Requests" subtitle="Your sales pipeline" />

        <div className="hidden md:block">
          <h1 className="text-xl font-semibold text-slate-900">Requests</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Your sales pipeline — from incoming leads through quotes, won work and the archive.
          </p>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <SupplierTabs active={active} onChange={selectTab} tabs={tabItems} />
        </div>

        <div>
          {active === "new" && <NewTab env={env} rows={byTab.new} />}
          {active === "quoted" && <QuotedTab env={env} rows={byTab.quoted} />}
          {active === "won" && <WonTab env={env} rows={byTab.won} />}
          {active === "lost" && <LostTab env={env} rows={byTab.lost} />}
          {active === "archived" && <ArchivedTab env={env} rows={byTab.archived} />}
        </div>
      </div>
    </RequestsToastProvider>
  )
}

export function RequestsPipeline() {
  return (
    <Suspense fallback={<div className="min-h-[420px] rounded-xl border border-slate-200 bg-white" />}>
      <RequestsPipelineInner />
    </Suspense>
  )
}
