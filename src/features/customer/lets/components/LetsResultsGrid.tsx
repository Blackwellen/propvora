"use client"

import { useState } from "react"
import { Home, LayoutGrid, Map as MapIcon, Rows3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../../components/toast"
import { CustomerPropertyCard } from "../../components/PropertyCard"
import type { PropertyCardData } from "../../components/PropertyCard"

/**
 * TODO(supabase): replace with a real-time query to the lets/properties table
 * scoped by the active customer search filters. Until the backend is wired this
 * array is intentionally empty — no fake seed data shown to authenticated users.
 */
const RESULTS: PropertyCardData[] = []

const VIEWS = [
  { id: "cards", icon: LayoutGrid },
  { id: "list", icon: Rows3 },
  { id: "map", icon: MapIcon },
] as const

export default function LetsResultsGrid() {
  const { toast } = useCustomerToast()
  const [view, setView] = useState<"cards" | "list" | "map">("cards")

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-slate-900">
          Long-term lets{" "}
          <span className="text-slate-400 font-medium text-[13px]">{RESULTS.length} results</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast("Sort — coming soon", "info")}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-700"
          >
            Sort: Recommended
          </button>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {VIEWS.map((v) => {
              const Icon = v.icon
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={cn("rounded-lg px-2.5 py-1.5 transition", view === v.id ? "bg-[#0D1B2A] text-white" : "text-slate-500")}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {RESULTS.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Home className="w-7 h-7 text-slate-400" />
          </span>
          <p className="text-[15px] font-bold text-slate-800 mb-1">No long-term lets available yet</p>
          <p className="text-[13px] text-slate-500 max-w-xs">
            Check back soon or adjust your search filters above to find your next home.
          </p>
        </div>
      ) : (
        <div className={cn("grid gap-5 items-start", view === "map" ? "grid-cols-1 lg:grid-cols-[1fr_420px]" : "")}>
          <div
            className={cn(
              "grid gap-4",
              view === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
              view === "map" && "lg:grid-cols-2"
            )}
          >
            {RESULTS.map((p) => (
              <CustomerPropertyCard
                key={p.id}
                p={{
                  ...p,
                  pricePer: "month",
                  href: p.href ?? `/customer/lets/properties/${p.id}`,
                }}
                className="h-full"
                onToggleSave={() => toast("Saved to favourites", "success")}
              />
            ))}
          </div>
          {view === "map" && (
            <div className="relative bg-[#E8EEF4] rounded-2xl border border-slate-200 min-h-[480px] sticky top-[84px] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_35%,#dceaf6,transparent_45%)]" />
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                <MapIcon className="w-8 h-8" />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
