'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Task, InsertTask, UpdateTask, TaskStatus, TaskPriority } from '@/types/database'
import { useNotify } from '@/hooks/useNotify'

const QUERY_KEY = 'tasks'

// ============================================================
// SCHEMA ADAPTER (live `tasks` lineage <-> app Task)
//   kind             <-> category
//   due_at           <-> due_date
//   assignee_user_id <-> assigned_to
//   assignee_contact_id <-> contact_id
//   priority 'normal' <-> app 'medium'
//   estimated_cost/actual_cost added via migration ...0010
// ============================================================

function prioFromDb(p: string | null): TaskPriority {
  return (p === 'normal' ? 'medium' : (p ?? 'medium')) as TaskPriority
}
function prioToDb(p: TaskPriority | undefined): string | undefined {
  if (p === undefined) return undefined
  return p === 'medium' ? 'normal' : p
}

function fromDb(r: Record<string, unknown>): Task {
  const g = (k: string): any => r[k]
  return {
    id: g('id'),
    workspace_id: g('workspace_id'),
    title: (g('title') ?? '') as string,
    description: g('description') ?? null,
    status: (g('status') ?? 'todo') as TaskStatus,
    priority: prioFromDb(g('priority')),
    category: g('kind') ?? null,
    property_id: g('property_id') ?? null,
    contact_id: g('assignee_contact_id') ?? g('contact_id') ?? null,
    assigned_to: g('assignee_user_id') ?? null,
    due_date: g('due_at') ?? null,
    scheduled_start: g('scheduled_start') ?? null,
    scheduled_end: g('scheduled_end') ?? null,
    completed_at: g('completed_at') ?? null,
    estimated_cost: g('estimated_cost') ?? null,
    actual_cost: g('actual_cost') ?? null,
    metadata: g('metadata') ?? null,
    is_demo: false,
    created_by: g('created_by') ?? null,
    created_at: g('created_at'),
    updated_at: g('updated_at'),
  }
}

function toDb(p: Partial<Task>): Record<string, unknown> {
  const o: Record<string, unknown> = {}
  if ('category' in p) o.kind = p.category
  if ('due_date' in p) o.due_at = p.due_date
  if ('assigned_to' in p) o.assignee_user_id = p.assigned_to
  if ('contact_id' in p) o.assignee_contact_id = p.contact_id
  if ('priority' in p) o.priority = prioToDb(p.priority)
  // `tasks.metadata` is NOT NULL (default '{}'). Never forward an explicit null —
  // omit the key so the column default applies.
  if ('metadata' in p && (p as Record<string, unknown>).metadata != null) {
    o.metadata = (p as Record<string, unknown>).metadata
  }
  for (const k of [
    'workspace_id', 'title', 'description', 'status', 'property_id',
    'scheduled_start', 'completed_at', 'estimated_cost', 'actual_cost',
    'created_by',
  ] as const) {
    if (k in p) o[k] = (p as Record<string, unknown>)[k]
  }
  return o
}

// ============================================================
// LIST
// ============================================================

export function useTasks(
  workspaceId: string | undefined,
  filters?: { status?: TaskStatus; priority?: TaskPriority; property_id?: string; assigned_to?: string }
) {
  const supabase = createClient()
  return useQuery<Task[]>({
    queryKey: [QUERY_KEY, workspaceId, filters],
    enabled: !!workspaceId,
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('due_at', { ascending: true, nullsFirst: false })

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.priority) query = query.eq('priority', prioToDb(filters.priority)!)
      if (filters?.property_id) query = query.eq('property_id', filters.property_id)
      if (filters?.assigned_to) query = query.eq('assignee_user_id', filters.assigned_to)

      const { data, error } = await query
      if (error) {
        if (error.code === '42P01') return []
        throw error
      }

      const rows = data ?? []

      // Fetch property names + addresses for tasks that have a property_id.
      // No FK in schema so we can't use PostgREST embedding — manual lookup.
      const propIds = [...new Set(rows.map(r => r.property_id).filter(Boolean))]
      const propData = new Map<string, { name: string; address: string }>()
      if (propIds.length > 0) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, nickname, address_line1')
          .in('id', propIds)
        for (const p of props ?? []) {
          propData.set(p.id, {
            name: p.nickname || p.address_line1 || 'Property',
            address: p.address_line1 || '',
          })
        }
      }

      return rows.map(r => {
        const task = fromDb(r)
        if (r.property_id && propData.has(r.property_id)) {
          const pd = propData.get(r.property_id)!
          ;(task as any).properties = { name: pd.name, address: pd.address }
        }
        return task
      })
    },
    staleTime: 30 * 1000,
  })
}

// ============================================================
// SINGLE
// ============================================================

export function useTask(workspaceId: string | undefined, taskId: string | undefined) {
  const supabase = createClient()
  return useQuery<Task | null>({
    queryKey: [QUERY_KEY, workspaceId, taskId],
    enabled: !!workspaceId && !!taskId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .eq('id', taskId!)
        .maybeSingle()
      if (error) {
        if (error.code === '42P01') return null
        throw error
      }
      return data ? fromDb(data) : null
    },
  })
}

// ============================================================
// CREATE
// ============================================================

export function useCreateTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { notify, actorId } = useNotify()
  return useMutation<Task, Error, InsertTask>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(toDb(payload as Partial<Task>))
        .select()
        .single()
      if (error) throw error
      return fromDb(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.workspace_id] })
      // EVENT: task assigned — only when assigned to someone other than the actor
      if (data.assigned_to && data.assigned_to !== actorId) {
        notify('notifyTaskAssigned', {
          taskId: data.id,
          assigneeUserId: data.assigned_to,
          title: data.title,
        })
      }
    },
  })
}

// ============================================================
// UPDATE
// ============================================================

export function useUpdateTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { notify, actorId } = useNotify()
  return useMutation<Task, Error, { id: string; workspaceId: string; payload: UpdateTask }>({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(toDb(payload as Partial<Task>))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      // EVENT: task (re)assigned via update — fire when the payload sets a new
      // assignee that isn't the actor. Idempotent guard prevents double-fire.
      if ('assigned_to' in payload && payload.assigned_to && payload.assigned_to !== actorId) {
        notify('notifyTaskAssigned', {
          taskId: id,
          assigneeUserId: payload.assigned_to,
          title: data.title ?? '',
        })
      }
      return fromDb(data)
    },
    onMutate: async ({ id, workspaceId, payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, workspaceId, id] })
      const previous = queryClient.getQueryData<Task>([QUERY_KEY, workspaceId, id])
      if (previous) {
        queryClient.setQueryData<Task>([QUERY_KEY, workspaceId, id], {
          ...previous, ...payload, updated_at: new Date().toISOString(),
        })
      }
      return { previous }
    },
    onError: (_err, { id, workspaceId }, context) => {
      const ctx = context as { previous: Task | undefined } | undefined
      if (ctx?.previous) queryClient.setQueryData([QUERY_KEY, workspaceId, id], ctx.previous)
    },
    onSettled: (_data, _err, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
    },
  })
}

// ============================================================
// MARK COMPLETE
// ============================================================

export function useCompleteTask() {
  const updateTask = useUpdateTask()
  return useMutation<Task, Error, { id: string; workspaceId: string }>({
    mutationFn: ({ id, workspaceId }) =>
      updateTask.mutateAsync({
        id, workspaceId,
        payload: { status: 'done', completed_at: new Date().toISOString() },
      }),
  })
}

// ============================================================
// DELETE
// ============================================================

export function useDeleteTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
    },
  })
}
