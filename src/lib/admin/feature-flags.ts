import { createAdminClient } from "@/lib/supabase/admin"
import {
  FLAG_REGISTRY,
  V2_FLAG_KEYS,
  defaultFor,
  type V2FlagKey,
} from "@/lib/flags/registry"

/**
 * Admin read layer for the feature-flag manager. Reads GLOBAL flag states from
 * `platform_feature_flags` via the service-role client. 42P01-safe: a missing
 * table resolves every flag to its registry default (OFF). Gated by the (admin)
 * layout + page guard before use.
 */

export interface FlagState {
  key: V2FlagKey
  enabled: boolean
  /** True when a global row explicitly sets this flag (vs falling to default). */
  hasRow: boolean
  /** The registry default (always OFF for v2). */
  defaultEnabled: boolean
}

export interface FlagStatesResult {
  states: Record<V2FlagKey, FlagState>
  available: boolean
  total: number
  enabledCount: number
  overriddenCount: number
}

export async function getFlagStates(): Promise<FlagStatesResult> {
  const base = () => {
    const states = {} as Record<V2FlagKey, FlagState>
    for (const key of V2_FLAG_KEYS) {
      states[key] = { key, enabled: defaultFor(key), hasRow: false, defaultEnabled: defaultFor(key) }
    }
    return states
  }

  let states = base()
  let available = false

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("platform_feature_flags")
      .select("flag_key, enabled")
    if (!error && data) {
      available = true
      const byDb = new Map<string, boolean>(
        (data as Array<{ flag_key: string; enabled: boolean }>).map((r) => [r.flag_key, Boolean(r.enabled)])
      )
      for (const key of V2_FLAG_KEYS) {
        const dbKey = FLAG_REGISTRY[key].dbKey
        if (byDb.has(dbKey)) {
          states[key] = { key, enabled: byDb.get(dbKey)!, hasRow: true, defaultEnabled: defaultFor(key) }
        }
      }
    }
  } catch {
    states = base()
  }

  const all = Object.values(states)
  return {
    states,
    available,
    total: all.length,
    enabledCount: all.filter((s) => s.enabled).length,
    overriddenCount: all.filter((s) => s.hasRow).length,
  }
}
