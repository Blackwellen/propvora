"use client"

import React, { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Wrench, FileText, Zap, Flame, TrendingUp, Plus, Search, Star, FileBadge,
  MapPin, Eye, Copy, MoreHorizontal, Pencil, LayoutGrid, Table2, Sparkles,
} from "lucide-react"
import {
  SupplierCard, SupplierCardHeader, SupplierButton, SupplierLoadingState,
  SupplierPermissionDenied, SupplierStatusBadge, supplierInputClass,
} from "@/components/supplier-workspace/ui"
import { formatPence } from "@/lib/marketplace/money"
import { useServicesCatalogue } from "../data/hooks"
import type { CatalogueService, ServiceCategory } from "../data/types"
import { useScheduleToast, ViewToggle } from "@/features/supplier/schedule/components/shared"

const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  heating: "Heating", electrical: "Electrical", plumbing: "Plumbing", gas: "Gas",
  general: "General", ev: "EV", drainage: "Drainage",
}
const CATEGORIES: ServiceCategory[] = ["heating", "electrical", "plumbing", "gas", "ev", "drainage", "general"]

function priceLabel(s: CatalogueService): string {
  if (s.pricingModel === "fixed") return formatPence(s.pricePence)
  if (s.pricingModel === "range") return `${formatPence(s.priceMinPence)}–${formatPence(s.priceMaxPence)}`
  return `From ${formatPence(s.priceMinPence)}`
}

export function CatalogueTab() {
  const { data, loading, denied } = useServicesCatalogue()
  const { push } = useScheduleToast()
  const [view, setView] = useState("cards")
  const [cat, setCat] = useState<ServiceCategory | "all">("all")
  const [q, setQ] = useState("")
  const [sort, setSort] = useState("revenue")
  const [services, setServices] = useState(data.services)

  // keep local visibility in sync when data arrives
  React.useEffect(() => { setServices(data.services) }, [data.services])

  const filtered = useMemo(() => {
    let list = services.filter((s) =>
      (cat === "all" || s.categories.includes(cat)) &&
      (q.trim() === "" || s.name.toLowerCase().includes(q.toLowerCase()))
    )
    list = [...list].sort((a, b) =>
      sort === "revenue" ? b.revenuePence - a.revenuePence :
      sort === "rating" ? b.rating - a.rating :
      sort === "jobs" ? b.jobsCount - a.jobsCount :
      a.name.localeCompare(b.name)
    )
    return list
  }, [services, cat, q, sort])

  if (loading) return <SupplierLoadingState rows={6} />
  if (denied) return <SupplierPermissionDenied />

  function toggleVisible(id: string) {
    setServices((xs) => xs.map((s) => s.id === id ? { ...s, visible: !s.visible } : s))
    push("Visibility updated")
  }

  const kpis = [
    { label: "Active services", value: data.kpis.activeServices, icon: Wrench },
    { label: "Quote-only", value: data.kpis.quoteOnlyServices, icon: FileText },
    { label: "Instant-pay", value: data.kpis.instantPayServices, icon: Zap },
    { label: "Emergency", value: data.kpis.emergencyServices, icon: Flame },
    { label: "Top revenue service", value: formatPence(data.kpis.topRevenuePence), icon: TrendingUp, sub: data.kpis.topRevenueServiceName },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <SupplierCard key={k.label} className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</span>
              <k.icon className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-xl font-bold text-slate-900">{k.value}</span>
            {k.sub && <span className="text-xs text-slate-400 truncate">{k.sub}</span>}
          </SupplierCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle
          options={[
            { key: "cards", label: "Cards", icon: LayoutGrid },
            { key: "table", label: "Table", icon: Table2 },
            { key: "preview", label: "Public preview", icon: Eye },
          ]}
          value={view}
          onChange={setView}
        />
        <SupplierButton size="sm" onClick={() => push("Add service — opening wizard (TODO)")}>
          <Plus className="w-4 h-4" /> Add service
        </SupplierButton>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services…" className={cn(supplierInputClass, "pl-9")} />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value as ServiceCategory | "all")} className={cn(supplierInputClass, "max-w-[160px]")}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={cn(supplierInputClass, "max-w-[150px]")}>
          <option value="revenue">Top revenue</option>
          <option value="rating">Top rated</option>
          <option value="jobs">Most jobs</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {data.services.length === 0 && (
        <p className="text-xs text-slate-400">No services yet — add your first service to start receiving requests.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div>
          {view === "table" ? (
            <SupplierCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[640px] w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      {["Service", "Price", "Jobs", "Revenue", "Rating", "Visible", ""].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2.5 font-medium text-slate-800">{s.name}</td>
                        <td className="px-3 py-2.5 text-slate-600">{priceLabel(s)}</td>
                        <td className="px-3 py-2.5 text-slate-600">{s.jobsCount}</td>
                        <td className="px-3 py-2.5 text-slate-600">{formatPence(s.revenuePence)}</td>
                        <td className="px-3 py-2.5 text-slate-600">{s.rating || "—"}</td>
                        <td className="px-3 py-2.5"><VisibleToggle on={s.visible} onClick={() => toggleVisible(s.id)} /></td>
                        <td className="px-3 py-2.5"><button onClick={() => push("Edit service (TODO)")} className="p-1 text-slate-400 hover:text-slate-600"><Pencil className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SupplierCard>
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => (
                <SupplierCard key={s.id} className="p-4">
                  <div className="flex gap-4">
                    <div className={cn("w-16 h-16 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center text-white", s.imageHue)}>
                      <Wrench className="w-6 h-6 opacity-90" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{s.name}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {s.categories.map((c) => (
                              <span key={c} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{CATEGORY_LABEL[c]}</span>
                            ))}
                            {s.instantPay && <SupplierStatusBadge tone="blue">Instant-pay</SupplierStatusBadge>}
                            {s.emergency && <SupplierStatusBadge tone="red">Emergency</SupplierStatusBadge>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-slate-900">{priceLabel(s)}</div>
                          <div className="text-[10px] uppercase tracking-wide text-slate-400">{s.pricingModel === "quote_only" ? "Quote-only" : s.pricingModel === "range" ? "Range" : "Fixed"}</div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><FileBadge className="w-3.5 h-3.5" /> {s.docsCount} docs</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {s.coverage}</span>
                        <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" /> {s.rating || "—"}</span>
                        <span>{s.jobsCount} jobs</span>
                        <span className="font-medium text-slate-600">{formatPence(s.revenuePence)} revenue</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Visible</span>
                          <VisibleToggle on={s.visible} onClick={() => toggleVisible(s.id)} />
                        </div>
                        <div className="flex items-center gap-1">
                          <RowAction icon={Pencil} label="Edit" onClick={() => push("Edit service (TODO)")} />
                          <RowAction icon={Eye} label="Preview" onClick={() => push("Preview listing (TODO)")} />
                          <RowAction icon={Copy} label="Duplicate" onClick={() => push("Service duplicated")} />
                          <RowAction icon={MoreHorizontal} label="More" onClick={() => push("More — Disable / Open detail (TODO)")} />
                        </div>
                      </div>
                    </div>
                  </div>
                </SupplierCard>
              ))}
              {filtered.length === 0 && (
                <SupplierCard className="p-10 text-center text-sm text-slate-400">No services match your filters.</SupplierCard>
              )}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <SupplierCard>
            <SupplierCardHeader title="Public preview" action={<SupplierButton variant="ghost" size="sm" onClick={() => push("Open public profile (TODO)")}><Eye className="w-3.5 h-3.5" /> View public profile</SupplierButton>} />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center font-bold">{data.supplier.name[0]}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 flex items-center gap-1">{data.supplier.name}{data.supplier.verified && <SupplierStatusBadge tone="emerald">Verified</SupplierStatusBadge>}</p>
                  {data.supplier.reviews > 0 ? (
                    <p className="text-xs text-slate-400 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {data.supplier.rating} · {data.supplier.reviews} reviews</p>
                  ) : (
                    <p className="text-xs text-slate-400">No reviews yet</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Services</p>
                <ul className="space-y-1">
                  {services.filter((s) => s.visible).slice(0, 5).map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 truncate">{s.name}</span>
                      <span className="text-slate-500 shrink-0 ml-2">{priceLabel(s)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SupplierCard>
          <SupplierCard className="p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500">This is how your services appear to customers on the marketplace. Toggle visibility to control what&apos;s listed.</p>
            </div>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

function VisibleToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on}
      className={cn("relative w-9 h-5 rounded-full transition-colors", on ? "bg-emerald-500" : "bg-slate-200")}>
      <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", on && "translate-x-4")} />
    </button>
  )
}

function RowAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} aria-label={label}
      className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
      <Icon className="w-4 h-4" />
    </button>
  )
}
