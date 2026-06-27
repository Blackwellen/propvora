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

// ============================================================
// Tenancy payment health — real arrears / on-time / paid-vs-due,
// derived from the `invoices` table (one row per rent charge,
// linked by tenancy_id). Replaces the previously-hardcoded
// arrears/onTimeRate/totalPaid6m on the tenancy detail. 42P01-safe
// (returns zeros if the invoices table is absent in this env).
// ============================================================
export interface TenancyArrears {
  /** Outstanding amount on overdue/unpaid invoices (amount_due − amount_paid). */
  arrears: number
  /** % of due invoices in the last 6 months that are fully paid (100 when none are due). */
  onTimeRate: number
  /** Sum of amount_paid across invoices due in the last 6 months. */
  totalPaid6m: number
  /** Sum of amount_due across invoices due in the last 6 months. */
  totalDue6m: number
}

const EMPTY_ARREARS: TenancyArrears = { arrears: 0, onTimeRate: 100, totalPaid6m: 0, totalDue6m: 0 }

export function useTenancyArrears(workspaceId: string | undefined, tenancyId: string | undefined) {
  const supabase = createClient()
  return useQuery<TenancyArrears>({
    queryKey: [KEY, workspaceId, 'arrears', tenancyId],
    enabled: !!workspaceId && !!tenancyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, due_date, amount_due, amount_paid, status, tenancy_id')
        .eq('workspace_id', workspaceId!)
        .eq('tenancy_id', tenancyId!)
      // Missing table (42P01) or any read error → zeros, never throw on the detail page.
      if (error || !data) return EMPTY_ARREARS

      const now = Date.now()
      const sixMonthsAgo = now - 182 * 24 * 60 * 60 * 1000
      const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)

      let arrears = 0
      let totalPaid6m = 0
      let totalDue6m = 0
      let dueCount = 0
      let paidOnDue = 0

      for (const row of data as Array<{ due_date?: string | null; amount_due?: number | null; amount_paid?: number | null; status?: string | null }>) {
        const status = String(row.status ?? '').toLowerCase()
        const due = num(row.amount_due)
        const paid = num(row.amount_paid)
        const dueTs = row.due_date ? new Date(row.due_date).getTime() : null
        const isPastDue = dueTs != null && dueTs <= now

        if ((status === 'overdue' || status === 'unpaid' || status === 'partial') && isPastDue) {
          arrears += Math.max(0, due - paid)
        }
        if (dueTs != null && dueTs >= sixMonthsAgo && dueTs <= now) {
          totalDue6m += due
          totalPaid6m += paid
          dueCount += 1
          if (status === 'paid') paidOnDue += 1
        }
      }

      return {
        arrears,
        onTimeRate: dueCount > 0 ? Math.round((paidOnDue / dueCount) * 100) : 100,
        totalPaid6m,
        totalDue6m,
      }
    },
  })
}
