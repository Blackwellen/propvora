"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MapPin, Plus, Trash2, Save, Globe, Hexagon } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierButton, SupplierBanner, SupplierStatusBadge, SupplierField, supplierInputClass,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"

type AreaType = "radius" | "postcode" | "region" | "national"

interface CoverageRow {
  id?: string
  area_type: AreaType
  value: string | null
  latitude: number | null
  longitude: number | null
  radius_km: number | null
}

export default function SupplierCoveragePage() {
  const { workspaceId } = useSupplierWorkspace()
  const cov = useSupplierApi<CoverageRow[]>(useSupplierApiUrl("/api/supplier/coverage"), {
    select: (j) => (j as { items?: CoverageRow[] }).items ?? [],
  })
  const [areas, setAreas] = useState<CoverageRow[]>([])
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)
  const [draft, setDraft] = useState<CoverageRow>({ area_type: "postcode", value: "", latitude: null, longitude: null, radius_km: null })

  useEffect(() => { if (cov.data) setAreas(cov.data) }, [cov.data])

  function addDraft() {
    if (draft.area_type === "national") {
      setAreas([...areas.filter((a) => a.area_type !== "national"), { area_type: "national", value: null, latitude: null, longitude: null, radius_km: null }])
    } else if (draft.area_type === "radius") {
      if (draft.latitude == null || draft.longitude == null || !draft.radius_km) { setBanner({ tone: "red", msg: "Radius areas need lat, lng and radius." }); return }
      setAreas([...areas, { ...draft }])
    } else {
      if (!draft.value?.trim()) { setBanner({ tone: "red", msg: "Enter a value." }); return }
      setAreas([...areas, { ...draft, value: draft.value.trim() }])
    }
    setDraft({ area_type: draft.area_type, value: "", latitude: null, longitude: null, radius_km: null })
    setBanner(null)
  }

  function removeAt(i: number) { setAreas(areas.filter((_, idx) => idx !== i)) }

  async function save() {
    if (!workspaceId) return
    setBusy(true); setBanner(null)
    try {
      const res = await fetch("/api/supplier/coverage", {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, areas: areas.map((a) => ({ area_type: a.area_type, value: a.value, latitude: a.latitude, longitude: a.longitude, radius_km: a.radius_km })) }),
      })
      if (!res.ok) { setBanner({ tone: "red", msg: "Couldn't save coverage." }); return }
      cov.refresh(); setBanner({ tone: "emerald", msg: "Coverage areas saved." })
    } catch { setBanner({ tone: "red", msg: "Network error." }) }
    finally { setBusy(false) }
  }

  function describe(a: CoverageRow): string {
    if (a.area_type === "national") return "Nationwide"
    if (a.area_type === "radius") return `${a.radius_km} km radius (${a.latitude}, ${a.longitude})`
    if (a.area_type === "postcode") return `Postcode ${a.value}`
    return `Region ${a.value}`
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Coverage areas" subtitle="Where you work" />
      <SupplierPageHeader
        title="Coverage areas"
        subtitle="Define where you operate so the right leads reach you. Mix postcodes, regions, a radius, or set nationwide."
        actions={<SupplierButton onClick={save} loading={busy}><Save className="w-4 h-4" /> Save coverage</SupplierButton>}
      />

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      <Link
        href="/supplier/zones"
        className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-3 hover:border-blue-300 transition-colors group"
      >
        <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
          <Hexagon className="w-5 h-5 text-blue-600" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-semibold text-slate-900">Service zones (new)</span>
          <span className="block text-[12.5px] text-slate-600">Draw named zones on a map and assign teams — richer than flat coverage areas.</span>
        </span>
        <span className="text-[13px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">Open →</span>
      </Link>

      {cov.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <SupplierCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Your areas</h2>
            </div>
            {areas.length === 0 ? (
              <SupplierEmptyState icon={MapPin} title="No coverage set" description="Add at least one area so property managers in your patch can find and invite you." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {areas.map((a, i) => (
                  <li key={a.id ?? i} className="py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                      {a.area_type === "national" ? <Globe className="w-4 h-4 text-sky-600" /> : <MapPin className="w-4 h-4 text-sky-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{describe(a)}</p>
                      <SupplierStatusBadge tone="slate">{a.area_type}</SupplierStatusBadge>
                    </div>
                    <button onClick={() => removeAt(i)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="Remove area">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SupplierCard>

          <SupplierCard className="p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Add an area</h2>
            <div className="space-y-3">
              <SupplierField label="Type">
                <select className={supplierInputClass} value={draft.area_type} onChange={(e) => setDraft({ ...draft, area_type: e.target.value as AreaType })}>
                  <option value="postcode">Postcode</option>
                  <option value="region">Region</option>
                  <option value="radius">Radius</option>
                  <option value="national">Nationwide</option>
                </select>
              </SupplierField>
              {(draft.area_type === "postcode" || draft.area_type === "region") && (
                <SupplierField label={draft.area_type === "postcode" ? "Postcode / outward code" : "Region name"}>
                  <input className={supplierInputClass} value={draft.value ?? ""} onChange={(e) => setDraft({ ...draft, value: e.target.value })} placeholder={draft.area_type === "postcode" ? "e.g. SW1" : "e.g. Greater London"} />
                </SupplierField>
              )}
              {draft.area_type === "radius" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <SupplierField label="Latitude"><input className={supplierInputClass} inputMode="decimal" value={draft.latitude ?? ""} onChange={(e) => setDraft({ ...draft, latitude: e.target.value ? Number(e.target.value) : null })} /></SupplierField>
                    <SupplierField label="Longitude"><input className={supplierInputClass} inputMode="decimal" value={draft.longitude ?? ""} onChange={(e) => setDraft({ ...draft, longitude: e.target.value ? Number(e.target.value) : null })} /></SupplierField>
                  </div>
                  <SupplierField label="Radius (km)"><input className={supplierInputClass} inputMode="numeric" value={draft.radius_km ?? ""} onChange={(e) => setDraft({ ...draft, radius_km: e.target.value ? Number(e.target.value) : null })} /></SupplierField>
                </>
              )}
              {draft.area_type === "national" && <p className="text-sm text-slate-500">Adding this marks you as covering the whole country.</p>}
              <SupplierButton size="sm" variant="secondary" onClick={addDraft}><Plus className="w-3.5 h-3.5" /> Add to list</SupplierButton>
              <p className="text-[11px] text-slate-400">Remember to press &quot;Save coverage&quot; to persist your changes.</p>
            </div>
          </SupplierCard>
        </div>
      )}
    </div>
  )
}
