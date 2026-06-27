"use client"

import { useState, useEffect, useCallback } from "react"
import type { UserIdentity } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

export type ProviderId = "google" | "apple" | "github" | "azure" | string

export interface DisplayIdentity {
  /** Stable id used as a React key. */
  key: string
  provider: ProviderId
  email: string | null
  createdAt: string | null
  /** The raw Supabase identity — required by unlinkIdentity. */
  raw: UserIdentity
}

export interface AuthIdentitiesState {
  identities: DisplayIdentity[]
  email: string
  loading: boolean
  error: string | null
  /** True when the account has a usable email/password credential. */
  hasPassword: boolean
  refresh: () => Promise<void>
}

/**
 * Loads the signed-in user's real linked auth identities from Supabase.
 * Powers the Login Methods and Connected Accounts pages — no mock data.
 */
export function useAuthIdentities(): AuthIdentitiesState {
  const [identities, setIdentities] = useState<DisplayIdentity[]>([])
  const [email, setEmail] = useState("")
  const [hasPassword, setHasPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? "")

      const { data, error: idErr } = await supabase.auth.getUserIdentities()
      if (idErr) {
        setError("Could not load your sign-in methods.")
        setIdentities([])
        return
      }
      const list = (data?.identities ?? []) as UserIdentity[]
      // An email identity means the account can use email + password / magic link.
      setHasPassword(list.some(i => i.provider === "email"))
      setIdentities(
        list
          // The "email" provider is surfaced separately as Email & Password.
          .filter(i => i.provider !== "email")
          .map(i => ({
            key: i.identity_id ?? `${i.provider}-${i.id}`,
            provider: i.provider,
            email: (i.identity_data?.email as string | undefined) ?? null,
            createdAt: i.created_at ?? null,
            raw: i,
          }))
      )
    } catch {
      setError("Could not load your sign-in methods.")
      setIdentities([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  return { identities, email, loading, error, hasPassword, refresh }
}

export interface LinkResult { ok: boolean; error?: string }

/**
 * Starts the OAuth linking flow for a provider. Supabase redirects the browser
 * to the provider when manual linking is enabled and the provider is configured;
 * otherwise it returns a clear error we can surface inline.
 */
export async function linkProvider(provider: ProviderId): Promise<LinkResult> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.linkIdentity({
      provider: provider as "google" | "apple" | "github" | "azure",
      options: { redirectTo: `${window.location.origin}/property-manager/account/connected-accounts` },
    })
    if (error) {
      const msg = /manual linking|not enabled|provider/i.test(error.message)
        ? `${provider} sign-in isn't configured for this workspace yet. Ask your administrator to enable it.`
        : error.message
      return { ok: false, error: msg }
    }
    // On success Supabase navigates away; this rarely returns.
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not start the connection. Please try again." }
  }
}

/** Unlinks an OAuth identity. Supabase blocks removing the only remaining identity. */
export async function unlinkIdentity(identity: UserIdentity): Promise<LinkResult> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.unlinkIdentity(identity)
    if (error) {
      const msg = /single identity|last identity|only/i.test(error.message)
        ? "You can't remove your only sign-in method. Add another first."
        : error.message
      return { ok: false, error: msg }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not disconnect. Please try again." }
  }
}

/** Sends a passwordless magic-link sign-in email to the given address. */
export async function sendMagicLink(email: string): Promise<LinkResult> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/property-manager/portfolio` },
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not send the magic link. Please try again." }
  }
}
