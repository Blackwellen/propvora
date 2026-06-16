import type { SupabaseClient } from "@supabase/supabase-js"
import { haversineKm, type CoverageArea, type TestLocation } from "./coverage"

// ============================================================================
// Supplier SERVICE ZONES data layer.
//
// Backed by `supplier_service_zones` + `supplier_zone_assignments`. A zone is a
// NAMED shape (radius / postcode / region / drawn polygon) that the supplier
// can also assign to multiple team members (multi-zone per team). This is the
// richer evolution of the flat `coverage` areas: a zone carries identity,
// colour, priority and team assignment, and `zoneContains` / `coversLocation`
// (re-exported from coverage with zones merged in) drive lead routing.
//
// Every read is 42P01/42703/PGRST205-tolerant → empty result, never throw.
// Polygons are stored as JSONB arrays of [lng, lat] pairs (no PostGIS).
// ============================================================================

export type ZoneShapeType = "radius" | "postcode" | "region" | "polygon"

/** A [lng, lat] vertex, matching GeoJSON ordering. */
export type LngLat = [number, number]

export interface ServiceZone {
  id: string
  workspace_id: string
  name: string
  colour: string
  shape_type: ZoneShapeType
  centre_lat: number | null
  centre_lng: number | null
  radius_km: number | null
  value: string | null
  polygon: LngLat[] | null
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
  /** Member ids assigned to this zone (multi-zone per team). Enriched on read. */
  member_ids: string[]
}

export interface ServiceZoneInput {
  id?: string | null
  name: string
  colour?: string | null
  shape_type: ZoneShapeType
  centre_lat?: number | null
  centre_lng?: number | null
  radius_km?: number | null
  value?: string | null
  polygon?: LngLat[] | null
  is_active?: boolean
  priority?: number
  /** Team members assigned to this zone. */
  member_ids?: string[]
}

const ZONE_COLS =
  "id, workspace_id, name, colour, shape_type, centre_lat, centre_lng, radius_km, value, polygon, is_active, priority, created_at, updated_at"

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703" || c === "PGRST205" || c === "PGRST204"
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function parsePolygon(v: unknown): LngLat[] | null {
  if (!Array.isArray(v)) return null
  const out: LngLat[] = []
  for (const pt of v) {
    if (Array.isArray(pt) && pt.length >= 2) {
      const lng = Number(pt[0])
      const lat = Number(pt[1])
      if (Number.isFinite(lng) && Number.isFinite(lat)) out.push([lng, lat])
    }
  }
  return out.length >= 3 ? out : null
}

function rowToZone(r: Record<string, unknown>, members: string[]): ServiceZone {
  return {
    id: String(r.id),
    workspace_id: String(r.workspace_id),
    name: (r.name as string) ?? "Zone",
    colour: (r.colour as string) ?? "#2563EB",
    shape_type: (r.shape_type as ZoneShapeType) ?? "radius",
    centre_lat: num(r.centre_lat),
    centre_lng: num(r.centre_lng),
    radius_km: num(r.radius_km),
    value: (r.value as string | null) ?? null,
    polygon: parsePolygon(r.polygon),
    is_active: r.is_active !== false,
    priority: Number(r.priority) || 0,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
    member_ids: members,
  }
}

/** List a workspace's service zones, enriched with their assigned member ids. */
export async function listZones(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ServiceZone[]> {
  if (!workspaceId) return []
  try {
    const { data, error } = await supabase
      .from("supplier_service_zones")
      .select(ZONE_COLS)
      .eq("workspace_id", workspaceId)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    const rows = (data as Record<string, unknown>[] | null) ?? []
    if (rows.length === 0) return []

    // Enrich with assignments (best-effort).
    const byZone = new Map<string, string[]>()
    try {
      const { data: asg } = await supabase
        .from("supplier_zone_assignments")
        .select("zone_id, member_id")
        .eq("workspace_id", workspaceId)
      for (const a of (asg as Record<string, unknown>[] | null) ?? []) {
        const zid = String(a.zone_id)
        const arr = byZone.get(zid) ?? []
        arr.push(String(a.member_id))
        byZone.set(zid, arr)
      }
    } catch {
      /* tolerant */
    }
    return rows.map((r) => rowToZone(r, byZone.get(String(r.id)) ?? []))
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/**
 * Replace the full set of zones (+ their team assignments) for a workspace.
 * Delete-then-insert so the persisted set mirrors the submitted set. Returns the
 * persisted zones, or [] on a tolerated schema error.
 */
export async function saveZones(
  supabase: SupabaseClient,
  workspaceId: string,
  zones: ServiceZoneInput[]
): Promise<ServiceZone[]> {
  if (!workspaceId) return []
  try {
    // Assignments cascade-delete with their zones, so deleting zones is enough.
    const { error: delErr } = await supabase
      .from("supplier_service_zones")
      .delete()
      .eq("workspace_id", workspaceId)
    if (delErr) {
      if (tolerable(delErr)) return []
      throw delErr
    }
    if (zones.length === 0) return []

    const rows = zones.map((z) => ({
      workspace_id: workspaceId,
      name: z.name.trim() || "Zone",
      colour: z.colour || "#2563EB",
      shape_type: z.shape_type,
      centre_lat: z.centre_lat ?? null,
      centre_lng: z.centre_lng ?? null,
      radius_km: z.radius_km ?? null,
      value: z.value ?? null,
      polygon: z.polygon ?? null,
      is_active: z.is_active !== false,
      priority: z.priority ?? 0,
    }))
    const { data, error } = await supabase
      .from("supplier_service_zones")
      .insert(rows)
      .select(ZONE_COLS)
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    const inserted = (data as Record<string, unknown>[] | null) ?? []

    // Insert assignments, pairing inserted rows back to inputs by order.
    const assignmentRows: { workspace_id: string; zone_id: string; member_id: string }[] = []
    inserted.forEach((row, i) => {
      const members = zones[i]?.member_ids ?? []
      for (const m of members) {
        if (m) assignmentRows.push({ workspace_id: workspaceId, zone_id: String(row.id), member_id: m })
      }
    })
    if (assignmentRows.length > 0) {
      try {
        await supabase.from("supplier_zone_assignments").insert(assignmentRows)
      } catch {
        /* tolerant — zones still saved */
      }
    }

    // Re-read so member_ids are populated consistently.
    return listZones(supabase, workspaceId)
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

// ── Pure geometry helpers (no I/O) ──────────────────────────────────────────

function normalisePostcode(pc: string): string {
  return pc.replace(/\s+/g, "").toUpperCase()
}

/**
 * Ray-casting point-in-polygon. `polygon` is a ring of [lng, lat] vertices.
 * Returns true when (lng, lat) is inside the ring.
 */
export function pointInPolygon(polygon: LngLat[], lng: number, lat: number): boolean {
  if (polygon.length < 3) return false
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/** Does a single zone include `location`? */
export function zoneContains(zone: ServiceZone, location: TestLocation): boolean {
  if (!zone.is_active) return false
  switch (zone.shape_type) {
    case "radius": {
      if (
        zone.centre_lat != null &&
        zone.centre_lng != null &&
        zone.radius_km != null &&
        location.latitude != null &&
        location.longitude != null
      ) {
        return haversineKm(zone.centre_lat, zone.centre_lng, location.latitude, location.longitude) <= zone.radius_km
      }
      return false
    }
    case "polygon": {
      if (zone.polygon && location.latitude != null && location.longitude != null) {
        return pointInPolygon(zone.polygon, location.longitude, location.latitude)
      }
      return false
    }
    case "postcode": {
      if (zone.value && location.postcode) {
        const target = normalisePostcode(location.postcode)
        const prefix = normalisePostcode(zone.value)
        return prefix.length > 0 && target.startsWith(prefix)
      }
      return false
    }
    case "region": {
      if (zone.value && location.region) {
        return zone.value.trim().toLowerCase() === location.region.trim().toLowerCase()
      }
      return false
    }
    default:
      return false
  }
}

/** Which zones cover `location` (priority-ordered, as listed). */
export function zonesCovering(zones: ServiceZone[], location: TestLocation): ServiceZone[] {
  return zones.filter((z) => zoneContains(z, location))
}

/**
 * Unified coverage test consulting BOTH legacy coverage areas AND zones.
 * Either source granting coverage makes the location covered. This is the
 * helper `supplier/coverage.ts` callers should migrate to when zones exist.
 */
export function coversLocationWithZones(
  areas: CoverageArea[],
  zones: ServiceZone[],
  location: TestLocation
): boolean {
  // Reuse coverage's own logic by importing coversLocation lazily would create a
  // cycle; instead, zones are the richer layer and we test zones first, then a
  // light re-check of areas (national/radius/postcode/region) inline.
  if (zonesCovering(zones, location).length > 0) return true
  for (const area of areas) {
    switch (area.area_type) {
      case "national":
        return true
      case "radius":
        if (
          area.latitude != null &&
          area.longitude != null &&
          area.radius_km != null &&
          location.latitude != null &&
          location.longitude != null &&
          haversineKm(area.latitude, area.longitude, location.latitude, location.longitude) <= area.radius_km
        )
          return true
        break
      case "postcode":
        if (area.value && location.postcode) {
          const target = normalisePostcode(location.postcode)
          const prefix = normalisePostcode(area.value)
          if (prefix.length > 0 && target.startsWith(prefix)) return true
        }
        break
      case "region":
        if (
          area.value &&
          location.region &&
          area.value.trim().toLowerCase() === location.region.trim().toLowerCase()
        )
          return true
        break
    }
  }
  return false
}
