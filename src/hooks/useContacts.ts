'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Contact, InsertContact, UpdateContact, ContactType } from '@/types/database'

const QUERY_KEY = 'contacts'

// ============================================================
// SCHEMA ADAPTER  (live `contacts` lineage <-> app Contact)
//   type        <-> contact_type
//   display_name<-> full_name
//   company     <-> company_name
//   demo        <-> is_demo
//   address_line1/city/postcode/avatar_url/status added via migration ...0009
// ============================================================

function fromDb(r: Record<string, unknown>): Contact {
  const g = (k: string): any => r[k]
  return {
    id: g('id'),
    workspace_id: g('workspace_id'),
    contact_type: (g('type') ?? 'other') as ContactType,
    full_name: (g('display_name') ?? '') as string,
    email: g('email') ?? null,
    phone: g('phone') ?? null,
    company_name: g('company') ?? g('business_name') ?? null,
    address_line1: g('address_line1') ?? g('address') ?? null,
    city: g('city') ?? null,
    postcode: g('postcode') ?? null,
    notes: g('notes') ?? null,
    tags: g('tags') ?? null,
    category: g('category') ?? null,
    subcategory: g('subcategory') ?? null,
    status: (g('status') ?? 'active') as Contact['status'],
    is_demo: (g('demo') ?? false) as boolean,
    avatar_url: g('avatar_url') ?? null,
    metadata: g('metadata') ?? null,
    created_by: g('created_by') ?? null,
    created_at: g('created_at'),
    updated_at: g('updated_at'),
  }
}

function toDb(p: Partial<Contact>): Record<string, unknown> {
  const o: Record<string, unknown> = {}
  if ('contact_type' in p) o.type = p.contact_type
  if ('full_name' in p) o.display_name = p.full_name
  if ('company_name' in p) o.company = p.company_name
  if ('is_demo' in p) o.demo = p.is_demo
  // NB: `created_by` is intentionally NOT forwarded — the live `contacts` table
  // has no such column, and emitting it makes every insert/update fail (42703).
  for (const k of [
    'workspace_id', 'email', 'phone', 'address_line1', 'city', 'postcode',
    'notes', 'tags', 'status', 'avatar_url', 'category', 'subcategory', 'metadata',
  ] as const) {
    if (!(k in p)) continue
    const v = (p as Record<string, unknown>)[k]
    // `tags` and `metadata` are NOT NULL columns with DB defaults ('{}'). Sending
    // an explicit null violates the not-null constraint (Postgres 23502 → HTTP
    // 400), which silently broke the New Contact wizard. Omit these keys when
    // null/undefined so Postgres applies the default instead.
    if ((k === 'tags' || k === 'metadata') && (v === null || v === undefined)) continue
    o[k] = v
  }
  return o
}

// ============================================================
// LIST
// ============================================================

export function useContacts(
  workspaceId: string | undefined,
  filters?: { contact_type?: ContactType; status?: Contact['status'] }
) {
  const supabase = createClient()
  return useQuery<Contact[]>({
    queryKey: [QUERY_KEY, workspaceId, filters],
    enabled: !!workspaceId,
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('display_name', { ascending: true })

      if (filters?.contact_type) query = query.eq('type', filters.contact_type)
      if (filters?.status) query = query.eq('status', filters.status)

      const { data, error } = await query
      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return (data ?? []).map(fromDb)
    },
    staleTime: 60 * 1000,
  })
}

// ============================================================
// SINGLE
// ============================================================

export function useContact(workspaceId: string | undefined, contactId: string | undefined) {
  const supabase = createClient()
  return useQuery<Contact | null>({
    queryKey: [QUERY_KEY, workspaceId, contactId],
    enabled: !!workspaceId && !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId!)
        .eq('workspace_id', workspaceId!)
        .single()
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') return null
        throw error
      }
      return data ? fromDb(data) : null
    },
  })
}

// ============================================================
// CREATE
// ============================================================

export function useCreateContact() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation<Contact, Error, InsertContact>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert(toDb(payload as Partial<Contact>))
        .select()
        .single()
      if (error) throw error
      return fromDb(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.workspace_id] })
    },
  })
}

// ============================================================
// UPDATE
// ============================================================

export function useUpdateContact() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation<Contact, Error, { id: string; workspaceId: string; payload: UpdateContact }>({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(toDb(payload as Partial<Contact>))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return fromDb(data)
    },
    onMutate: async ({ id, workspaceId, payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, workspaceId, id] })
      const previous = queryClient.getQueryData<Contact>([QUERY_KEY, workspaceId, id])
      if (previous) {
        queryClient.setQueryData<Contact>([QUERY_KEY, workspaceId, id], { ...previous, ...payload })
      }
      return { previous }
    },
    onError: (_err, { id, workspaceId }, context) => {
      const ctx = context as { previous: Contact | undefined } | undefined
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

export function useDeleteContact() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
    },
  })
}
