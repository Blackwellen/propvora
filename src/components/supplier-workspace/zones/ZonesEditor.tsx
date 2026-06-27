"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  MapPin, Plus, Trash2, Save, Users, Circle, Hexagon, Hash, Map as MapIcon, Check, X,
} from "lucide-react"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierButton, SupplierBanner, SupplierField, supplierInputClass,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { MobileTopBar } from "@/components/mobile"
import type { ServiceZone, ZoneShapeType, LngLat } from "@/lib/supplier/zones"

const ZoneEditorMap = dynamic(() => import("./ZoneEditorMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full rounded-2xl bg-slate-100 animate-pulse" />,
})

interface TeamMember {
  id: string
  name: string | null
  email: string | null
  role: string
}

const SHAPE_META: Record<ZoneShapeType, { label: string; icon: typeof Circle; hint: string }> = {
  radius: { label: "Radius", icon: Circle, hint: "A circular catchment around a point" },
  polygon: { label: "Drawn area", icon: Hexagon, hint: "Draw a custom boundary on the map" },
  postcode: { label: "Postcode", icon: Hash, hint: "An outward code prefix, e.g. SW1" },
  region: { label: "Region", icon: MapIcon, hint: "A named region, e.g. Greater London" },
}

const PALETTE = ["#2563EB", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"]

type DraftZone = {
  name: string
  colour: string
  shape_type: ZoneShapeType
  centre: { lat: number; lng: number } | null
  radius_km: number | null
  value: string
  polygon: LngLat[]
  member_ids: string[]
  priority: number
}

function emptyDraft(colour: string): DraftZone {
  return {
    name: "",
    colour,
    shape_type: "radius",
    centre: null,
    radius_km: 10,
    value: "",
    polygon: [],
    member_ids: [],
    priority: 0,
  }
}

function describeZone(z: ServiceZone): string {
  switch (z.shape_type) {
    case "radius":
      return `${z.radius_km ?? "?"} km radius`
    case "polygon":
      return `Drawn area · ${z.polygon?.length ?? 0} points`
    case "postcode":
      return `Postcode ${z.value ?? ""}`
    case "region":
      return `Region ${z.value ?? ""}`
  }
}

/**
 * The supplier service-ZONES editor. Named zones (radius / drawn polygon /
 * postcode / region) with a colour, optional team assignment (multi-zone per
 * member) and an interactive map. Full-replace save to /api/supplier/zones.
 */
export default function ZonesEditor() {
  const { workspaceId } = useSupplierWorkspace()
  const api = useSupplierApi<{ zones: ServiceZone[]; team: TeamMember[] }>(
    useSupplierApiUrl("/api/supplier/zones"),
    { select: (j) => j as { zones: ServiceZone[]; team: TeamMember[] } }
  )

  const [zones, setZones] = useState<ServiceZone[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [draft, setDraft] = useState<DraftZone>(() => emptyDraft(PALETTE[0]))
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  useEffect(() => {
    if (api.data) {
      setZones(api.data.zones ?? [])
      setTeam(api.data.team ?? [])
    }
  }, [api.data])

  const mode = useMemo<"view" | "radius" | "polygon">(() => {
    if (draft.shape_type === "radius") return "radius"
    if (draft.shape_type === "polygon") return "polygon"
    return "view"
  }, [draft.shape_type])

  function resetDraft() {
    const used = new Set(zones.map((z) => z.colour))
    const next = PALETTE.find((c) => !used.has(c)) ?? PALETTE[zones.length % PALETTE.length]
    setDraft(emptyDraft(next))
  }

  function addDraft() {
    const name = draft.name.trim() || `${SHAPE_META[draft.shape_type].label} zone`
    if (draft.shape_type === "radius" && (!draft.centre || !draft.radius_km)) {
      setBanner({ tone: "red", msg: "Drop a centre on the map and set a radius." })
      return
    }
    if (draft.shape_type === "polygon" && draft.polygon.length < 3) {
      setBanner({ tone: "red", msg: "Draw at least 3 points to close the area." })
      return
    }
    if ((draft.shape_type === "postcode" || draft.shape_type === "region") && !draft.value.trim()) {
      setBanner({ tone: "red", msg: "Enter a value for this zone." })
      return
    }
    const newZone: ServiceZone = {
      id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      workspace_id: workspaceId ?? "",
      name,
      colour: draft.colour,
      shape_type: draft.shape_type,
      centre_lat: draft.centre?.lat ?? null,
      centre_lng: draft.centre?.lng ?? null,
      radius_km: draft.shape_type === "radius" ? draft.radius_km : null,
      value: draft.shape_type === "postcode" || draft.shape_type === "region" ? draft.value.trim() : null,
      polygon: draft.shape_type === "polygon" ? draft.polygon : null,
      is_active: true,
      priority: draft.priority,
      created_at: "",
      updated_at: "",
      member_ids: draft.member_ids,
    }
    setZones((z) => [...z, newZone])
    setBanner(null)
    resetDraft()
  }

  function removeZone(id: string) {
    setZones((z) => z.filter((x) => x.id !== id))
  }

  function toggleZoneMember(zoneId: string, memberId: string) {
    setZones((zs) =>
      zs.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              member_ids: z.member_ids.includes(memberId)
                ? z.member_ids.filter((m) => m !== memberId)
                : [...z.member_ids, memberId],
            }
          : z
      )
    )
  }

  function toggleDraftMember(memberId: string) {
    setDraft((d) => ({
      ...d,
      member_ids: d.member_ids.includes(memberId)
        ? d.member_ids.filter((m) => m !== memberId)
        : [...d.member_ids, memberId],
    }))
  }

  async function save() {
    if (!workspaceId) return
    setBusy(true)
    setBanner(null)
    try {
      const res = await fetch("/api/supplier/zones", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          zones: zones.map((z) => ({
            name: z.name,
            colour: z.colour,
            shape_type: z.shape_type,
            centre_lat: z.centre_lat,
            centre_lng: z.centre_lng,
            radius_km: z.radius_km,
            value: z.value,
            polygon: z.polygon,
            is_active: z.is_active,
            priority: z.priority,
            member_ids: z.member_ids,
          })),
        }),
      })
      if (!res.ok) {
        setBanner({ tone: "red", msg: "Couldn't save zones." })
        return
      }
      api.refresh()
      setBanner({ tone: "emerald", msg: "Service zones saved." })
    } catch {
      setBanner({ tone: "red", msg: "Network error." })
    } finally {
      setBusy(false)
    }
  }

  const memberName = (id: string) => {
    const m = team.find((t) => t.id === id)
    return m?.name || m?.email || "Member"
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Service zones" subtitle="Where your teams work" />
      <SupplierPageHeader
        title="Service zones"
        subtitle="Define named zones — a radius, a drawn boundary, a postcode or a region — and assign teams to them. Zones drive which jobs and leads reach you."
        actions={
          <SupplierButton onClick={save} loading={busy}>
            <Save className="w-4 h-4" /> Save zones
          </SupplierButton>
        }
      />

      {banner && (
        <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>
          {banner.msg}
        </SupplierBanner>
      )}

      {api.loading ? (
        <SupplierCard className="p-5">
          <SupplierLoadingState rows={5} />
        </SupplierCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4">
          {/* Map */}
          <SupplierCard className="p-0 overflow-hidden">
            <div className="h-[340px] sm:h-[460px] lg:h-[560px]">
              <ZoneEditorMap
                zones={zones}
                mode={mode}
                draftColour={draft.colour}
                draftRadiusKm={draft.radius_km}
                draftCentre={draft.centre}
                draftPolygon={draft.polygon}
                highlightId={highlightId}
                onSetCentre={(lat, lng) => setDraft((d) => ({ ...d, centre: { lat, lng } }))}
                onAppendVertex={(lng, lat) => setDraft((d) => ({ ...d, polygon: [...d.polygon, [lng, lat]] }))}
                onClosePolygon={() => setBanner({ tone: "emerald", msg: "Shape closed — name it and add the zone." })}
                className="w-full h-full"
              />
            </div>
          </SupplierCard>

          {/* Right column */}
          <div className="space-y-4">
            {/* Draft builder */}
            <SupplierCard className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Add a zone</h2>

              {/* Shape picker */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(Object.keys(SHAPE_META) as ZoneShapeType[]).map((s) => {
                  const meta = SHAPE_META[s]
                  const Icon = meta.icon
                  const active = draft.shape_type === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, shape_type: s, centre: null, polygon: [] }))}
                      className={`flex items-start gap-2 rounded-xl border p-2.5 text-left transition-colors ${
                        active ? "border-[var(--color-brand-300)] bg-[var(--brand-soft)]" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? "text-[var(--brand)]" : "text-slate-400"}`} />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-slate-800">{meta.label}</span>
                        <span className="block text-[11px] text-slate-500 leading-tight">{meta.hint}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="space-y-3">
                <SupplierField label="Zone name">
                  <input
                    className={supplierInputClass}
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="e.g. Central London circuit"
                  />
                </SupplierField>

                {/* Colour */}
                <div>
                  <span className="block text-[12px] font-medium text-slate-600 mb-1.5">Colour</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, colour: c }))}
                        className={`w-6 h-6 rounded-full ring-2 ring-offset-1 transition-all ${
                          draft.colour === c ? "ring-slate-900" : "ring-transparent"
                        }`}
                        style={{ background: c }}
                        aria-label={`Colour ${c}`}
                      />
                    ))}
                  </div>
                </div>

                {draft.shape_type === "radius" && (
                  <>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[12px] text-slate-600">
                      {draft.centre
                        ? `Centre set at ${draft.centre.lat.toFixed(4)}, ${draft.centre.lng.toFixed(4)}`
                        : "Click the map to set the zone centre."}
                    </div>
                    <SupplierField label={`Radius: ${draft.radius_km ?? 0} km`}>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        value={draft.radius_km ?? 10}
                        onChange={(e) => setDraft((d) => ({ ...d, radius_km: Number(e.target.value) }))}
                        className="w-full accent-[var(--brand)]"
                      />
                    </SupplierField>
                  </>
                )}

                {draft.shape_type === "polygon" && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[12px] text-slate-600 flex items-center justify-between gap-2">
                    <span>{draft.polygon.length} point{draft.polygon.length === 1 ? "" : "s"} drawn</span>
                    {draft.polygon.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, polygon: [] }))}
                        className="text-[12px] font-medium text-red-600 hover:underline inline-flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                )}

                {(draft.shape_type === "postcode" || draft.shape_type === "region") && (
                  <SupplierField label={draft.shape_type === "postcode" ? "Postcode / outward code" : "Region name"}>
                    <input
                      className={supplierInputClass}
                      value={draft.value}
                      onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                      placeholder={draft.shape_type === "postcode" ? "e.g. SW1" : "e.g. Greater London"}
                    />
                  </SupplierField>
                )}

                {/* Team assignment for draft */}
                {team.length > 0 && (
                  <div>
                    <span className="block text-[12px] font-medium text-slate-600 mb-1.5 inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Assign team (optional)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {team.map((m) => {
                        const on = draft.member_ids.includes(m.id)
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleDraftMember(m.id)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium border transition-colors ${
                              on ? "bg-[var(--brand)] text-white border-[var(--brand)]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {on && <Check className="w-3 h-3" />}
                            {m.name || m.email || "Member"}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <SupplierButton size="sm" variant="secondary" onClick={addDraft}>
                  <Plus className="w-3.5 h-3.5" /> Add zone
                </SupplierButton>
              </div>
            </SupplierCard>

            {/* Saved zones list */}
            <SupplierCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900">
                  Your zones {zones.length > 0 && <span className="text-slate-400 font-normal">({zones.length})</span>}
                </h2>
              </div>
              {zones.length === 0 ? (
                <SupplierEmptyState
                  icon={MapPin}
                  title="No zones yet"
                  description="Add your first service zone above. Teams assigned to a zone get its jobs and leads."
                />
              ) : (
                <ul className="space-y-2.5">
                  {zones.map((z) => (
                    <li
                      key={z.id}
                      onMouseEnter={() => setHighlightId(z.id)}
                      onMouseLeave={() => setHighlightId(null)}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: z.colour }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-slate-800 truncate">{z.name}</p>
                          <p className="text-[12px] text-slate-500">{describeZone(z)}</p>
                          {team.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {team.map((m) => {
                                const on = z.member_ids.includes(m.id)
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => toggleZoneMember(z.id, m.id)}
                                    className={`text-[11px] rounded-full px-2 py-0.5 border transition-colors ${
                                      on
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    {on ? "✓ " : "+ "}
                                    {memberName(m.id)}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeZone(z.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                          aria-label="Remove zone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[11px] text-slate-400">Press &quot;Save zones&quot; to persist your changes.</p>
            </SupplierCard>
          </div>
        </div>
      )}
    </div>
  )
}
