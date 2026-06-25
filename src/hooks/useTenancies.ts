'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Tenancy {
  id: string
  workspace_id: string
  property_id: string
  unit_id: string | null
  tenant_contact_id: string | null
  start_date: string
  end_date: string | null
  rent_amount: number
  deposit_amount: number | null
  deposit_held_by: 'landlord' | 'scheme' | 'agent' | null
  deposit_scheme: string | null
  deposit_reference: string | null
  // App vocabulary. Mapped to the live `tenancies.rent_period` CHECK
  // (weekly|monthly|nightly) and `tenancies.status` enum
  // (draft|active|ended|terminated|uncollectable) at the adapter boundary.
  rent_frequency: 'weekly' | 'monthly' | 'nightly'
  status: 'draft' | 'active' | 'ended' | 'terminated' | 'uncollectable'
  tenancy_type: 'ast' | 'periodic' | 'contractual' | 'lodger' | 'commercial' | 'hmo_room' | null
  reference: string | null
  notes: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface InsertTenancy {
  workspace_id: string
  property_id: string
  unit_id?: string
  tenant_contact_id?: string
  start_date: string
  end_date?: string
  rent_amount: number
  deposit_amount?: number
  deposit_held_by?: string
  deposit_scheme?: string
  rent_frequency?: string
  status?: string
  tenancy_type?: string
  reference?: string
  notes?: string
}

export type UpdateTenancy = Partial<InsertTenancy>

const KEY = 'tenancies'

// ============================================================
// SCHEMA ADAPTER (live `tenancies` lineage <-> app Tenancy)
//   primary_contact_id <-> tenant_contact_id
//   rent_period        <-> rent_frequency
//   deposit_ref        <-> deposit_reference
//
// Live constraints that we MUST satisfy on every write:
//   rent_period CHECK = weekly|monthly|nightly
//   status      enum  = draft|active|ended|terminated|uncollectable
// Older UI vocabulary (pending/disputed/surrendered, quarterly/annually) is
// normalised here so a write never hits an enum/CHECK rejection.
// ============================================================

const PERIOD_TO_DB: Record<string, string> = {
  weekly: 'weekly',
  monthly: 'monthly',
  nightly: 'nightly',
  daily: 'nightly',
  quarterly: 'monthly',
  annually: 'monthly',
  yearly: 'monthly',
}
const STATUS_TO_DB: Record<string, string> = {
  draft: 'draft',
  pending: 'draft',
  active: 'active',
  ended: 'ended',
  surrendered: 'ended',
  expired: 'ended',
  terminated: 'terminated',
  disputed: 'terminated',
  uncollectable: 'uncollectable',
}

function fromDb(r: Record<string, unknown>): Tenancy {
  const g = (k: string): any => r[k]
  return {
    id: g('id'),
    workspace_id: g('workspace_id'),
    property_id: g('property_id'),
    unit_id: g('unit_id') ?? null,
    tenant_contact_id: g('primary_contact_id') ?? g('tenant_contact_id') ?? null,
    start_date: g('start_date'),
    end_date: g('end_date') ?? null,
    rent_amount: (g('rent_amount') ?? 0) as number,
    deposit_amount: g('deposit_amount') ?? null,
    deposit_held_by: g('deposit_held_by') ?? null,
    deposit_scheme: g('deposit_scheme') ?? null,
    deposit_reference: g('deposit_ref') ?? g('deposit_reference') ?? null,
    rent_frequency: ((PERIOD_TO_DB[String(g('rent_period') ?? 'monthly')] ?? 'monthly') as Tenancy['rent_frequency']),
    status: ((STATUS_TO_DB[String(g('status') ?? 'active')] ?? 'active') as Tenancy['status']),
    tenancy_type: g('tenancy_type') ?? null,
    reference: g('reference') ?? null,
    notes: g('notes') ?? null,
    is_demo: false,
    created_at: g('created_at'),
    updated_at: g('updated_at'),
  }
}

function toDb(p: Record<string, any>): Record<string, unknown> {
  const o: Record<string, unknown> = {}
  if ('tenant_contact_id' in p) o.primary_contact_id = p.tenant_contact_id
  if ('rent_frequency' in p) o.rent_period = PERIOD_TO_DB[String(p.rent_frequency)] ?? 'monthly'
  if ('deposit_reference' in p) o.deposit_ref = p.deposit_reference
  if ('tenancy_type' in p) o.tenancy_type = p.tenancy_type
  if ('deposit_held_by' in p) o.deposit_held_by = p.deposit_held_by
  if ('status' in p) o.status = STATUS_TO_DB[String(p.status)] ?? 'active'
  for (const k of [
    'workspace_id', 'property_id', 'unit_id', 'start_date', 'end_date',
    'rent_amount', 'deposit_amount', 'deposit_scheme', 'notes',
  ] as const) {
    if (k in p) o[k] = (p as Record<string, unknown>)[k]
  }
  return o
}

export function useTenancies(workspaceId: string | undefined, propertyId?: string) {
  const supabase = createClient()
  return useQuery<Tenancy[]>({
    queryKey: [KEY, workspaceId, propertyId],
    enabled: !!workspaceId,
    queryFn: async () => {
      let q = supabase
        .from('tenancies')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('start_date', { ascending: false })
      if (propertyId) q = q.eq('property_id', propertyId)
      const { data, error } = await q
      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return (data ?? []).map(fromDb)
    },
    staleTime: 60 * 1000,
  })
}

export function useTenancy(workspaceId: string | undefined, tenancyId: string | undefined) {
  const supabase = createClient()
  return useQuery<Tenancy | null>({
    queryKey: [KEY, workspaceId, 'single', tenancyId],
    enabled: !!workspaceId && !!tenancyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenancies')
        .select('*')
        .eq('id', tenancyId!)
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

export function useCreateTenancy() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<Tenancy, Error, InsertTenancy>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('tenancies')
        .insert(toDb(payload))
        .select()
        .single()
      if (error) throw error
      return fromDb(data)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY, data.workspace_id] })
    },
  })
}

export function useUpdateTenancy() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<Tenancy, Error, { id: string; workspaceId: string; payload: UpdateTenancy }>({
    mutationFn: async ({ id, workspaceId, payload }) => {
      const { data, error } = await supabase
        .from('tenancies')
        .update(toDb(payload))
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .select()
        .single()
      if (error) throw error
      return fromDb(data)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY, data.workspace_id] })
    },
  })
}

export function useDeleteTenancy() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id, workspaceId }) => {
      const { error } = await supabase.from('tenancies').delete().eq('id', id).eq('workspace_id', workspaceId)
      if (error) throw error
    },
    onSuccess: (_d, { workspaceId }) => {
      qc.invalidateQueries({ queryKey: [KEY, workspaceId] })
    },
  })
}
