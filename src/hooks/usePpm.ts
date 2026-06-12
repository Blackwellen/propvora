'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const QUERY_KEY = 'ppm_plans'

// ============================================================
// TYPES — no ppm type exists in @/types/database yet, so we
// define a local PpmPlan / Insert / Update contract here.
// ============================================================

export type PpmPlanStatus = 'scheduled' | 'due_soon' | 'overdue' | 'completed' | 'paused'
export type PpmFrequency =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'bi_annual'
  | 'annual'
  | 'biennial'

export interface PpmPlan {
  id: string
  workspace_id: string
  name: string
  description: string | null
  category: string | null
  status: PpmPlanStatus
  priority: string | null
  property_id: string | null
  unit_id: string | null
  supplier_contact_id: string | null
  supplier_name: string | null
  frequency: PpmFrequency | string | null
  start_date: string | null
  next_due_date: string | null
  last_completed_date: string | null
  estimated_cost: number | null
  auto_generate_job: boolean | null
  reference: string | null
  notes: string | null
  is_demo: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface InsertPpmPlan {
  workspace_id: string
  name: string
  status: PpmPlanStatus
  is_demo: boolean
  description?: string | null
  category?: string | null
  priority?: string | null
  property_id?: string | null
  unit_id?: string | null
  supplier_contact_id?: string | null
  supplier_name?: string | null
  frequency?: PpmFrequency | string | null
  start_date?: string | null
  next_due_date?: string | null
  last_completed_date?: string | null
  estimated_cost?: number | null
  auto_generate_job?: boolean | null
  reference?: string | null
  notes?: string | null
  created_by?: string | null
}

export type UpdatePpmPlan = Partial<InsertPpmPlan>

export interface PpmFilters {
  status?: string
  property_id?: string
  supplier?: string
  frequency?: string
}

// ============================================================
// LIST
// ============================================================

export function usePpmPlans(workspaceId: string | undefined, filters?: PpmFilters) {
  const supabase = createClient()

  return useQuery<PpmPlan[]>({
    queryKey: [QUERY_KEY, workspaceId, filters],
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let query = supabase
        .from('ppm_plans')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('next_due_date', { ascending: true })

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.property_id) query = query.eq('property_id', filters.property_id)
      if (filters?.supplier) query = query.eq('supplier_name', filters.supplier)
      if (filters?.frequency) query = query.eq('frequency', filters.frequency)

      const { data, error } = await query
      if (error) {
        // 42P01 = table doesn't exist yet — fall back to seeded UI
        if (error.code === '42P01') return []
        throw error
      }
      return (data as PpmPlan[]) ?? []
    },
  })
}

// ============================================================
// SINGLE
// ============================================================

export function usePpmPlan(workspaceId: string | undefined, id: string | undefined) {
  const supabase = createClient()

  return useQuery<PpmPlan | null>({
    queryKey: [QUERY_KEY, workspaceId, id],
    enabled: !!workspaceId && !!id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ppm_plans')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .eq('id', id!)
        .maybeSingle()

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') return null
        throw error
      }
      return (data as PpmPlan | null) ?? null
    },
  })
}

// ============================================================
// CREATE
// ============================================================

export function useCreatePpmPlan() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<PpmPlan, Error, InsertPpmPlan>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('ppm_plans')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data as PpmPlan
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.workspace_id] })
    },
  })
}

// ============================================================
// UPDATE
// ============================================================

export function useUpdatePpmPlan() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<PpmPlan, Error, { id: string; workspaceId: string; payload: UpdatePpmPlan }>({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase
        .from('ppm_plans')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as PpmPlan
    },
    onMutate: async ({ id, workspaceId, payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, workspaceId, id] })
      const previous = queryClient.getQueryData<PpmPlan>([QUERY_KEY, workspaceId, id])
      if (previous) {
        queryClient.setQueryData<PpmPlan>([QUERY_KEY, workspaceId, id], {
          ...previous,
          ...payload,
          updated_at: new Date().toISOString(),
        })
      }
      return { previous }
    },
    onError: (_err, { id, workspaceId }, context) => {
      const ctx = context as { previous: PpmPlan | undefined } | undefined
      if (ctx?.previous) {
        queryClient.setQueryData([QUERY_KEY, workspaceId, id], ctx.previous)
      }
    },
    onSettled: (_data, _err, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
    },
  })
}

// ============================================================
// DELETE
// ============================================================

export function useDeletePpmPlan() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('ppm_plans').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
    },
  })
}

// ============================================================
// GENERATE JOB FROM A PPM PLAN
// Creates a `jobs` row from a plan. Tolerant of a missing jobs
// table (42P01) so it never crashes the UI.
// ============================================================

export function useGenerateJobFromPpm() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<{ ok: boolean; jobId?: string }, Error, { plan: PpmPlan }>({
    mutationFn: async ({ plan }) => {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          workspace_id: plan.workspace_id,
          title: plan.name,
          status: 'scheduled',
          priority: (plan.priority as string) || 'medium',
          is_demo: false,
          description: plan.description ?? null,
          category: plan.category ?? null,
          property_id: plan.property_id ?? null,
          supplier_contact_id: plan.supplier_contact_id ?? null,
          scheduled_date: plan.next_due_date ?? null,
          quoted_amount: plan.estimated_cost ?? null,
        })
        .select('id')
        .single()

      if (error) {
        if (error.code === '42P01') return { ok: false }
        throw error
      }
      return { ok: true, jobId: (data as { id: string }).id }
    },
    onSuccess: (_data, { plan }) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', plan.workspace_id] })
    },
  })
}
