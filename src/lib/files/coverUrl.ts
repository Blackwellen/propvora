/**
 * Cover-image resolution for property / unit CARDS.
 *
 * The DB stores covers as a FK into the `files` table, not as a ready-to-use
 * URL:
 *   - `properties.cover_file_id` → files.id
 *   - units have no cover column, so a unit's cover is the `files` row whose
 *     `unit_id` matches and `is_cover = true`.
 *
 * To turn either into something a card can render we look up the file's
 * `object_key` and wrap it with `fileViewUrl()` (an app-internal /api/files
 * URL that streams the private R2 object through our authed route).
 *
 * All helpers fail soft: on any error (missing table, RLS, R2 not configured)
 * they return an empty Map so callers leave `coverImageUrl` undefined and the
 * card falls back to its gradient.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { fileViewUrl } from "@/lib/r2"

type AnySupabase = SupabaseClient<any, any, any>

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((id): id is string => !!id)))
}

/**
 * Resolve a set of `files.id` values (e.g. each property's `cover_file_id`)
 * to viewable cover URLs.
 *
 * Returns a Map keyed by the file id → view URL. Ids with no matching/ready
 * file are simply absent from the Map.
 */
export async function resolveCoverUrls(
  supabase: AnySupabase,
  fileIds: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const ids = uniqueIds(fileIds)
  if (ids.length === 0) return out

  try {
    const { data, error } = await supabase
      .from("files")
      .select("id, object_key")
      .in("id", ids)
    if (error || !data) return out
    for (const row of data as Array<{ id: string; object_key: string | null }>) {
      if (row.id && row.object_key) {
        out.set(row.id, fileViewUrl(row.object_key))
      }
    }
  } catch {
    // fail soft → gradient fallback
  }
  return out
}

/**
 * Resolve cover URLs for a set of unit ids. Units carry their cover via the
 * `files` table (`unit_id` + `is_cover`) rather than a dedicated column.
 *
 * Returns a Map keyed by unit id → view URL.
 */
export async function resolveCoverUrlsByUnit(
  supabase: AnySupabase,
  unitIds: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const ids = uniqueIds(unitIds)
  if (ids.length === 0) return out

  try {
    const { data, error } = await supabase
      .from("files")
      .select("unit_id, object_key, is_cover, sort_order")
      .in("unit_id", ids)
      .eq("is_cover", true)
      .order("sort_order", { ascending: true })
    if (error || !data) return out
    for (const row of data as Array<{ unit_id: string | null; object_key: string | null }>) {
      // first (lowest sort_order) cover per unit wins
      if (row.unit_id && row.object_key && !out.has(row.unit_id)) {
        out.set(row.unit_id, fileViewUrl(row.object_key))
      }
    }
  } catch {
    // fail soft → gradient fallback
  }
  return out
}
