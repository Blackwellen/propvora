"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Plus, ShieldCheck, Loader2, Filter } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { loadRecipes, installRecipe } from "./api"

type Recipe = { slug: string; name: string; description: string; domain: string; minPlan: string; recommended: boolean; nodeCount: number; actionCount: number }

const DOMAIN_LABEL: Record<string, string> = {
  booking: "Booking", supplier: "Supplier", marketplace: "Marketplace", money: "Money",
  compliance: "Compliance", legal: "Legal", customer: "Customer",
}

export default function RecipesClient() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [domain, setDomain] = useState<string>("all")
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    loadRecipes().then((r) => { if (r.ok) setRecipes(r.recipes) }).finally(() => setLoading(false))
  }, [])

  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 3500) }

  const domains = useMemo(() => Array.from(new Set(recipes.map((r) => r.domain))), [recipes])
  const visible = domain === "all" ? recipes : recipes.filter((r) => r.domain === domain)

  async function install(slug: string) {
    setBusy(slug)
    try {
      const res = await installRecipe({ workspaceId, slug })
      if (res.ok && res.definitionId) {
        flash("Installed as a disabled draft — review and enable it.")
        router.push(`/property-manager/automations/canvas/${res.definitionId}`)
      } else {
        flash(res.error ?? "Couldn't install the recipe.")
      }
    } finally { setBusy(null) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm text-emerald-800"><span className="font-semibold">Review-first.</span> Installing a recipe creates a <span className="font-semibold">disabled draft</span> in your workspace. Nothing runs until you review and enable it — and high-risk steps always require approval.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <button onClick={() => setDomain("all")} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${domain === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>All</button>
        {domains.map((d) => (
          <button key={d} onClick={() => setDomain(d)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${domain === d ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{DOMAIN_LABEL[d] ?? d}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <div key={r.slug} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[var(--brand)] to-violet-500 text-white"><Sparkles className="h-4 w-4" /></span>
                {r.recommended && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Recommended</span>}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{r.name}</h3>
              <p className="mt-1 flex-1 text-xs text-slate-500">{r.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{DOMAIN_LABEL[r.domain] ?? r.domain}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{r.minPlan}+</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{r.nodeCount} nodes</span>
              </div>
              <button onClick={() => install(r.slug)} disabled={busy === r.slug}
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)] disabled:opacity-50">
                {busy === r.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Install draft
              </button>
            </div>
          ))}
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">{toast}</div>}
    </div>
  )
}
