"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

// ============================================================
// Internal supplier rating model + preferred/blocked marking.
//
// Live tables (migration 20260613000007_supplier_ratings_complaints):
//   * supplier_ratings      — multi-dimension internal rating, by the team
//   * supplier_preferences  — preferred / blocked marking + metadata
//
// Suppliers are `contacts` rows (type='supplier'); both tables key off the
// supplier contact id. Every query is 42P01-safe so the UI never breaks if the
// migration hasn't been applied yet.
// ============================================================

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

// ─── Rating ───────────────────────────────────────────────────────────────────

export const RATING_DIMENSIONS = [
  { key: "quality", label: "Quality of work" },
  { key: "speed", label: "Speed" },
  { key: "communication", label: "Communication" },
  { key: "reliability", label: "Reliability" },
  { key: "price_value", label: "Price / value" },
  { key: "compliance", label: "Compliance" },
  { key: "tenant_satisfaction", label: "Tenant satisfaction" },
] as const

export type RatingDimension = (typeof RATING_DIMENSIONS)[number]["key"]

export interface SupplierRating {
  id: string
  workspace_id: string
  supplier_contact_id: string
  quality: number | null
  speed: number | null
  communication: number | null
  reliability: number | null
  price_value: number | null
  compliance: number | null
  tenant_satisfaction: number | null
  would_use_again: boolean | null
  internal_notes: string | null
  last_job_id: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface SupplierRatingInput {
  quality?: number | null
  speed?: number | null
  communication?: number | null
  reliability?: number | null
  price_value?: number | null
  compliance?: number | null
  tenant_satisfaction?: number | null
  would_use_again?: boolean | null
  internal_notes?: string | null
  last_job_id?: string | null
}

/** Mean of the populated 1–5 dimensions (null if none set). */
export function ratingAverage(r: Pick<SupplierRating, RatingDimension>): number | null {
  const vals = RATING_DIMENSIONS.map((d) => r[d.key]).filter(
    (v): v is number => typeof v === "number"
  )
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

/** Live ratings for a supplier (most recent first). */
export function useSupplierRatings(
  workspaceId: string | undefined,
  supplierContactId: string | undefined,
  enabled = true
) {
  const supabase = createClient()
  return useQuery<SupplierRating[]>({
    queryKey: ["supplier-ratings", workspaceId, supplierContactId],
    enabled: !!workspaceId && !!supplierContactId && enabled,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_ratings")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .eq("supplier_contact_id", supplierContactId!)
        .order("created_at", { ascending: false })
      if (error) {
        if (code(error) === "42P01") return []
        throw error
      }
      return (data ?? []) as SupplierRating[]
    },
  })
}

/** Create a new internal rating for a supplier. */
export function useCreateSupplierRating() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      workspaceId: string
      supplierContactId: string
      input: SupplierRatingInput
    }) => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id ?? null
      const { data, error } = await supabase
        .from("supplier_ratings")
        .insert({
          workspace_id: args.workspaceId,
          supplier_contact_id: args.supplierContactId,
          ...args.input,
          created_by: uid,
          updated_by: uid,
        })
        .select("*")
        .single()
      if (error) throw error
      return data as SupplierRating
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["supplier-ratings", vars.workspaceId, vars.supplierContactId],
      })
    },
  })
}

// ─── Preferred / blocked marking ──────────────────────────────────────────────

export interface SupplierPreference {
  id: string
  workspace_id: string
  supplier_contact_id: string
  preferred: boolean
  blocked: boolean
  reason: string | null
  categories: string[]
  review_date: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface SupplierPreferenceInput {
  preferred?: boolean
  blocked?: boolean
  reason?: string | null
  categories?: string[]
  review_date?: string | null
}

/** Live preference row for a single supplier (null if none yet). */
export function useSupplierPreference(
  workspaceId: string | undefined,
  supplierContactId: string | undefined,
  enabled = true
) {
  const supabase = createClient()
  return useQuery<SupplierPreference | null>({
    queryKey: ["supplier-preference", workspaceId, supplierContactId],
    enabled: !!workspaceId && !!supplierContactId && enabled,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_preferences")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .eq("supplier_contact_id", supplierContactId!)
        .maybeSingle()
      if (error) {
        if (code(error) === "42P01") return null
        throw error
      }
      return (data ?? null) as SupplierPreference | null
    },
  })
}

/** All preference rows in a workspace, keyed by supplier contact id (for the list). */
export function useWorkspaceSupplierPreferences(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<Map<string, SupplierPreference>>({
    queryKey: ["supplier-preferences", workspaceId],
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_preferences")
        .select("*")
        .eq("workspace_id", workspaceId!)
      const map = new Map<string, SupplierPreference>()
      if (error) {
        if (code(error) === "42P01") return map
        throw error
      }
      for (const r of (data ?? []) as SupplierPreference[]) {
        map.set(r.supplier_contact_id, r)
      }
      return map
    },
  })
}

/** Upsert (create or update) a supplier's preferred/blocked marking. */
export function useUpsertSupplierPreference() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      workspaceId: string
      supplierContactId: string
      input: SupplierPreferenceInput
    }) => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id ?? null
      const { data, error } = await supabase
        .from("supplier_preferences")
        .upsert(
          {
            workspace_id: args.workspaceId,
            supplier_contact_id: args.supplierContactId,
            ...args.input,
            updated_by: uid,
            created_by: uid,
          },
          { onConflict: "workspace_id,supplier_contact_id" }
        )
        .select("*")
        .single()
      if (error) throw error
      return data as SupplierPreference
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["supplier-preference", vars.workspaceId, vars.supplierContactId],
      })
      qc.invalidateQueries({ queryKey: ["supplier-preferences", vars.workspaceId] })
    },
  })
}
