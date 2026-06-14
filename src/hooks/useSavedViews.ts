"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

// ============================================================
// Saved Views — reusable across every list surface (tasks, jobs,
// money, contacts…). Backed by the live `saved_views` table:
//   (id, workspace_id, owner_user_id, entity, name, config jsonb,
//    is_shared, is_default, created_at, updated_at)
//
// `entity` namespaces views per list (e.g. "tasks"). `config` is an
// opaque blob the calling page defines (filters, search, view mode).
// All reads are 42P01-safe → empty list if the table isn't provisioned.
// ============================================================

export interface SavedView<TConfig = Record<string, unknown>> {
  id: string
  entity: string
  name: string
  config: TConfig
  is_shared: boolean
  is_default: boolean
  created_at: string
}

const QK = "saved-views"

export function useSavedViews<TConfig = Record<string, unknown>>(
  workspaceId: string | undefined,
  entity: string
) {
  const supabase = createClient()
  return useQuery<SavedView<TConfig>[]>({
    queryKey: [QK, workspaceId, entity],
    enabled: !!workspaceId && !!entity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_views")
        .select("id, entity, name, config, is_shared, is_default, created_at")
        .eq("workspace_id", workspaceId!)
        .eq("entity", entity)
        .order("created_at", { ascending: true })
      if (error) {
        if (error.code === "42P01") return []
        throw error
      }
      return (data ?? []) as SavedView<TConfig>[]
    },
  })
}

export function useCreateSavedView() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<
    SavedView,
    Error,
    { workspaceId: string; entity: string; name: string; config: Record<string, unknown> }
  >({
    mutationFn: async ({ workspaceId, entity, name, config }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("saved_views")
        .insert({
          workspace_id: workspaceId,
          owner_user_id: user?.id ?? null,
          entity,
          name,
          config,
        })
        .select("id, entity, name, config, is_shared, is_default, created_at")
        .single()
      if (error) throw error
      return data as SavedView
    },
    onSuccess: (_d, { workspaceId, entity }) => {
      qc.invalidateQueries({ queryKey: [QK, workspaceId, entity] })
    },
  })
}

export function useDeleteSavedView() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; workspaceId: string; entity: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from("saved_views").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: (_d, { workspaceId, entity }) => {
      qc.invalidateQueries({ queryKey: [QK, workspaceId, entity] })
    },
  })
}
