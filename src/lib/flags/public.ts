import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { isFeatureEnabled, type V2FlagKey } from "./index"

/**
 * Cached GLOBAL feature-flag resolver for public (unauthenticated) surfaces.
 *
 * Public marketing / marketplace / booking pages have no workspace context, so
 * they read the global `platform_feature_flags` row only. A small in-memory TTL
 * cache keeps this off the hot path (no per-request DB read on cached hits).
 * Tolerant + fails CLOSED: any error resolves to the registry default (OFF).
 */

type CacheEntry = { value: boolean; expires: number }
const cache = new Map<V2FlagKey, CacheEntry>()
const TTL_MS = 30_000

export async function getGlobalFlag(flag: V2FlagKey): Promise<boolean> {
  const now = Date.now()
  const hit = cache.get(flag)
  if (hit && hit.expires > now) return hit.value

  let value = false
  try {
    // Service-role read: the global flag isn't sensitive and must resolve
    // regardless of anon RLS, so turning a flag ON actually reveals public pages.
    const supabase = createAdminClient()
    value = await isFeatureEnabled(flag, { supabase })
  } catch {
    value = false
  }
  cache.set(flag, { value, expires: now + TTL_MS })
  return value
}

/** Resolve several global flags at once (each individually cached). */
export async function getGlobalFlags<T extends V2FlagKey>(
  flags: T[]
): Promise<Record<T, boolean>> {
  const entries = await Promise.all(flags.map(async (f) => [f, await getGlobalFlag(f)] as const))
  return Object.fromEntries(entries) as Record<T, boolean>
}
