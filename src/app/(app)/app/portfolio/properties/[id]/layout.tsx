"use client"

import React, { createContext, useContext } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperty, useUpdateProperty } from "@/hooks/useProperties"
import { geocodeAddress } from "@/lib/maps/geocode"
import { useI18nTabs } from "@/lib/i18n/use-country-tabs"
import { cn } from "@/lib/utils"
import MobileTabs from "@/components/mobile/MobileTabs"
import { Building2, ChevronLeft, RefreshCw } from "lucide-react"
import { PropertyDetailHeader } from "@/components/portfolio/property-detail/PropertyDetailHeader"
import type { Property } from "@/types/database"

/* ── Shared context so tab pages can access the property + save ── */
interface PropertyDetailCtx {
  propertyId: string
  prop: Property | null
  save: (field: string, value: unknown) => Promise<void>
}
const Ctx = createContext<PropertyDetailCtx | null>(null)
export function usePropertyDetailCtx() {
  const c = useContext(Ctx)
  if (!c) throw new Error("usePropertyDetailCtx must be used inside PropertyDetailLayout")
  return c
}

// Inline-editable fields that change a property's geographic location → trigger
// a re-geocode of the map pin on save. (address_line2 / county don't move the
// point, so they're excluded to avoid needless lookups.)
const LOCATION_FIELDS = new Set(["address_line1", "city", "postcode", "country_code"])

// Profile-gated tabs: key → required operation_profile.
const PROFILE_TAB_GATES: Record<string, string> = {
  hmo: "hmo",
  "rent-to-rent": "rent_to_rent",
}

export default function PropertyDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const propertyId = params.id as string
  const { workspace } = useWorkspace()

  const allTabs = useI18nTabs("property_detail")
  const { data: property, isLoading } = useProperty(workspace?.id, propertyId)
  const updateProperty = useUpdateProperty()

  // First path segment after the property id determines the active tab.
  const parts = pathname.split("/").filter(Boolean)
  const idIdx = parts.indexOf(propertyId)
  const firstSeg = idIdx >= 0 ? (parts[idIdx + 1] ?? "overview") : "overview"
  const isEdit = firstSeg === "edit"
  // The HMO Details tab routes to the dedicated /hmo management surface, which
  // renders its own full-page shell — bypass this layout's shell for it.
  const isHmoSurface = firstSeg === "hmo"

  // Filter profile-gated tabs by the property's operation_profile.
  const tabs = React.useMemo(() => {
    return allTabs.filter((tab) => {
      const requiredProfile = PROFILE_TAB_GATES[tab.key]
      if (!requiredProfile) return true
      if (!property) return false
      return property.operation_profile === requiredProfile
    })
  }, [allTabs, property])

  const activeTab = tabs.find((t) => t.key === firstSeg)?.key ?? "overview"

  async function save(field: string, value: unknown) {
    if (!workspace?.id) return
    await updateProperty.mutateAsync({ id: propertyId, workspaceId: workspace.id, payload: { [field]: value } })

    // Re-geocode when a location-determining address field is edited inline (the
    // pen on Address line 1 / City / Postcode / Country) so the property's map
    // pin follows the new address. Best-effort: the field is already saved above,
    // so a geocode miss never blocks the edit — the pin just doesn't move.
    if (LOCATION_FIELDS.has(field) && property) {
      const merged = { ...property, [field]: value } as Property
      const query = [merged.address_line1, merged.city, merged.postcode].filter(Boolean).join(", ")
      if (query.trim()) {
        try {
          const hits = await geocodeAddress(query, { limit: 1, country: merged.country_code || undefined })
          if (hits.length > 0) {
            await updateProperty.mutateAsync({
              id: propertyId,
              workspaceId: workspace.id,
              payload: { latitude: hits[0].lat, longitude: hits[0].lng, geocoded_at: new Date().toISOString() },
            })
          }
        } catch {
          /* silent — address already saved; pin update is best-effort */
        }
      }
    }
  }

  const ctxValue: PropertyDetailCtx = { propertyId, prop: property ?? null, save }

  // Edit + dedicated HMO surface render standalone (no detail tab shell).
  if (isEdit || isHmoSurface) {
    return <Ctx.Provider value={ctxValue}>{children}</Ctx.Provider>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="text-[var(--brand)] animate-spin" />
          <p className="text-[13px] text-slate-500">Loading property…</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Building2 size={28} className="text-slate-300" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-700">Property not found</p>
            <p className="text-[13px] text-slate-500 mt-1">This property doesn&apos;t exist or you don&apos;t have access to it.</p>
          </div>
          <Link href="/property-manager/portfolio/properties" className="text-[13px] font-semibold text-[var(--brand)] hover:underline flex items-center gap-1">
            <ChevronLeft size={14} /> Back to Properties
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Ctx.Provider value={ctxValue}>
      <div className="min-h-screen bg-slate-50/40">
        <PropertyDetailHeader prop={property} propertyId={propertyId} onSave={save} />

        <div className="px-6 pb-8">
          {/* Tab bar — desktop strip (md+), Link-based + deep-linkable */}
          <div className="hidden md:flex items-center gap-0 border-b border-slate-200 mb-5 bg-white -mx-6 px-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={`/property-manager/portfolio/properties/${propertyId}/${tab.key}`}
                className={cn(
                  "text-[13px] font-medium px-4 py-3.5 border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.key
                    ? "border-[var(--brand)] text-[var(--brand)]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Mobile — scrollable segmented pills, URL-driven */}
          <div className="md:hidden mb-4">
            <MobileTabs
              tabs={tabs.map((t) => ({ id: t.key, label: t.label }))}
              value={activeTab}
              onChange={(id) => router.push(`/property-manager/portfolio/properties/${propertyId}/${id}`)}
              aria-label="Property sections"
            />
          </div>

          {/* Tab content */}
          <div className="mt-1">{children}</div>
        </div>
      </div>
    </Ctx.Provider>
  )
}
