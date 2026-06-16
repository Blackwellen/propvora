"use client"

// Supplier-workspace Automations. A curated, supplier-relevant slice of the
// recipe catalogue (install as a DISABLED DRAFT — never auto-runs) plus a list
// of the supplier's own automations. Same engine, supplier-scoped: workspace
// resolved server-side from supplier_workspace_members. Responsive (mobile +
// tablet + desktop) with a bottom-sheet detail on phones.

import React, { useEffect, useState } from "react"
import { Workflow, Sparkles, CheckCircle2, Loader2, ShieldCheck, AlertTriangle, Power } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { SupplierPageHeader, SupplierCard, SupplierEmptyState } from "@/components/supplier-workspace/ui"

interface RecipeDTO { slug: string; name: string; description: string; domain: string; minPlan: string; recommended: boolean; nodeCount: number }
interface DefDTO { id: string; name?: string; enabled?: boolean; trigger?: { type?: string } }

export default function SupplierAutomationsPage() {
  const [recipes, setRecipes] = useState<RecipeDTO[]>([])
  const [defs, setDefs] = useState<DefDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [installing, setInstalling] = useState<string | null>(null)
  const [installed, setInstalled] = useState<Set<string>>(new Set())
  const [toggling, setToggling] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/supplier/automations", { headers: { "Content-Type": "application/json" } })
      const json = await res.json()
      if (!res.ok || !json.ok) { setErr(json.error ?? "Couldn't load automations."); return }
      setRecipes(json.recipes ?? [])
      setDefs(json.definitions ?? [])
    } catch { setErr("Couldn't load automations.") }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function install(slug: string) {
    setInstalling(slug)
    try {
      const res = await fetch("/api/supplier/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) })
      const json = await res.json()
      if (res.ok && json.ok) { setInstalled((s) => new Set(s).add(slug)); void load() }
      else setErr(json.error ?? "Couldn't install the recipe.")
    } catch { setErr("Couldn't install the recipe.") }
    finally { setInstalling(null) }
  }

  async function toggleEnabled(def: DefDTO) {
    setToggling(def.id)
    try {
      const res = await fetch("/api/supplier/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ definitionId: def.id, enabled: !def.enabled }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        setDefs((prev) => prev.map((d) => d.id === def.id ? { ...d, enabled: !d.enabled } : d))
      } else {
        setErr(json.error ?? "Couldn't update the automation.")
      }
    } catch { setErr("Couldn't update the automation.") }
    finally { setToggling(null) }
  }

  function triggerLabel(type?: string) {
    if (!type) return "review-first"
    return type.replace(/_/g, " ")
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Automations" subtitle="Save time on routine work" />
      <SupplierPageHeader
        title="Automations"
        subtitle="Install ready-made, review-first automations for your supplier work. Each installs disabled — nothing runs until you review and enable it."
      />

      <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-[12px] text-teal-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Automations are review-first and never send money, messages, or legal items automatically — anything sensitive waits for your approval.
      </div>

      {err && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
          <button onClick={() => setErr(null)} className="ml-auto text-amber-600 hover:text-amber-800">Dismiss</button>
        </div>
      )}

      {/* My automations */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Your automations</h2>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : defs.length === 0 ? (
          <SupplierEmptyState icon={Workflow} title="No automations yet" description="Install a recipe below to get started. It will appear here as a disabled draft." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {defs.map((d) => (
              <SupplierCard key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">{d.name ?? "Automation"}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400 capitalize">{triggerLabel(d.trigger?.type)}</div>
                  </div>
                  <span className={["shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", d.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"].join(" ")}>
                    {d.enabled ? "Active" : "Draft"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <button
                    onClick={() => void toggleEnabled(d)}
                    disabled={toggling === d.id}
                    className={[
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                      d.enabled
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {toggling === d.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Power className="h-3.5 w-3.5" />}
                    {d.enabled ? "Disable" : "Enable"}
                  </button>
                </div>
              </SupplierCard>
            ))}
          </div>
        )}
      </section>

      {/* Recipe gallery */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Recipes for suppliers</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => {
            const done = installed.has(r.slug) || defs.some((d) => (d.name ?? "").toLowerCase().includes(r.name.toLowerCase().slice(0, 10)))
            return (
              <div key={r.slug} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-50 text-violet-600"><Sparkles className="h-4 w-4" /></span>
                  {r.recommended && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-emerald-700">Recommended</span>}
                  <span className="ml-auto text-[10px] uppercase text-slate-400">{r.domain}</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                <p className="mt-1 flex-1 text-[12px] leading-relaxed text-slate-500">{r.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{r.nodeCount} steps · {r.minPlan}+</span>
                  <button
                    onClick={() => void install(r.slug)}
                    disabled={installing === r.slug || done}
                    className={["inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium", done ? "bg-emerald-50 text-emerald-700" : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"].join(" ")}
                  >
                    {installing === r.slug ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                    {done ? "Installed" : installing === r.slug ? "Installing…" : "Install"}
                  </button>
                </div>
              </div>
            )
          })}
          {!loading && recipes.length === 0 && <p className="text-sm text-slate-400">No supplier recipes available.</p>}
        </div>
      </section>
    </div>
  )
}
