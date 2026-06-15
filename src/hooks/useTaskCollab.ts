'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// Task collaboration data layer — comments + checklist subtasks.
//
// Live tables (verified against the running DB):
//   task_comments         (id, workspace_id, task_id, parent_id, author_user_id,
//                          body_md, mentions[], edited_at, deleted_at, created_at)
//   task_checklist_items  (id, workspace_id, task_id, position, label, done,
//                          done_at, done_by, created_at, updated_at)
//
// Every read is 42P01-safe so a missing migration yields an honest empty state
// rather than a crash. Writes are scoped to workspace_id + the authed user.
// ============================================================

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface TaskComment {
  id: string
  workspace_id: string
  task_id: string
  parent_id: string | null
  author_user_id: string
  body_md: string
  mentions: string[]
  edited_at: string | null
  created_at: string
}

export function useTaskComments(
  workspaceId: string | undefined,
  taskId: string | undefined
) {
  const supabase = createClient()
  return useQuery<TaskComment[]>({
    queryKey: ['task-comments', workspaceId, taskId],
    enabled: !!workspaceId && !!taskId,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('id, workspace_id, task_id, parent_id, author_user_id, body_md, mentions, edited_at, created_at, deleted_at')
        .eq('workspace_id', workspaceId!)
        .eq('task_id', taskId!)
        .order('created_at', { ascending: true })
      if (error) {
        if (code(error) === '42P01') return []
        throw error
      }
      return ((data ?? []) as Array<TaskComment & { deleted_at: string | null }>)
        .filter((c) => !c.deleted_at)
        .map((c): TaskComment => ({
          id: c.id,
          workspace_id: c.workspace_id,
          task_id: c.task_id,
          parent_id: c.parent_id,
          author_user_id: c.author_user_id,
          body_md: c.body_md,
          mentions: c.mentions ?? [],
          edited_at: c.edited_at,
          created_at: c.created_at,
        }))
    },
  })
}

export function useAddTaskComment() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<
    TaskComment,
    Error,
    { workspaceId: string; taskId: string; body: string }
  >({
    mutationFn: async ({ workspaceId, taskId, body }) => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) throw new Error('Not signed in')
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          workspace_id: workspaceId,
          task_id: taskId,
          author_user_id: uid,
          body_md: body.trim(),
          mentions: [],
        })
        .select('id, workspace_id, task_id, parent_id, author_user_id, body_md, mentions, edited_at, created_at')
        .single()
      if (error) throw error
      return data as TaskComment
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['task-comments', vars.workspaceId, vars.taskId] })
    },
  })
}

export function useDeleteTaskComment() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<
    void,
    Error,
    { workspaceId: string; taskId: string; id: string }
  >({
    mutationFn: async ({ id }) => {
      // Soft delete — preserves thread integrity.
      const { error } = await supabase
        .from('task_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['task-comments', vars.workspaceId, vars.taskId] })
    },
  })
}

// ─── Checklist / subtasks ─────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string
  workspace_id: string
  task_id: string
  position: number
  label: string
  done: boolean
  done_at: string | null
  done_by: string | null
  created_at: string
}

export function useTaskChecklist(
  workspaceId: string | undefined,
  taskId: string | undefined
) {
  const supabase = createClient()
  return useQuery<ChecklistItem[]>({
    queryKey: ['task-checklist', workspaceId, taskId],
    enabled: !!workspaceId && !!taskId,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .select('id, workspace_id, task_id, position, label, done, done_at, done_by, created_at')
        .eq('workspace_id', workspaceId!)
        .eq('task_id', taskId!)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) {
        if (code(error) === '42P01') return []
        throw error
      }
      return (data ?? []) as ChecklistItem[]
    },
  })
}

export function useAddChecklistItem() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<
    ChecklistItem,
    Error,
    { workspaceId: string; taskId: string; label: string; position: number }
  >({
    mutationFn: async ({ workspaceId, taskId, label, position }) => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .insert({
          workspace_id: workspaceId,
          task_id: taskId,
          label: label.trim(),
          position,
          done: false,
        })
        .select('id, workspace_id, task_id, position, label, done, done_at, done_by, created_at')
        .single()
      if (error) throw error
      return data as ChecklistItem
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['task-checklist', vars.workspaceId, vars.taskId] })
    },
  })
}

export function useToggleChecklistItem() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<
    void,
    Error,
    { workspaceId: string; taskId: string; id: string; done: boolean }
  >({
    mutationFn: async ({ id, done }) => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id ?? null
      const { error } = await supabase
        .from('task_checklist_items')
        .update({
          done,
          done_at: done ? new Date().toISOString() : null,
          done_by: done ? uid : null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['task-checklist', vars.workspaceId, vars.taskId] })
    },
  })
}

export function useDeleteChecklistItem() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<
    void,
    Error,
    { workspaceId: string; taskId: string; id: string }
  >({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('task_checklist_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['task-checklist', vars.workspaceId, vars.taskId] })
    },
  })
}
