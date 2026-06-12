"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import {
  DEFAULT_PORTAL_PROFILES,
  DEFAULT_PORTAL_PURPOSES,
  type PortalGrantStatus,
  type TokenStatus,
} from "@/lib/portals/config"

/**
 * Live data hooks for the workspace-side Portals management section.
 *
 * All reads are 42P01-safe: if a portal table has not been provisioned in
 * the target database, the hook resolves to an empty result instead of
 * throwing, so the UI renders honest empty states.
 */

const PG_MISSING = "42P01"

export interface PortalContactLite {
  full_name: string | null
  type: string | null
  email: string | null
  company: string | null
}

export interface PortalGrant {
  id: string
  workspace_id: string
  contact_id: string
  access_type: string
  linked_type: string | null
  linked_id: string | null
  status: PortalGrantStatus
  purpose: string | null
  expires_at: string | null
  last_opened_at: string | null
  email_sent_at: string | null
  revoked_at: string | null
  created_at: string
  contact: PortalContactLite | null
}

function normaliseContact(raw: unknown): PortalContactLite | null {
  const c = Array.isArray(raw) ? raw[0] : raw
  if (!c || typeof c !== "object") return null
  const r = c as Record<string, unknown>
  return {
    full_name: (r.full_name as string) ?? null,
    type: (r.type as string) ?? null,
    email: (r.email as string) ?? null,
    company: (r.company as string) ?? null,
  }
}

// ─── LIST grants ───────────────────────────────────────────────────────

export function usePortalGrants(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<PortalGrant[]>({
    queryKey: ["portal-grants", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      // contacts live columns aliased: full_name:display_name, company:company
      const { data, error } = await supabase
        .from("contact_portal_access")
        .select(
          "id, workspace_id, contact_id, access_type, linked_type, linked_id, status, purpose, expires_at, last_opened_at, email_sent_at, revoked_at, created_at, contact:contacts(full_name:display_name, type, email, company)"
        )
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.code === PG_MISSING) return []
        throw error
      }
      return (data ?? []).map((row) => {
        const r = row as Record<string, unknown>
        return {
          ...(r as unknown as PortalGrant),
          contact: normaliseContact(r.contact),
        }
      })
    },
    staleTime: 30 * 1000,
  })
}

// ─── SINGLE grant ──────────────────────────────────────────────────────

export function usePortalGrant(
  workspaceId: string | undefined,
  grantId: string | undefined
) {
  const supabase = createClient()
  return useQuery<PortalGrant | null>({
    queryKey: ["portal-grant", workspaceId, grantId],
    enabled: !!workspaceId && !!grantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_portal_access")
        .select(
          "id, workspace_id, contact_id, access_type, linked_type, linked_id, status, purpose, expires_at, last_opened_at, email_sent_at, revoked_at, created_at, contact:contacts(full_name:display_name, type, email, company)"
        )
        .eq("id", grantId!)
        .eq("workspace_id", workspaceId!)
        .maybeSingle()

      if (error) {
        if (error.code === PG_MISSING || error.code === "PGRST116") return null
        throw error
      }
      if (!data) return null
      const r = data as Record<string, unknown>
      return {
        ...(r as unknown as PortalGrant),
        contact: normaliseContact(r.contact),
      }
    },
  })
}

// ─── Token status for a grant (never returns the raw token) ────────────

export interface PortalTokenStatus {
  status: TokenStatus
  expires_at: string | null
  last_used_at: string | null
  created_at: string | null
}

export function usePortalToken(
  workspaceId: string | undefined,
  grantId: string | undefined
) {
  const supabase = createClient()
  return useQuery<PortalTokenStatus>({
    queryKey: ["portal-token", workspaceId, grantId],
    enabled: !!workspaceId && !!grantId,
    queryFn: async () => {
      const empty: PortalTokenStatus = {
        status: "none",
        expires_at: null,
        last_used_at: null,
        created_at: null,
      }
      const { data, error } = await supabase
        .from("portal_access_tokens")
        // NOTE: token_hash is intentionally NOT selected — the raw token is
        // never available client-side. Only status metadata is read.
        .select("status, expires_at, last_used_at, created_at")
        .eq("access_id", grantId!)
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        if (error.code === PG_MISSING || error.code === "PGRST116") return empty
        throw error
      }
      if (!data) return empty
      const r = data as Record<string, unknown>
      let status = (r.status as TokenStatus) ?? "active"
      const exp = (r.expires_at as string) ?? null
      if (status === "active" && exp && new Date(exp).getTime() < Date.now()) {
        status = "expired"
      }
      return {
        status,
        expires_at: exp,
        last_used_at: (r.last_used_at as string) ?? null,
        created_at: (r.created_at as string) ?? null,
      }
    },
  })
}

// ─── Diagnostics: uploads + messages counts (42P01-safe) ───────────────

export interface PortalDiagnostics {
  uploads: number | null // null => table not provisioned
  messages: number | null
}

export function usePortalDiagnostics(
  workspaceId: string | undefined,
  grantId: string | undefined
) {
  const supabase = createClient()
  return useQuery<PortalDiagnostics>({
    queryKey: ["portal-diagnostics", workspaceId, grantId],
    enabled: !!workspaceId && !!grantId,
    queryFn: async () => {
      const out: PortalDiagnostics = { uploads: null, messages: null }

      const uploads = await supabase
        .from("portal_uploads")
        .select("id", { count: "exact", head: true })
        .eq("access_id", grantId!)
      if (!uploads.error) out.uploads = uploads.count ?? 0
      else if (uploads.error.code !== PG_MISSING) out.uploads = 0

      const messages = await supabase
        .from("portal_messages")
        .select("id", { count: "exact", head: true })
        .eq("access_id", grantId!)
      if (!messages.error) out.messages = messages.count ?? 0
      else if (messages.error.code !== PG_MISSING) out.messages = 0

      return out
    },
  })
}

// ─── Config templates (profiles / purposes) — 42P01-safe w/ defaults ───

export interface PortalProfileRow {
  key: string
  label: string
  description: string | null
  access_type: string
  is_enabled: boolean
  is_default: boolean
  source: "config" | "default"
}

export function usePortalProfiles(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<PortalProfileRow[]>({
    queryKey: ["portal-profiles", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const fallback: PortalProfileRow[] = DEFAULT_PORTAL_PROFILES.map((p) => ({
        key: p.key,
        label: p.label,
        description: p.description,
        access_type: p.accessType,
        is_enabled: true,
        is_default: true,
        source: "default",
      }))
      const { data, error } = await supabase
        .from("portal_profiles")
        .select("key, label, description, access_type, is_enabled, is_default")
        .eq("workspace_id", workspaceId!)
        .order("sort_order", { ascending: true })
      if (error) {
        if (error.code === PG_MISSING) return fallback
        throw error
      }
      if (!data || data.length === 0) return fallback
      return data.map((r) => ({
        ...(r as Omit<PortalProfileRow, "source">),
        source: "config" as const,
      }))
    },
    staleTime: 60 * 1000,
  })
}

export interface PortalPurposeRow {
  key: string
  label: string
  description: string | null
  default_expiry_days: number
  is_enabled: boolean
  is_default: boolean
  source: "config" | "default"
}

export function usePortalPurposes(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<PortalPurposeRow[]>({
    queryKey: ["portal-purposes", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const fallback: PortalPurposeRow[] = DEFAULT_PORTAL_PURPOSES.map((p) => ({
        key: p.key,
        label: p.label,
        description: p.description,
        default_expiry_days: p.defaultExpiryDays,
        is_enabled: true,
        is_default: true,
        source: "default",
      }))
      const { data, error } = await supabase
        .from("portal_purposes")
        .select("key, label, description, default_expiry_days, is_enabled, is_default")
        .eq("workspace_id", workspaceId!)
        .order("sort_order", { ascending: true })
      if (error) {
        if (error.code === PG_MISSING) return fallback
        throw error
      }
      if (!data || data.length === 0) return fallback
      return data.map((r) => ({
        ...(r as Omit<PortalPurposeRow, "source">),
        source: "config" as const,
      }))
    },
    staleTime: 60 * 1000,
  })
}

// ─── Mutations (revoke / extend) — operate on live rows ────────────────

export function useRevokeGrant() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id }) => {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from("contact_portal_access")
        .update({ status: "revoked", revoked_at: now })
        .eq("id", id)
      if (error) throw error
      // best-effort: flip token rows too (ignore if table absent)
      await supabase
        .from("portal_access_tokens")
        .update({ status: "revoked" })
        .eq("access_id", id)
    },
    onSuccess: (_d, { workspaceId, id }) => {
      qc.invalidateQueries({ queryKey: ["portal-grants", workspaceId] })
      qc.invalidateQueries({ queryKey: ["portal-grant", workspaceId, id] })
      qc.invalidateQueries({ queryKey: ["portal-token", workspaceId, id] })
    },
  })
}

export function useExtendGrant() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<
    void,
    Error,
    { id: string; workspaceId: string; days: number }
  >({
    mutationFn: async ({ id, days }) => {
      const expires = new Date(
        Date.now() + days * 24 * 60 * 60 * 1000
      ).toISOString()
      const { error } = await supabase
        .from("contact_portal_access")
        .update({ status: "active", expires_at: expires, revoked_at: null })
        .eq("id", id)
      if (error) throw error
      await supabase
        .from("portal_access_tokens")
        .update({ status: "active", expires_at: expires })
        .eq("access_id", id)
    },
    onSuccess: (_d, { workspaceId, id }) => {
      qc.invalidateQueries({ queryKey: ["portal-grants", workspaceId] })
      qc.invalidateQueries({ queryKey: ["portal-grant", workspaceId, id] })
      qc.invalidateQueries({ queryKey: ["portal-token", workspaceId, id] })
    },
  })
}
