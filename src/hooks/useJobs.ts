'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Job, InsertJob, UpdateJob } from '@/types/database'
import { useNotify } from '@/hooks/useNotify'

const QUERY_KEY = 'jobs'

// ============================================================
// LIST
// ============================================================

export function useJobs(
  workspaceId: string | undefined,
  filters?: {
    status?: string
    priority?: string
    property_id?: string
    assigned_to?: string
  }
) {
  const supabase = createClient()

  return useQuery<Job[]>({
    queryKey: [QUERY_KEY, workspaceId, filters],
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.priority) query = query.eq('priority', filters.priority)
      if (filters?.property_id) query = query.eq('property_id', filters.property_id)
      if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to)

      const { data, error } = await query
      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return data ?? []
    },
  })
}

// ============================================================
// SINGLE
// ============================================================

export function useJob(workspaceId: string | undefined, jobId: string | undefined) {
  const supabase = createClient()

  return useQuery<Job | null>({
    queryKey: [QUERY_KEY, workspaceId, jobId],
    enabled: !!workspaceId && !!jobId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .eq('id', jobId!)
        .maybeSingle()

      if (error) {
        if (error.code === '42P01') return null
        throw error
      }
      return data
    },
  })
}

// ============================================================
// JOBS BY SUPPLIER (supplier_contact_id link)
// ============================================================

export function useSupplierJobs(
  workspaceId: string | undefined,
  supplierContactId: string | undefined
) {
  const supabase = createClient()

  return useQuery<Job[]>({
    queryKey: [QUERY_KEY, 'by-supplier', workspaceId, supplierContactId],
    enabled: !!workspaceId && !!supplierContactId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .eq('supplier_contact_id', supplierContactId!)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return data ?? []
    },
  })
}

// ============================================================
// WORK KPIs
// ============================================================

export interface WorkKpis {
  totalTasks: number
  openTasks: number
  totalJobs: number
  openJobs: number
  overdueCount: number
}

export function useWorkKpis(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<WorkKpis>({
    queryKey: ['work-kpis', workspaceId],
    enabled: !!workspaceId,
    staleTime: 60_000,
    queryFn: async () => {
      const now = new Date().toISOString()

      const [
        totalTasksRes,
        openTasksRes,
        totalJobsRes,
        openJobsRes,
        overdueRes,
      ] = await Promise.all([
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId!),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId!)
          .not('status', 'in', '(done,completed,cancelled)'),
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId!),
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId!)
          .not('status', 'in', '(complete,cancelled)'),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId!)
          .not('status', 'in', '(done,completed,cancelled)')
          .lt('due_at', now),
      ])

      // 42P01 = table doesn't exist yet — return zeroed KPIs
      const is42P01 = (e: { code?: string } | null) => e?.code === '42P01'
      if (totalTasksRes.error && !is42P01(totalTasksRes.error)) throw totalTasksRes.error
      if (openTasksRes.error && !is42P01(openTasksRes.error)) throw openTasksRes.error
      if (totalJobsRes.error && !is42P01(totalJobsRes.error)) throw totalJobsRes.error
      if (openJobsRes.error && !is42P01(openJobsRes.error)) throw openJobsRes.error
      if (overdueRes.error && !is42P01(overdueRes.error)) throw overdueRes.error

      return {
        totalTasks: totalTasksRes.count ?? 0,
        openTasks: openTasksRes.count ?? 0,
        totalJobs: totalJobsRes.count ?? 0,
        openJobs: openJobsRes.count ?? 0,
        overdueCount: overdueRes.count ?? 0,
      }
    },
  })
}

// ============================================================
// CREATE
// ============================================================

export function useCreateJob() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<Job, Error, InsertJob>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('jobs')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.workspace_id] })
      queryClient.invalidateQueries({ queryKey: ['work-kpis', data.workspace_id] })
    },
  })
}

// ============================================================
// UPDATE
// ============================================================

export function useUpdateJob() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { notify, actorId } = useNotify()

  return useMutation<Job, Error, { id: string; workspaceId: string; payload: UpdateJob }>({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      // EVENT: job completed — fire when this update transitions status to a
      // terminal "complete/done" state. Notifies the job owner/assignee.
      const newStatus = (payload as { status?: string }).status
      if (newStatus && (newStatus === 'completed' || newStatus === 'done')) {
        const recipient =
          (data as { assigned_to?: string | null }).assigned_to ??
          (data as { created_by?: string | null }).created_by ??
          actorId
        if (recipient) {
          notify('notifyJobCompleted', {
            jobId: id,
            userId: recipient,
            title: (data as { title?: string }).title ?? 'Job',
          })
        }
      }
      return data
    },
    onMutate: async ({ id, workspaceId, payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, workspaceId, id] })
      const previous = queryClient.getQueryData<Job>([QUERY_KEY, workspaceId, id])
      if (previous) {
        queryClient.setQueryData<Job>([QUERY_KEY, workspaceId, id], {
          ...previous,
          ...payload,
          updated_at: new Date().toISOString(),
        })
      }
      return { previous }
    },
    onError: (_err, { id, workspaceId }, context) => {
      const ctx = context as { previous: Job | undefined } | undefined
      if (ctx?.previous) {
        queryClient.setQueryData([QUERY_KEY, workspaceId, id], ctx.previous)
      }
    },
    onSettled: (_data, _err, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['work-kpis', workspaceId] })
    },
  })
}

// ============================================================
// DELETE
// ============================================================

export function useDeleteJob() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('jobs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['work-kpis', workspaceId] })
    },
  })
}
