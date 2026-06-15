'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Invoice, InsertInvoice, UpdateInvoice, InvoiceStatus, InvoiceType } from '@/types/database'
import { useNotify } from '@/hooks/useNotify'

const QUERY_KEY = 'invoices'

// ============================================================
// LIST
// ============================================================

export function useInvoices(
  workspaceId: string | undefined,
  filters?: {
    status?: InvoiceStatus
    invoice_type?: InvoiceType
    contact_id?: string
    property_id?: string
  }
) {
  const supabase = createClient()

  return useQuery<Invoice[]>({
    queryKey: [QUERY_KEY, workspaceId, filters],
    enabled: !!workspaceId,
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('issue_date', { ascending: false })

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.invoice_type) query = query.eq('invoice_type', filters.invoice_type)
      if (filters?.contact_id) query = query.eq('contact_id', filters.contact_id)
      if (filters?.property_id) query = query.eq('property_id', filters.property_id)

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

// ============================================================
// SINGLE
// ============================================================

export function useInvoice(workspaceId: string | undefined, invoiceId: string | undefined) {
  const supabase = createClient()

  return useQuery<Invoice | null>({
    queryKey: [QUERY_KEY, workspaceId, invoiceId],
    enabled: !!workspaceId && !!invoiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId!)
        .eq('workspace_id', workspaceId!)
        .single()

      if (error) throw error
      return data
    },
  })
}

// ============================================================
// CREATE
// ============================================================

export function useCreateInvoice() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<Invoice, Error, InsertInvoice>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('invoices')
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

export function useUpdateInvoice() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { notify, actorId } = useNotify()

  return useMutation<Invoice, Error, { id: string; workspaceId: string; payload: UpdateInvoice }>({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      // EVENT: invoice paid — fire when this update transitions status to paid.
      if ((payload as { status?: string }).status === 'paid') {
        const recipient = (data as { created_by?: string | null }).created_by ?? actorId
        const total = (data as { total?: number | null }).total
        if (recipient) {
          notify('notifyInvoicePaid', {
            invoiceId: id,
            userId: recipient,
            label: `Invoice ${(data as { invoice_number?: string }).invoice_number ?? ''}`.trim(),
            amount: total != null ? `£${Number(total).toLocaleString()}` : null,
          })
        }
      }
      return data
    },
    onMutate: async ({ id, workspaceId, payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, workspaceId, id] })
      const previous = queryClient.getQueryData<Invoice>([QUERY_KEY, workspaceId, id])
      if (previous) {
        queryClient.setQueryData<Invoice>([QUERY_KEY, workspaceId, id], { ...previous, ...payload })
      }
      return { previous }
    },
    onError: (_err, { id, workspaceId }, context) => {
      const ctx = context as { previous: Invoice | undefined } | undefined
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
// MARK PAID (convenience)
// ============================================================

export function useMarkInvoicePaid() {
  const updateInvoice = useUpdateInvoice()

  return useMutation<Invoice, Error, { id: string; workspaceId: string; amount?: number }>({
    mutationFn: ({ id, workspaceId, amount }) =>
      updateInvoice.mutateAsync({
        id,
        workspaceId,
        payload: {
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_amount: amount,
        },
      }),
  })
}

// ============================================================
// DELETE
// ============================================================

export function useDeleteInvoice() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, workspaceId] })
    },
  })
}
