"use client"

import React, { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Package, TrendingUp, BarChart3, Layers, Plus, Save, RotateCcw, Eye,
  GripVertical, Star, Sparkles, Pencil, Check, X, PoundSterling, LayoutGrid, Wrench, Grid2x2,
} from "lucide-react"
import {
  SupplierCard, SupplierCardHeader, SupplierButton, SupplierLoadingState,
  SupplierPermissionDenied, SupplierStatusBadge, supplierInputClass, supplierTextareaClass,
} from "@/components/supplier-workspace/ui"
import { formatPence } from "@/lib/marketplace/money"
import { useServicesPackages } from "../data/hooks"
import type { ServicePackage } from "../data/types"
import { useScheduleToast, ViewToggle } from "@/features/supplier/schedule/components/shared"

function pkgPrice(p: ServicePackage): string {
  if (p.pricingModel === "range") return `${formatPence(p.priceMinPence)}–${formatPence(p.priceMaxPence)}`
  return formatPence(p.pricePence)
}

export function PackagesTab() {
  const { data, loading, denied } = useServicesPackages()
  const { push } = useScheduleToast()
  const [view, setView] = useState("cards")
  const [packages, setPackages] = useState(data.packages)
  const [selectedId, setSelectedId] = useState<string | null>(data.packages[0]?.id ?? null)

  React.useEffect(() => {
    setPackages(data.packages)
    setSelectedId((id) => id ?? data.packages[0]?.id ?? null)
  }, [data.packages])

  const selected = useMemo(() => packages.find((p) => p.id === selectedId) ?? null, [packages, selectedId])

  // builder local state
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  React.useEffect(() => {
    if (selected) { setName(selected.name); setDesc(selected.description) }
  }, [selected])

  if (loading) return <SupplierLoadingState rows={6} />
  if (denied) return <SupplierPermissionDenied />

  function toggleActive(id: string) {
    setPackages((xs) => xs.map((p) => p.id === id ? { ...p, active: !p.active } : p))
    push("Package updated")
  }
  function toggleAddon(addonId: string) {
    if (!selected) return
    setPackages((xs) => xs.map((p) => p.id === selected.id
      ? { ...p, addons: p.addons.map((a) => a.id === addonId ? { ...a, attached: !a.attached } : a) }
      : p))
    push("Add-on updated")
  }

  const kpis = [
    { label: "Active packages", value: data.kpis.activePackages, icon: Package },
    { label: "Most booked", value: data.kpis.mostBookedPackage, icon: Star },
    { label: "Package revenue (30d)", value: formatPence(data.kpis.packageRevenuePence), icon: TrendingUp },
    { label: "Add-on attach rate", value: `${Math.round(data.kpis.addOnAttachRate * 100)}%`, icon: BarChart3 },
  ]

  const linesTotal = selected ? selected.lines.reduce((n, l) => n + l.pricePence, 0) : 0
  const costTotal = selected ? selected.lines.reduce((n, l) => n + l.costPence, 0) : 0
  const profit = linesTotal - costTotal

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <SupplierCard key={k.label} className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</span>
              <k.icon className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-lg font-bold text-slate-900 truncate">{k.value}</span>
          </SupplierCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle
          options={[
            { key: "cards", label: "Package cards", icon: LayoutGrid },
            { key: "builder", label: "Builder", icon: Wrench },
            { key: "matrix", label: "Add-on matrix", icon: Grid2x2 },
            { key: "preview", label: "Preview", icon: Eye },
          ]}
          value={view}
          onChange={setView}
        />
        <SupplierButton size="sm" onClick={() => push("Create package — opening builder (TODO)")}>
          <Plus className="w-4 h-4" /> Create package
        </SupplierButton>
      </div>

      {packages.length === 0 && (
        <p className="text-xs text-slate-400">No packages yet — bundle your services into a package to upsell customers.</p>
      )}

      {view === "matrix" ? (
        <AddonMatrix packages={packages} push={push} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-5">
          {/* LEFT: package list */}
          <div className="space-y-3">
            {packages.map((p) => (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className={cn("w-full text-left", selectedId === p.id && "ring-2 ring-[var(--brand)] rounded-2xl")}>
                <SupplierCard className="p-3">
                  <div className="flex gap-3">
                    <GripVertical className="w-4 h-4 text-slate-300 mt-1 shrink-0 cursor-grab" />
                    <div className={cn("w-12 h-12 rounded-lg bg-gradient-to-br shrink-0 flex items-center justify-center text-white", p.imageHue)}>
                      <Package className="w-5 h-5 opacity-90" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900 truncate">{p.name}</span>
                        {p.mostPopular && <SupplierStatusBadge tone="violet">Most popular</SupplierStatusBadge>}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{pkgPrice(p)}</span>
                        <span>Margin {formatPence(p.marginPence)}</span>
                        <span>Attach {Math.round(p.attachRate * 100)}%</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">{p.bookings} bookings · ★ {p.rating}</span>
                        <div className="flex items-center gap-1.5">
                          <SupplierStatusBadge tone={p.health === "on_track" ? "emerald" : "amber"}>{p.health === "on_track" ? "On track" : "At risk"}</SupplierStatusBadge>
                          <ActiveToggle on={p.active} onClick={(e) => { e.stopPropagation(); toggleActive(p.id) }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </SupplierCard>
              </button>
            ))}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <button className="px-2 py-1 rounded hover:bg-slate-100">‹ Prev</button>
              <span>Page 1 of 1</span>
              <button className="px-2 py-1 rounded hover:bg-slate-100">Next ›</button>
            </div>
          </div>

          {/* CENTER: builder */}
          <SupplierCard>
            <SupplierCardHeader title="Package builder" badge={selected && <SupplierStatusBadge tone="slate">{selected.name}</SupplierStatusBadge>} />
            {selected ? (
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
                    Package name <span className="text-slate-400">{name.length}/60</span>
                  </label>
                  <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={cn(supplierInputClass, "mt-1")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
                    Short description <span className="text-slate-400">{desc.length}/140</span>
                  </label>
                  <textarea value={desc} maxLength={140} rows={2} onChange={(e) => setDesc(e.target.value)} className={cn(supplierTextareaClass, "mt-1")} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Included service lines</p>
                    <button onClick={() => push("Add service line (TODO)")} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand)]">
                      <Plus className="w-3.5 h-3.5" /> Add service line
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {selected.lines.map((l) => (
                      <div key={l.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                        <span className="text-sm text-slate-700">{l.label}</span>
                        <span className="text-sm font-medium text-slate-800">{formatPence(l.pricePence)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Package pricing</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => push("Fixed price selected")} className={cn("flex-1 rounded-lg border px-3 py-2 text-sm font-medium", selected.pricingModel !== "range" ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 text-slate-600")}>Fixed price</button>
                    <button onClick={() => push("Price range selected")} className={cn("flex-1 rounded-lg border px-3 py-2 text-sm font-medium", selected.pricingModel === "range" ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 text-slate-600")}>Price range</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                    <Stat label="Lines total" value={formatPence(linesTotal)} />
                    <Stat label="Cost" value={formatPence(costTotal)} />
                    <Stat label="Profit" value={formatPence(profit)} tone="emerald" />
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Est. margin {Math.round((profit / Math.max(1, linesTotal)) * 100)}% at list price {pkgPrice(selected)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <SupplierButton variant="outline" size="sm" onClick={() => push("Set package price (TODO)")}><PoundSterling className="w-4 h-4" /> Set package price</SupplierButton>
                  <SupplierButton variant="outline" size="sm" onClick={() => push("Preview package (TODO)")}><Eye className="w-4 h-4" /> Preview package</SupplierButton>
                  <SupplierButton size="sm" onClick={() => push("Changes saved")}><Save className="w-4 h-4" /> Save changes</SupplierButton>
                  <SupplierButton variant="ghost" size="sm" onClick={() => { if (selected) { setName(selected.name); setDesc(selected.description) } push("Reset") }}><RotateCcw className="w-4 h-4" /> Reset</SupplierButton>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">Select a package to edit, or create a new one.</div>
            )}
          </SupplierCard>

          {/* RIGHT: add-ons / materials / upsells */}
          <div className="space-y-4">
            <SupplierCard>
              <SupplierCardHeader title="Add-ons" action={<SupplierButton variant="ghost" size="sm" onClick={() => push("Add add-on (TODO)")}><Plus className="w-3.5 h-3.5" /> Add add-on</SupplierButton>} />
              <div className="p-3 space-y-1.5">
                {selected?.addons.map((a) => (
                  <button key={a.id} onClick={() => toggleAddon(a.id)} className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <span className={cn("w-4 h-4 rounded border flex items-center justify-center", a.attached ? "bg-[var(--brand)] border-[var(--brand)] text-white" : "border-slate-300")}>{a.attached && <Check className="w-3 h-3" />}</span>
                      {a.name}
                    </span>
                    <span className="text-sm font-medium text-slate-600">{formatPence(a.pricePence)}</span>
                  </button>
                ))}
              </div>
            </SupplierCard>

            <SupplierCard>
              <SupplierCardHeader title="Materials & consumables" action={<SupplierButton variant="ghost" size="sm" onClick={() => push("Edit materials (TODO)")}><Pencil className="w-3.5 h-3.5" /> Edit</SupplierButton>} />
              <div className="p-3 space-y-2 text-sm">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Included</p>
                  {selected?.materialsIncluded.map((m) => (
                    <p key={m} className="flex items-center gap-1.5 text-slate-600"><Check className="w-3.5 h-3.5 text-emerald-500" /> {m}</p>
                  ))}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Excluded</p>
                  {selected?.materialsExcluded.map((m) => (
                    <p key={m} className="flex items-center gap-1.5 text-slate-400"><X className="w-3.5 h-3.5 text-slate-300" /> {m}</p>
                  ))}
                </div>
              </div>
            </SupplierCard>

            <SupplierCard>
              <SupplierCardHeader title="Upsell suggestions" badge={<SupplierStatusBadge tone="violet"><Sparkles className="w-3 h-3 mr-0.5" /> AI</SupplierStatusBadge>} />
              <div className="p-3 space-y-1.5">
                {selected?.upsells.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg bg-violet-50 border border-violet-100 px-3 py-2">
                    <span className="text-sm text-slate-700">{u.label}</span>
                    <span className="text-xs font-semibold text-violet-700">{u.attachPct}% attach</span>
                  </div>
                ))}
              </div>
            </SupplierCard>
          </div>
        </div>
      )}

      {/* Bottom strip */}
      {selected && view !== "matrix" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SupplierCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Recurring package</p>
                <p className="text-xs text-slate-400">Bill this package on a schedule.</p>
              </div>
              <ActiveToggle on={selected.recurring} onClick={() => push("Recurring toggled (TODO)")} />
            </div>
          </SupplierCard>
          <SupplierCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Availability rules</p>
                <p className="text-xs text-slate-400">When this package can be booked.</p>
              </div>
              <SupplierButton variant="outline" size="sm" onClick={() => push("Edit availability rules (TODO)")}><Pencil className="w-4 h-4" /> Edit</SupplierButton>
            </div>
          </SupplierCard>
          <SupplierCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Package performance</p>
                <p className="text-xs text-slate-400">{selected.bookings} bookings · 30 days</p>
              </div>
              <SupplierButton variant="outline" size="sm" onClick={() => push("View analytics (TODO)")}><BarChart3 className="w-4 h-4" /> View analytics</SupplierButton>
            </div>
          </SupplierCard>
        </div>
      )}
    </div>
  )
}

function AddonMatrix({ packages, push }: { packages: ServicePackage[]; push: (m: string) => void }) {
  const allAddons = Array.from(new Set(packages.flatMap((p) => p.addons.map((a) => a.name))))
  return (
    <SupplierCard className="overflow-hidden">
      <SupplierCardHeader title="Add-on attach matrix" />
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Add-on</th>
              {packages.map((p) => <th key={p.id} className="px-3 py-2 text-center font-medium">{p.name}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {allAddons.map((name) => (
              <tr key={name}>
                <td className="px-3 py-2.5 font-medium text-slate-700">{name}</td>
                {packages.map((p) => {
                  const a = p.addons.find((x) => x.name === name)
                  return (
                    <td key={p.id} className="px-3 py-2.5 text-center">
                      {a ? (
                        <button onClick={() => push("Add-on toggled (TODO)")} className={cn("inline-flex items-center justify-center w-6 h-6 rounded", a.attached ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-400")}>
                          {a.attached ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SupplierCard>
  )
}

function ActiveToggle({ on, onClick }: { on: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on}
      className={cn("relative w-9 h-5 rounded-full transition-colors shrink-0", on ? "bg-emerald-500" : "bg-slate-200")}>
      <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", on && "translate-x-4")} />
    </button>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "emerald" }) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 py-1.5">
      <div className={cn("font-bold", tone === "emerald" ? "text-emerald-600" : "text-slate-800")}>{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  )
}
