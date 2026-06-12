'use client'

// ============================================================
// Legal module data layer (live, 42P01-safe)
// Colocated under the legal route as a non-page module — never a route.
// Tables: possession_cases, possession_evidence, hmo_licences (live, empty).
// EPC/RRA have no dedicated tables → derived as readiness over live
// properties / tenancies / compliance_certificates.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ─── Shared helpers ──────────────────────────────────────────
const MISSING_TABLE = '42P01'
const MISSING_COLUMN = '42703'

function isMissing(code: string | undefined) {
  return code === MISSING_TABLE || code === MISSING_COLUMN || code === 'PGRST116'
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null
  const date = new Date(d)
  if (isNaN(date.getTime())) return null
  const now = new Date()
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ============================================================
// POSSESSION CASES
// ============================================================

export interface PossessionCase {
  id: string
  workspace_id: string
  tenancy_id: string | null
  property_id: string | null
  contact_id: string | null
  ground: string
  arrears_amount: number | null
  arrears_weeks: number | null
  status: string
  notice_served_date: string | null
  notice_expiry_date: string | null
  court_applied_date: string | null
  hearing_date: string | null
  court_reference: string | null
  evidence_bundle_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined (best-effort)
  property?: { nickname: string | null } | null
  contact?: { display_name: string | null } | null
}

export interface InsertPossessionCase {
  workspace_id: string
  tenancy_id: string | null
  property_id?: string | null
  contact_id?: string | null
  ground: string
  arrears_amount?: number | null
  arrears_weeks?: number | null
  status?: string
  notice_served_date?: string | null
  notice_expiry_date?: string | null
  notes?: string | null
}

const PC_KEY = 'legal-possession-cases'
// tenancy_id is NOT NULL in schema; we synthesise a zero-uuid when the user
// starts a case without a live tenancy selected.
export const NIL_UUID = '00000000-0000-0000-0000-000000000000'

export function usePossessionCases(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<PossessionCase[]>({
    queryKey: [PC_KEY, workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      // Try with joins first; fall back to plain select if join/column missing.
      const joined = await supabase
        .from('possession_cases')
        .select('*, property:properties(nickname), contact:contacts(display_name)')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })
      if (!joined.error) return (joined.data ?? []) as unknown as PossessionCase[]
      if (joined.error.code === MISSING_TABLE) return []
      // join failed (RLS / column) → plain select
      const plain = await supabase
        .from('possession_cases')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })
      if (plain.error) {
        if (plain.error.code === MISSING_TABLE) return []
        throw plain.error
      }
      return (plain.data ?? []) as unknown as PossessionCase[]
    },
    staleTime: 30 * 1000,
  })
}

export function usePossessionCase(workspaceId: string | undefined, caseId: string | undefined) {
  const supabase = createClient()
  return useQuery<PossessionCase | null>({
    queryKey: [PC_KEY, workspaceId, 'single', caseId],
    enabled: !!workspaceId && !!caseId,
    queryFn: async () => {
      const joined = await supabase
        .from('possession_cases')
        .select('*, property:properties(nickname), contact:contacts(display_name)')
        .eq('id', caseId!)
        .eq('workspace_id', workspaceId!)
        .maybeSingle()
      if (!joined.error) return (joined.data as unknown as PossessionCase) ?? null
      if (isMissing(joined.error.code)) {
        const plain = await supabase
          .from('possession_cases')
          .select('*')
          .eq('id', caseId!)
          .eq('workspace_id', workspaceId!)
          .maybeSingle()
        if (plain.error) {
          if (isMissing(plain.error.code)) return null
          throw plain.error
        }
        return (plain.data as unknown as PossessionCase) ?? null
      }
      throw joined.error
    },
  })
}

export function useCreatePossessionCase() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<PossessionCase, Error, InsertPossessionCase>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('possession_cases')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as unknown as PossessionCase
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [PC_KEY, data.workspace_id] })
    },
  })
}

export function useUpdatePossessionCase() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<
    PossessionCase,
    Error,
    { id: string; workspaceId: string; payload: Partial<InsertPossessionCase> }
  >({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase
        .from('possession_cases')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as PossessionCase
    },
    onSuccess: (data, { workspaceId }) => {
      qc.invalidateQueries({ queryKey: [PC_KEY, workspaceId] })
      qc.invalidateQueries({ queryKey: [PC_KEY, workspaceId, 'single', data.id] })
    },
  })
}

export function useDeletePossessionCase() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('possession_cases').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, { workspaceId }) => {
      qc.invalidateQueries({ queryKey: [PC_KEY, workspaceId] })
    },
  })
}

// ─── Possession evidence ─────────────────────────────────────

export interface PossessionEvidence {
  id: string
  workspace_id: string
  possession_case_id: string
  evidence_type: string
  description: string
  amount: number | null
  event_date: string
  document_path: string | null
  source: string | null
  created_at: string
}

const PE_KEY = 'legal-possession-evidence'

export function usePossessionEvidence(workspaceId: string | undefined, caseId: string | undefined) {
  const supabase = createClient()
  return useQuery<PossessionEvidence[]>({
    queryKey: [PE_KEY, workspaceId, caseId],
    enabled: !!workspaceId && !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('possession_evidence')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .eq('possession_case_id', caseId!)
        .order('event_date', { ascending: false })
      if (error) {
        if (error.code === MISSING_TABLE) return []
        throw error
      }
      return (data ?? []) as unknown as PossessionEvidence[]
    },
    staleTime: 30 * 1000,
  })
}

export function useCreatePossessionEvidence() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<
    PossessionEvidence,
    Error,
    {
      workspace_id: string
      possession_case_id: string
      evidence_type: string
      description: string
      amount?: number | null
      event_date: string
      document_path?: string | null
      source?: string | null
    }
  >({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('possession_evidence')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as unknown as PossessionEvidence
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [PE_KEY, data.workspace_id, data.possession_case_id] })
    },
  })
}

// ============================================================
// HMO LICENCES
// ============================================================

export interface HmoLicence {
  id: string
  workspace_id: string
  property_id: string
  licence_type: string
  licence_number: string | null
  issuing_council: string | null
  issue_date: string | null
  expiry_date: string
  max_occupants: number | null
  max_households: number | null
  conditions: unknown
  document_path: string | null
  status: string
  renewal_reminder_days: number
  created_at: string
  updated_at: string
  property?: { nickname: string | null } | null
}

export interface InsertHmoLicence {
  workspace_id: string
  property_id: string
  licence_type: string
  licence_number?: string | null
  issuing_council?: string | null
  issue_date?: string | null
  expiry_date: string
  max_occupants?: number | null
  max_households?: number | null
  status?: string
}

const HMO_KEY = 'legal-hmo-licences'

export function useHmoLicences(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<HmoLicence[]>({
    queryKey: [HMO_KEY, workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const joined = await supabase
        .from('hmo_licences')
        .select('*, property:properties(nickname)')
        .eq('workspace_id', workspaceId!)
        .order('expiry_date', { ascending: true })
      if (!joined.error) return (joined.data ?? []) as unknown as HmoLicence[]
      if (joined.error.code === MISSING_TABLE) return []
      const plain = await supabase
        .from('hmo_licences')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('expiry_date', { ascending: true })
      if (plain.error) {
        if (plain.error.code === MISSING_TABLE) return []
        throw plain.error
      }
      return (plain.data ?? []) as unknown as HmoLicence[]
    },
    staleTime: 30 * 1000,
  })
}

export function useHmoLicence(workspaceId: string | undefined, licenceId: string | undefined) {
  const supabase = createClient()
  return useQuery<HmoLicence | null>({
    queryKey: [HMO_KEY, workspaceId, 'single', licenceId],
    enabled: !!workspaceId && !!licenceId,
    queryFn: async () => {
      const joined = await supabase
        .from('hmo_licences')
        .select('*, property:properties(nickname)')
        .eq('id', licenceId!)
        .eq('workspace_id', workspaceId!)
        .maybeSingle()
      if (!joined.error) return (joined.data as unknown as HmoLicence) ?? null
      if (isMissing(joined.error.code)) {
        const plain = await supabase
          .from('hmo_licences')
          .select('*')
          .eq('id', licenceId!)
          .eq('workspace_id', workspaceId!)
          .maybeSingle()
        if (plain.error) {
          if (isMissing(plain.error.code)) return null
          throw plain.error
        }
        return (plain.data as unknown as HmoLicence) ?? null
      }
      throw joined.error
    },
  })
}

export function useCreateHmoLicence() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<HmoLicence, Error, InsertHmoLicence>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('hmo_licences')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as unknown as HmoLicence
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [HMO_KEY, data.workspace_id] })
    },
  })
}

export function useUpdateHmoLicence() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<
    HmoLicence,
    Error,
    { id: string; workspaceId: string; payload: Partial<InsertHmoLicence> }
  >({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase
        .from('hmo_licences')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as HmoLicence
    },
    onSuccess: (data, { workspaceId }) => {
      qc.invalidateQueries({ queryKey: [HMO_KEY, workspaceId] })
      qc.invalidateQueries({ queryKey: [HMO_KEY, workspaceId, 'single', data.id] })
    },
  })
}

export function useDeleteHmoLicence() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('hmo_licences').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, { workspaceId }) => {
      qc.invalidateQueries({ queryKey: [HMO_KEY, workspaceId] })
    },
  })
}

// ============================================================
// EPC ADVISORY — derived from live compliance_certificates (type='epc')
// No dedicated EPC table. EPC certificates live on compliance_certificates.
// ============================================================

export interface EpcCertificate {
  id: string
  property_id: string | null
  reference_number: string | null
  issue_date: string | null
  expiry_date: string | null
  status: string
  property_name?: string | null
}

const EPC_KEY = 'legal-epc-certificates'

export function useEpcCertificates(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<EpcCertificate[]>({
    queryKey: [EPC_KEY, workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const joined = await supabase
        .from('compliance_certificates')
        .select('id, property_id, reference_number, issue_date, expiry_date, status, property:properties(nickname)')
        .eq('workspace_id', workspaceId!)
        .eq('certificate_type', 'epc')
      const rows = !joined.error
        ? joined.data
        : joined.error.code === MISSING_TABLE
          ? []
          : (
              await supabase
                .from('compliance_certificates')
                .select('id, property_id, reference_number, issue_date, expiry_date, status')
                .eq('workspace_id', workspaceId!)
                .eq('certificate_type', 'epc')
            ).data ?? []
      return ((rows ?? []) as Array<Record<string, unknown>>).map((r) => ({
        id: r.id as string,
        property_id: (r.property_id as string) ?? null,
        reference_number: (r.reference_number as string) ?? null,
        issue_date: (r.issue_date as string) ?? null,
        expiry_date: (r.expiry_date as string) ?? null,
        status: (r.status as string) ?? 'valid',
        property_name:
          ((r.property as { nickname?: string } | null)?.nickname as string) ?? null,
      }))
    },
    staleTime: 60 * 1000,
  })
}

// EPC ratings are not stored as a column on properties in this lineage.
// Readiness is computed from EPC certificate coverage + validity, which is
// honest, live data. We expose the helper so the page renders real numbers.
export interface EpcReadiness {
  totalProperties: number
  withCert: number
  validCert: number
  expiredCert: number
  expiringCert: number
  missingCert: number
  readinessPct: number
}

export function computeEpcReadiness(
  propertyIds: string[],
  certs: EpcCertificate[]
): EpcReadiness {
  const total = propertyIds.length
  const certByProperty = new Map<string, EpcCertificate>()
  for (const c of certs) {
    if (c.property_id) certByProperty.set(c.property_id, c)
  }
  let valid = 0
  let expired = 0
  let expiring = 0
  for (const pid of propertyIds) {
    const c = certByProperty.get(pid)
    if (!c) continue
    const days = daysUntil(c.expiry_date)
    if (days == null) {
      valid++
    } else if (days < 0) {
      expired++
    } else if (days <= 90) {
      expiring++
      valid++
    } else {
      valid++
    }
  }
  const withCert = certByProperty.size
  const missing = Math.max(0, total - withCert)
  const readinessPct = total === 0 ? 0 : Math.round((valid / total) * 100)
  return {
    totalProperties: total,
    withCert,
    validCert: valid,
    expiredCert: expired,
    expiringCert: expiring,
    missingCert: missing,
    readinessPct,
  }
}

// ============================================================
// RRA 2026 — readiness checklist computed from live tenancies / properties.
// Rules are configurable LABELS (not hardcoded legal truth). Each item maps
// to a live signal so the % is real, not fabricated.
// ============================================================

export interface RraTenancySignal {
  total: number
  periodic: number
  fixed: number
  active: number
}

export function summariseTenancies(
  tenancies: Array<{ tenancy_type: string | null; status: string }>
): RraTenancySignal {
  let periodic = 0
  let fixed = 0
  let active = 0
  for (const t of tenancies) {
    if (t.status === 'active') active++
    if (t.tenancy_type === 'periodic') periodic++
    else if (t.tenancy_type === 'ast' || t.tenancy_type === 'contractual') fixed++
  }
  return { total: tenancies.length, periodic, fixed, active }
}
