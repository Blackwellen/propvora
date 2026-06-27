"use client"

import { useMemo, useState } from "react"
import { useSectionRouter } from "@/components/sections/SectionBasePath"
import {
  Clock,
  Heart,
  LayoutGrid,
  List,
  Plus,
  Sparkles,
  Star,
  Wand2,
  Workflow,
  Zap,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import { AutomationsReviewFirstBadge } from "../components/AutomationsBadges"
import AutomationsRightRail from "../components/AutomationsRightRail"
import { Btn, Card, CardHeader, Drawer, useToast } from "../components/primitives"
import { useAutomationRecipes } from "../data/hooks"
import type { Recipe } from "../data/types"

const CATEGORIES = ["All categories", "Leasing", "Maintenance", "Finance", "Compliance", "Tenant Experience", "Operations", "Communications", "Reports", "More"]

export default function RecipesPage() {
  const router = useSectionRouter()
  const toast = useToast()
  const { data, loading } = useAutomationRecipes()
  const [category, setCategory] = useState("All categories")
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [favourites, setFavourites] = useState<Record<string, boolean>>({})
  const [onlyFav, setOnlyFav] = useState(false)
  const [preview, setPreview] = useState<Recipe | null>(null)

  const featured = data.featured
  const allRecipes = data.recipes

  const filtered = useMemo(() => {
    return allRecipes.filter((r) => {
      if (category !== "All categories" && category !== "More" && r.category !== category) return false
      if (onlyFav && !favourites[r.id]) return false
      if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [allRecipes, category, onlyFav, favourites, query])

  async function useRecipe(r: Recipe) {
    // Install the recipe via the real engine: instantiateRecipe creates a
    // DISABLED, review-first definition (+ node graph) the user then enables.
    try {
      const res = await fetch("/api/automations/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: r.id }),
      })
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        toast(json.error || "Couldn't add that recipe. Please try again.")
        return
      }
      toast(`"${r.name}" added as a review-first draft`)
      setTimeout(() => router.push("/property-manager/automations/my-automations"), 700)
    } catch {
      toast("Couldn't add that recipe. Please try again.")
    }
  }

  const actions = (
    <>
      <Btn icon={Wand2} variant="violet" onClick={() => router.push("/property-manager/automations/ai-builder")}>AI Builder</Btn>
      <Btn icon={Plus} variant="primary" onClick={() => router.push("/property-manager/automations/canvas")}>Create recipe</Btn>
    </>
  )

  const badgeColor: Record<string, string> = {
    "Most popular": "bg-[var(--brand-soft)] text-[var(--brand)]",
    "High impact": "bg-violet-50 text-violet-700",
    "Time saver": "bg-emerald-50 text-emerald-700",
    "Risk reducer": "bg-amber-50 text-amber-700",
    New: "bg-[var(--brand-soft)] text-[var(--brand)]",
    Popular: "bg-emerald-50 text-emerald-700",
  }

  return (
    <AutomationsModuleShell
      title="Recipes"
      subtitle="Prebuilt workflow templates to automate common property management processes and save time."
      icon={Sparkles}
      actions={actions}
    >
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${category === c ? "border-[var(--color-brand-100)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes…"
          className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--color-brand-400)] focus:outline-none"
        />
        {["Trigger", "Module", "Use case", "Complexity"].map((f) => (
          <span key={f} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">{f}: All</span>
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><AutomationsReviewFirstBadge /></span>
        <button onClick={() => setOnlyFav((v) => !v)} className={`rounded-lg border px-3 py-2 text-sm ${onlyFav ? "border-[var(--color-brand-100)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 bg-white text-slate-600"}`}>Only my favourites</button>
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">Sort by Popularity</span>
        <div className="ml-auto flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
          <button onClick={() => setView("grid")} className={`grid h-7 w-7 place-items-center rounded ${view === "grid" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView("list")} className={`grid h-7 w-7 place-items-center rounded ${view === "list" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Empty-state: no recipe library provisioned for this workspace yet. */}
      {!loading && allRecipes.length === 0 && featured.length === 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"><Sparkles className="h-5 w-5" /></span>
          <p className="mt-3 text-sm font-semibold text-slate-700">No recipes yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Prebuilt workflow templates will appear here. You can build your own automation from scratch with the AI Builder or the canvas.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Btn variant="violet" onClick={() => router.push("/property-manager/automations/ai-builder")}>Open AI Builder</Btn>
            <Btn variant="outline" onClick={() => router.push("/property-manager/automations/canvas")}>Open canvas</Btn>
          </div>
        </div>
      )}

      {/* Featured */}
      {featured.length > 0 && <h2 className="mt-6 text-sm font-semibold text-slate-900">Featured recipes</h2>}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {featured.map((r) => (
          <Card key={r.id} className="flex flex-col p-4">
            <div className="flex items-start justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600"><Zap className="h-4 w-4" /></span>
              {r.badge && <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${badgeColor[r.badge] ?? "bg-slate-100 text-slate-600"}`}>{r.badge}</span>}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">{r.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{r.difficulty} setup</span>
              <span>{r.actionCount} action{r.actionCount === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Btn variant="primary" className="flex-1 justify-center" onClick={() => useRecipe(r)}>Use recipe</Btn>
              <Btn variant="outline" onClick={() => setPreview(r)}>Preview</Btn>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        {/* Recipe list */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}</div>
          ) : (
            <div className={view === "grid" ? "grid grid-cols-1 gap-3 md:grid-cols-2" : "space-y-3"}>
              {filtered.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{r.name}</h3>
                        {r.badge && <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${badgeColor[r.badge] ?? "bg-slate-100 text-slate-600"}`}>{r.badge}</span>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">Trigger: {r.trigger}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">{r.actionCount} actions</span>
                        {r.modules.slice(0, 2).map((m) => <span key={m} className="rounded bg-slate-100 px-1.5 py-0.5">{m}</span>)}
                        {r.modules.length > 2 && <span className="rounded bg-slate-100 px-1.5 py-0.5">+{r.modules.length - 2}</span>}
                      </div>
                    </div>
                    <button onClick={() => setFavourites((s) => ({ ...s, [r.id]: !s[r.id] }))} aria-label="Favourite" className="shrink-0">
                      <Heart className={`h-4 w-4 ${favourites[r.id] ? "fill-rose-500 text-rose-500" : "text-slate-300"}`} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span>{r.category}</span>
                    <span>Setup: {r.difficulty}</span>
                    {r.reviewFirst && <AutomationsReviewFirstBadge />}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Btn variant="outline" onClick={() => setPreview(r)}>Preview recipe</Btn>
                    <Btn variant="primary" onClick={() => useRecipe(r)}>Use recipe</Btn>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="text-center text-xs text-slate-400">Showing {filtered.length} recipe{filtered.length === 1 ? "" : "s"}</div>
        </div>

        {/* Right rail */}
        <AutomationsRightRail>
          <Card>
            <CardHeader title="Popular this month" />
            <ol className="space-y-1 p-3">
              {allRecipes.slice(0, 5).map((r, i) => (
                <li key={r.id}>
                  <button onClick={() => setPreview(r)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">{i + 1}</span>
                    <span className="flex-1 truncate text-sm text-slate-700">{r.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <CardHeader title="Recently used" />
            <div className="p-3 space-y-1">
              {allRecipes.slice(0, 3).map((r) => (
                <button key={r.id} onClick={() => setPreview(r)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                  <Star className="h-3.5 w-3.5 text-amber-400" />{r.name}
                </button>
              ))}
            </div>
          </Card>
          {(() => {
            const recommended = featured[2] ?? featured[0] ?? allRecipes[0]
            if (!recommended) return null
            return (
              <Card className="border-violet-200 bg-violet-50/40">
                <div className="p-4">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-violet-900"><Sparkles className="h-4 w-4" />Recommended by AI</h3>
                  <p className="mt-1 text-xs text-violet-800">{recommended.name} could save you time across {recommended.category.toLowerCase()} tasks.</p>
                  <Btn variant="violet" className="mt-3" onClick={() => useRecipe(recommended)}>Use recipe</Btn>
                </div>
              </Card>
            )
          })()}
        </AutomationsRightRail>
      </div>

      <Drawer open={!!preview} onClose={() => setPreview(null)} title={preview?.name ?? "Recipe"}>
        {preview && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              {preview.tags.map((t) => <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{t}</span>)}
              {preview.reviewFirst && <AutomationsReviewFirstBadge />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Trigger" value={preview.trigger} />
              <Stat label="Actions" value={`${preview.actionCount}`} />
              <Stat label="Category" value={preview.category} />
              <Stat label="Review-first" value={preview.reviewFirst ? "Yes" : "No"} />
              <Stat label="Difficulty" value={preview.difficulty} />
            </div>
            <Btn variant="primary" className="w-full justify-center" icon={Workflow} onClick={() => { setPreview(null); useRecipe(preview) }}>
              Use this recipe
            </Btn>
          </div>
        )}
      </Drawer>
    </AutomationsModuleShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-slate-800">{value}</div>
    </div>
  )
}
