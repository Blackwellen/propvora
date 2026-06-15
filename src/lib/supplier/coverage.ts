import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier WORKSPACE coverage-area data layer (P3).
//
// Backed by `supplier_workspace_coverage_areas`. Workspace-scoped, 42P01/42703-
// tolerant. `setCoverage` is a full replace (delete-then-insert) so the stored
// set always matches what the supplier submitted. `coversLocation` is a pure
// helper used to test whether a given point/postcode/region falls inside the
// supplier's declared coverage.
// ============================================================================

export type CoverageAreaType = "radius" | "postcode" | "region" | "national"

export interface CoverageArea {
  id: string
  workspace_id: string
  area_type: CoverageAreaType
  value: string | null
  latitude: number | null
  longitude: number | null
  radius_km: number | null
  created_at: string
}

export interface CoverageAreaInput {
  area_type: CoverageAreaType
  value?: string | null
  latitude?: number | null
  longitude?: number | null
  radius_km?: number | null
}

/** A location to test against a supplier's coverage. */
export interface TestLocation {
  latitude?: number | null
  longitude?: number | null
  postcode?: string | null
  region?: string | null
}

const COVERAGE_COLS =
  "id, workspace_id, area_type, value, latitude, longitude, radius_km, created_at"

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703"
}

/** List a supplier workspace's coverage areas. */
export async function listCoverage(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<CoverageArea[]> {
  if (!workspaceId) return []
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_coverage_areas")
      .select(COVERAGE_COLS)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data as unknown as CoverageArea[] | null) ?? []
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/**
 * Replace the full set of coverage areas for a workspace with `areas`.
 * Delete-then-insert so the persisted set always mirrors the submitted set.
 * Returns the persisted rows (or [] on a tolerated schema error).
 */
export async function setCoverage(
  supabase: SupabaseClient,
  workspaceId: string,
  areas: CoverageAreaInput[]
): Promise<CoverageArea[]> {
  if (!workspaceId) return []
  try {
    const { error: delErr } = await supabase
      .from("supplier_workspace_coverage_areas")
      .delete()
      .eq("workspace_id", workspaceId)
    if (delErr) {
      if (tolerable(delErr)) return []
      throw delErr
    }
    if (areas.length === 0) return []
    const rows = areas.map((a) => ({ workspace_id: workspaceId, ...a }))
    const { data, error } = await supabase
      .from("supplier_workspace_coverage_areas")
      .insert(rows)
      .select(COVERAGE_COLS)
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data as unknown as CoverageArea[] | null) ?? []
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

// ── Pure helpers (no I/O) ───────────────────────────────────────────────────

function normalisePostcode(pc: string): string {
  return pc.replace(/\s+/g, "").toUpperCase()
}

/** Great-circle distance in km between two lat/lng points (Haversine). */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // km
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

/**
 * Does the supplier's declared coverage include `location`?
 *   - national  → always true.
 *   - radius    → true if location lat/lng is within radius_km of the area centre.
 *   - postcode  → true if location.postcode matches the area value by prefix
 *                 (outward-code-or-finer, whitespace/case-insensitive).
 *   - region    → true if location.region case-insensitively matches the value.
 * An empty coverage list means "not covered" (false).
 */
export function coversLocation(
  areas: CoverageArea[],
  location: TestLocation
): boolean {
  for (const area of areas) {
    switch (area.area_type) {
      case "national":
        return true
      case "radius": {
        if (
          area.latitude != null &&
          area.longitude != null &&
          area.radius_km != null &&
          location.latitude != null &&
          location.longitude != null
        ) {
          const d = haversineKm(
            area.latitude,
            area.longitude,
            location.latitude,
            location.longitude
          )
          if (d <= area.radius_km) return true
        }
        break
      }
      case "postcode": {
        if (area.value && location.postcode) {
          const target = normalisePostcode(location.postcode)
          const prefix = normalisePostcode(area.value)
          if (prefix.length > 0 && target.startsWith(prefix)) return true
        }
        break
      }
      case "region": {
        if (
          area.value &&
          location.region &&
          area.value.trim().toLowerCase() === location.region.trim().toLowerCase()
        ) {
          return true
        }
        break
      }
    }
  }
  return false
}
