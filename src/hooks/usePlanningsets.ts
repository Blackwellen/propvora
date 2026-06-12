'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  PlanningSet,
  InsertPlanningSet,
  UpdatePlanningSet,
  PlanningAssumptions,
  PlanningIncomeLine,
  PlanningRoomLine,
  PlanningExpenseLine,
  PlanningBillLine,
  PlanningUpfrontCost,
} from '@/types/database'

const QUERY_KEY = 'planning-sets'

// ============================================================
// LIST
// ============================================================

export function usePlanningSets(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<PlanningSet[]>({
    queryKey: [QUERY_KEY, workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_sets')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })

      if (error) {
        // Tables not provisioned yet — treat as empty so UI shows honest empty state
        if (error.code === '42P01') return []
        throw error
      }
      return data ?? []
    },
    staleTime: 60 * 1000,
  })
}

// ============================================================
// SINGLE WITH ALL LINES
// ============================================================

export interface PlanningSetDetail extends PlanningSet {
  assumptions: PlanningAssumptions | null
  income_lines: PlanningIncomeLine[]
  room_lines: PlanningRoomLine[]
  expense_lines: PlanningExpenseLine[]
  bill_lines: PlanningBillLine[]
  upfront_costs: PlanningUpfrontCost[]
}

export function usePlanningSetDetail(
  workspaceId: string | undefined,
  planningSetId: string | undefined
) {
  const supabase = createClient()

  return useQuery<PlanningSetDetail | null>({
    queryKey: [QUERY_KEY, workspaceId, planningSetId, 'detail'],
    enabled: !!workspaceId && !!planningSetId,
    queryFn: async () => {
      const [psResult, assumptionsResult, incomeResult, roomResult, expenseResult, billResult, upfrontResult] =
        await Promise.all([
          supabase
            .from('planning_sets')
            .select('*')
            .eq('id', planningSetId!)
            .eq('workspace_id', workspaceId!)
            .single(),
          supabase
            .from('planning_assumptions')
            .select('*')
            .eq('planning_set_id', planningSetId!)
            .maybeSingle(),
          supabase
            .from('planning_income_lines')
            .select('*')
            .eq('planning_set_id', planningSetId!)
            .order('sort_order'),
          supabase
            .from('planning_room_lines')
            .select('*')
            .eq('planning_set_id', planningSetId!)
            .order('sort_order'),
          supabase
            .from('planning_expense_lines')
            .select('*')
            .eq('planning_set_id', planningSetId!)
            .order('sort_order'),
          supabase
            .from('planning_bill_lines')
            .select('*')
            .eq('planning_set_id', planningSetId!)
            .order('sort_order'),
          supabase
            .from('planning_upfront_costs')
            .select('*')
            .eq('planning_set_id', planningSetId!)
            .order('sort_order'),
        ])

      if (psResult.error) {
        if (psResult.error.code === '42P01' || psResult.error.code === 'PGRST116') return null
        throw psResult.error
      }
      if (!psResult.data) return null

      return {
        ...psResult.data,
        assumptions: assumptionsResult.data ?? null,
        income_lines: incomeResult.data ?? [],
        room_lines: roomResult.data ?? [],
        expense_lines: expenseResult.data ?? [],
        bill_lines: billResult.data ?? [],
        upfront_costs: upfrontResult.data ?? [],
      }
    },
  })
}

// ============================================================
// CREATE
// ============================================================

export function useCreatePlanningSet() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<PlanningSet, Error, InsertPlanningSet>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('planning_sets')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.workspace_id] })
    },
  })
}

// ============================================================
// UPDATE
// ============================================================

export function useUpdatePlanningSet() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<PlanningSet, Error, { id: string; workspaceId: string; payload: UpdatePlanningSet }>({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase
        .from('planning_sets')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ id, workspaceId, payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, workspaceId, id] })
      const previous = queryClient.getQueryData<PlanningSet>([QUERY_KEY, workspaceId, id])
      if (previous) {
        queryClient.setQueryData<PlanningSet>([QUERY_KEY, workspaceId, id], { ...previous, ...payload })
      }
      return { previous }
    },
    onError: (_err, { id, workspaceId }, context) => {
      const ctx = context as { previous: PlanningSet | undefined } | undefined
      if (ctx?.previous) {
        queryClient.setQueryData([QUERY_KEY, workspaceId, id], ctx.previous)
      }
    },
    onSettled: (_data, _err, { workspaceId, id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId, id, 'detail'] })
    },
  })
}

// ============================================================
// DELETE
// ============================================================

export function useDeletePlanningSet() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('planning_sets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
    },
  })
}
