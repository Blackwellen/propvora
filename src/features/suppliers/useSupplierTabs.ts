'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// Live data for the supplier detail tabs (Documents / Activity).
// Quotes & Invoices are derived from the supplier's jobs by the page itself.
//
// Tables (verified live):
//   supplier_documents (id, workspace_id, supplier_id, doc_type, name,
//                       expiry_date, is_verified, notes, created_at)
//   contact_activity   (id, workspace_id, contact_id, activity_type, title,
//                       description, linked_type, linked_id, created_at)
//
// Reads are 42P01-safe so a missing migration yields an honest empty state.
// ============================================================

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export interface SupplierDocument {
  id: string
  workspace_id: string
  supplier_id: string
  doc_type: string
  name: string
  expiry_date: string | null
  is_verified: boolean
  notes: string | null
  created_at: string
}

export function useSupplierDocuments(
  workspaceId: string | undefined,
  supplierId: string | undefined
) {
  const supabase = createClient()
  return useQuery<SupplierDocument[]>({
    queryKey: ['supplier-documents', workspaceId, supplierId],
    enabled: !!workspaceId && !!supplierId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_documents')
        .select('id, workspace_id, supplier_id, doc_type, name, expiry_date, is_verified, notes, created_at')
        .eq('workspace_id', workspaceId!)
        .eq('supplier_id', supplierId!)
        .order('created_at', { ascending: false })
      if (error) {
        if (code(error) === '42P01') return []
        throw error
      }
      return (data ?? []) as SupplierDocument[]
    },
  })
}

/** All supplier documents in a workspace (for the workspace-level Compliance page). */
export function useWorkspaceSupplierDocuments(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<SupplierDocument[]>({
    queryKey: ['supplier-documents', workspaceId, 'all'],
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_documents')
        .select('id, workspace_id, supplier_id, doc_type, name, expiry_date, is_verified, notes, created_at')
        .eq('workspace_id', workspaceId!)
        .order('expiry_date', { ascending: true, nullsFirst: false })
      if (error) {
        if (code(error) === '42P01') return []
        throw error
      }
      return (data ?? []) as SupplierDocument[]
    },
  })
}

export interface ContactActivityRow {
  id: string
  workspace_id: string
  contact_id: string
  activity_type: string
  title: string
  description: string | null
  linked_type: string | null
  linked_id: string | null
  created_at: string
}

export function useContactActivity(
  workspaceId: string | undefined,
  contactId: string | undefined
) {
  const supabase = createClient()
  return useQuery<ContactActivityRow[]>({
    queryKey: ['contact-activity', workspaceId, contactId],
    enabled: !!workspaceId && !!contactId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_activity')
        .select('id, workspace_id, contact_id, activity_type, title, description, linked_type, linked_id, created_at')
        .eq('workspace_id', workspaceId!)
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) {
        if (code(error) === '42P01') return []
        throw error
      }
      return (data ?? []) as ContactActivityRow[]
    },
  })
}
