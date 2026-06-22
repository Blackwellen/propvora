// ============================================================================
// save-guard — favourites are account-backed. Anonymous visitors who tap a
// card heart are sent to /login first. Auth state is resolved ONCE and cached
// at module scope, so a grid of N cards makes a single getUser() call.
// ============================================================================

import { createClient } from '@/lib/supabase/client'

let authPromise: Promise<boolean> | null = null

function getAuthState(): Promise<boolean> {
  if (!authPromise) {
    authPromise = createClient().auth.getUser()
      .then(({ data }) => !!data.user)
      .catch(() => false)
  }
  return authPromise
}

/**
 * Returns true if the visitor may save (signed in). When signed out, redirects
 * to /login?next=<current-url> and returns false so the caller bails.
 */
export async function guardSave(): Promise<boolean> {
  const authed = await getAuthState()
  if (!authed) {
    if (typeof window !== 'undefined') {
      const next = window.location.pathname + window.location.search
      window.location.assign(`/login?next=${encodeURIComponent(next)}`)
    }
    return false
  }
  return true
}
