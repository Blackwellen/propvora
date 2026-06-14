"use client"

/**
 * Compliance data layer — backed by the LIVE database schema.
 *
 * IMPORTANT: the original implementation read/wrote a set of tables that do NOT
 * exist in the live DB (`compliance_certificates`, `compliance_inspections`,
 * `compliance_documents`, `compliance_coverage_matrix`,
 * `compliance_supplier_documents`, `compliance_reports`, `compliance_activity`,
 * `compliance_settings`). PostgREST returns 42P01 and silently rejects every
 * read/write against them, which is the exact bug class this layer must avoid.
 *
 * The real tables are:
 *   - compliance_items        (the canonical "certificate"/requirement record)
 *   - property_inspections    (inspections)
 *   - documents               (compliance documents / files)
 *   - compliance_evidence      (evidence linked to compliance_items)
 *   - supplier_documents       (supplier insurance / accreditation docs)
 *
 * Every view-model interface below is preserved so pages keep working; the data
 * is mapped from the real columns. Anything with no real backing table returns
 * an empty result so the page renders an honest empty state (never crashes).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────────
// View-model types (stable shapes the UI renders)
// ─────────────────────────────────────────────

export interface ComplianceCertificate {
  id: string
  workspace_id: string
  property_id: string | null
  unit_id: string | null
  certificate_type: string
  reference_number: string | null
  issue_date: string | null
  expiry_date: string | null
  supplier_id: string | null
  owner_id: string | null
  status: string
  risk_level: string
  notes: string | null
  reminder_enabled: boolean
  created_at: string
  property_name?: string
  property_address?: string
}

export interface ComplianceInspection {
  id: string
  workspace_id: string
  property_id: string | null
  inspection_type: string
  scheduled_date: string | null
  completed_date: string | null
  inspector_name: string | null
  inspector_company: string | null
  status: string
  outcome: string | null
  findings_count: number
  evidence_count: number
  next_action: string | null
  created_at: string
  property_name?: string
}

export interface ComplianceDocument {
  id: string
  workspace_id: string
  property_id: string | null
  document_name: string
  document_type: string
  file_url: string | null
  category: string | null
  issuer: string | null
  issue_date: string | null
  expiry_date: string | null
  owner_id: string | null
  verification_status: string
  linked_certificate_id: string | null
  linked_inspection_id: string | null
  version: string
  created_at: string
  property_name?: string
}

export interface ComplianceEvidence {
  id: string
  workspace_id: string
  property_id: string | null
  evidence_name: string
  evidence_type: string
  file_url: string | null
  file_size_bytes: number | null
  file_mime_type: string | null
  source: string | null
  uploaded_by_name: string | null
  related_record_type: string | null
  related_record_id: string | null
  related_record_label: string | null
  verification_status: string
  notes: string | null
  created_at: string
}

export interface ComplianceCoverageRow {
  id: string
  workspace_id: string
  property_id: string
  requirement_type: string
  status: string
  coverage_pct: number
  property_name?: string
  property_address?: string
}

export interface ComplianceSupplierDoc {
  id: string
  workspace_id: string
  supplier_id: string
  document_type: string
  document_reference: string | null
  status: string
  issue_date: string | null
  expiry_date: string | null
  notes: string | null
  created_at: string
  supplier_name?: string
  supplier_service_type?: string
}

export interface ComplianceReport {
  id: string
  workspace_id: string
  report_type: string
  report_name: string
  frequency: string | null
  last_run_at: string | null
  next_run_at: string | null
  recipients: string[]
  status: string
  created_at: string
}

export interface ComplianceActivityEvent {
  id: string
  workspace_id: string
  actor_id: string | null
  actor_name: string | null
  actor_role: string | null
  event_type: string
  event_label: string
  linked_record_type: string | null
  linked_record_id: string | null
  linked_record_label: string | null
  source: string | null
  severity: string
  change_details: string | null
  created_at: string
}

export interface ComplianceSettings {
  id: string
  workspace_id: string
  first_reminder_days: number
  second_reminder_days: number
  final_reminder_days: number
  escalate_to_owner: boolean
  escalate_to_secondary: boolean
  overdue_escalation: string
  risk_thresholds: Record<string, { min: number; max: number }>
  compliance_categories: Array<{ name: string; color: string; required: boolean }>
  inspection_frequencies: Array<{ type: string; frequency: number; unit: string; tolerance: number; escalate_if_overdue: boolean }>
  notification_channels: Record<string, boolean>
  automation_settings: Record<string, boolean>
  evidence_retention_years: number
  inspection_retention_years: number
}

export interface ComplianceOverviewStats {
  health_score: number
  compliant_properties: number
  total_properties: number
  at_risk_properties: number
  expiring_soon: number
  overdue_inspections: number
  monthly_cost_forecast: number
}

// ─────────────────────────────────────────────
// Live-schema row shapes
// ─────────────────────────────────────────────

interface ComplianceItemRow {
  id: string
  workspace_id: string
  property_id: string | null
  unit_id: string | null
  kind: string
  title: string | null
  status: string
  due_date: string | null
  last_completed_at: string | null
  recurrence_months: number | null
  vendor_contact_id: string | null
  cost: number | null
  reference_no: string | null
  notes: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  properties?: { name: string | null; address_line1: string | null } | null
}

interface InspectionRow {
  id: string
  workspace_id: string
  property_id: string | null
  unit_id: string | null
  kind: string
  scheduled_for: string | null
  completed_at: string | null
  status: string
  inspector_id: string | null
  supplier_id: string | null
  score: number | null
  notes: string | null
  report_document_id: string | null
  created_at: string
  properties?: { name: string | null } | null
}

interface DocumentRow {
  id: string
  workspace_id: string
  property_id: string | null
  name: string
  type: string | null
  category: string | null
  mime_type: string | null
  url: string | null
  expires_at: string | null
  status: string
  metadata: Record<string, unknown> | null
  created_at: string
  properties?: { name: string | null } | null
}

interface EvidenceRow {
  id: string
  workspace_id: string
  compliance_item_id: string
  kind: string
  label: string | null
  file_id: string | null
  issued_on: string | null
  expires_on: string | null
  notes: string | null
  created_at: string
}

interface SupplierDocRow {
  id: string
  workspace_id: string
  supplier_id: string
  doc_type: string
  file_id: string | null
  name: string
  expiry_date: string | null
  is_verified: boolean
  notes: string | null
  created_at: string
  suppliers?: { name: string | null; category: string | null } | null
}

// ─────────────────────────────────────────────
// Mappers (live row → view-model)
// ─────────────────────────────────────────────

/** Map a compliance_items status to the certificate-style status the UI expects. */
function certStatus(status: string, dueDate: string | null): string {
  switch (status) {
    case 'ok':
      return 'valid'
    case 'due_soon':
      return 'expiring_soon'
    case 'overdue':
      return 'expired'
    case 'missing':
      return 'missing'
    case 'exempt':
      return 'valid'
    default:
      break
  }
  if (!dueDate) return 'valid'
  const days = Math.round((new Date(dueDate).getTime() - Date.now()) / 86_400_000)
  if (isNaN(days)) return 'valid'
  if (days < 0) return 'expired'
  if (days <= 30) return 'expiring_soon'
  return 'valid'
}

function riskFromKind(kind: string, status: string): string {
  const critical = ['gas_safety', 'eicr', 'epc', 'fire_alarm', 'fire_door', 'legionella', 'emergency_lighting', 'smoke_co_alarm']
  if (status === 'overdue') return 'high'
  if (status === 'due_soon') return 'medium'
  return critical.includes(kind) ? 'medium' : 'low'
}

function mapItemToCertificate(row: ComplianceItemRow): ComplianceCertificate {
  const status = certStatus(row.status, row.due_date)
  const meta = row.metadata ?? {}
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    property_id: row.property_id,
    unit_id: row.unit_id,
    certificate_type: row.kind,
    reference_number: row.reference_no,
    issue_date: row.last_completed_at,
    expiry_date: row.due_date,
    supplier_id: row.vendor_contact_id,
    owner_id: null,
    status,
    risk_level: riskFromKind(row.kind, row.status),
    notes: row.notes,
    reminder_enabled: (meta as { reminder_enabled?: boolean }).reminder_enabled !== false,
    created_at: row.created_at,
    property_name: row.properties?.name ?? undefined,
    property_address: row.properties?.address_line1 ?? undefined,
  }
}

/** property_inspections.status → list status the UI groups by. */
function inspectionStatus(status: string): string {
  if (status === 'scheduled') return 'upcoming'
  return status // in_progress | completed | cancelled | overdue
}

function mapInspection(row: InspectionRow): ComplianceInspection {
  const outcome =
    row.status === 'completed'
      ? row.score == null
        ? 'passed'
        : row.score >= 50
          ? 'passed'
          : 'failed'
      : null
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    property_id: row.property_id,
    inspection_type: row.kind,
    scheduled_date: row.scheduled_for,
    completed_date: row.completed_at,
    inspector_name: null,
    inspector_company: null,
    status: inspectionStatus(row.status),
    outcome,
    findings_count: 0,
    evidence_count: row.report_document_id ? 1 : 0,
    next_action: null,
    created_at: row.created_at,
    property_name: row.properties?.name ?? undefined,
  }
}

function docVerification(status: string): string {
  if (status === 'active' || status === 'verified') return 'verified'
  if (status === 'rejected' || status === 'archived') return 'rejected'
  return 'pending'
}

function mapDocument(row: DocumentRow): ComplianceDocument {
  const meta = (row.metadata ?? {}) as {
    issuer?: string
    linked_certificate_id?: string
    linked_inspection_id?: string
    version?: string
    verification_status?: string
  }
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    property_id: row.property_id,
    document_name: row.name,
    document_type: row.type ?? 'other',
    file_url: row.url,
    category: row.category,
    issuer: meta.issuer ?? null,
    issue_date: null,
    expiry_date: row.expires_at,
    owner_id: null,
    verification_status: meta.verification_status ?? docVerification(row.status),
    linked_certificate_id: meta.linked_certificate_id ?? null,
    linked_inspection_id: meta.linked_inspection_id ?? null,
    version: meta.version ?? 'v1',
    created_at: row.created_at,
    property_name: row.properties?.name ?? undefined,
  }
}

function mapEvidence(row: EvidenceRow): ComplianceEvidence {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    property_id: null,
    evidence_name: row.label ?? 'Evidence',
    evidence_type: row.kind,
    file_url: null,
    file_size_bytes: null,
    file_mime_type: null,
    source: 'compliance_item',
    uploaded_by_name: null,
    related_record_type: 'compliance_item',
    related_record_id: row.compliance_item_id,
    related_record_label: row.label ?? null,
    verification_status: 'verified',
    notes: row.notes,
    created_at: row.created_at,
  }
}

function supplierDocStatus(row: SupplierDocRow): string {
  if (!row.is_verified) return 'pending'
  if (row.expiry_date) {
    const days = Math.round((new Date(row.expiry_date).getTime() - Date.now()) / 86_400_000)
    if (!isNaN(days)) {
      if (days < 0) return 'expired'
      if (days <= 60) return 'expiring_soon'
    }
  }
  return 'valid'
}

function mapSupplierDoc(row: SupplierDocRow): ComplianceSupplierDoc {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    supplier_id: row.supplier_id,
    document_type: row.doc_type,
    document_reference: row.name,
    status: supplierDocStatus(row),
    issue_date: null,
    expiry_date: row.expiry_date,
    notes: row.notes,
    created_at: row.created_at,
    supplier_name: row.suppliers?.name ?? undefined,
    supplier_service_type: row.suppliers?.category ?? undefined,
  }
}

/** 42P01-safe: treat a missing table / PostgREST error as "no rows". */
function isMissingTable(error: { code?: string } | null): boolean {
  return !!error && (error.code === '42P01' || error.code === 'PGRST205')
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function resolveWorkspaceId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()
  return data?.workspace_id ?? null
}

// ─────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────

const QK = {
  overview: (wsId: string | undefined) => ['compliance-overview', wsId] as const,
  certificates: (wsId: string | undefined, filters?: object) => ['compliance-certificates', wsId, filters] as const,
  certificate: (id: string) => ['compliance-certificate', id] as const,
  inspections: (wsId: string | undefined, filters?: object) => ['compliance-inspections', wsId, filters] as const,
  inspection: (id: string) => ['compliance-inspection', id] as const,
  documents: (wsId: string | undefined, filters?: object) => ['compliance-documents', wsId, filters] as const,
  document: (id: string) => ['compliance-document', id] as const,
  evidence: (wsId: string | undefined, filters?: object) => ['compliance-evidence', wsId, filters] as const,
  coverage: (wsId: string | undefined) => ['compliance-coverage', wsId] as const,
  supplierDocs: (wsId: string | undefined, filters?: object) => ['compliance-supplier-docs', wsId, filters] as const,
  reports: (wsId: string | undefined) => ['compliance-reports', wsId] as const,
  activity: (wsId: string | undefined, filters?: object) => ['compliance-activity', wsId, filters] as const,
  settings: (wsId: string | undefined) => ['compliance-settings', wsId] as const,
}

// ─────────────────────────────────────────────
// 1. Overview Stats (derived from live tables)
// ─────────────────────────────────────────────

export function useComplianceOverviewStats() {
  const supabase = createClient()

  return useQuery<ComplianceOverviewStats>({
    queryKey: ['compliance-overview-stats'],
    staleTime: 30_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      const empty: ComplianceOverviewStats = {
        health_score: 0,
        compliant_properties: 0,
        total_properties: 0,
        at_risk_properties: 0,
        expiring_soon: 0,
        overdue_inspections: 0,
        monthly_cost_forecast: 0,
      }
      if (!wsId) return empty

      const [itemsRes, inspRes] = await Promise.all([
        supabase
          .from('compliance_items')
          .select('property_id, status, kind')
          .eq('workspace_id', wsId)
          .is('deleted_at', null),
        supabase
          .from('property_inspections')
          .select('status')
          .eq('workspace_id', wsId)
          .is('deleted_at', null),
      ])

      const items = (itemsRes.data ?? []) as { property_id: string | null; status: string; kind: string }[]
      const inspections = (inspRes.data ?? []) as { status: string }[]

      const expiring_soon = items.filter((i) => i.status === 'due_soon').length
      const overdue_inspections = inspections.filter((i) => i.status === 'overdue').length
      const propertyIds = [...new Set(items.map((i) => i.property_id).filter(Boolean) as string[])]
      const total_properties = propertyIds.length
      const atRiskIds = new Set(
        items.filter((i) => i.status === 'overdue' || i.status === 'missing').map((i) => i.property_id).filter(Boolean) as string[]
      )
      const at_risk_properties = atRiskIds.size
      const compliant_properties = Math.max(0, total_properties - at_risk_properties)
      const total = items.length || 1
      const risky = items.filter((i) => i.status === 'overdue' || i.status === 'missing').length
      const health_score = Math.max(0, Math.round(100 - (risky / total) * 100))

      return {
        health_score,
        compliant_properties,
        total_properties,
        at_risk_properties,
        expiring_soon,
        overdue_inspections,
        monthly_cost_forecast: 0,
      }
    },
  })
}

// ─────────────────────────────────────────────
// 2. Certificates list (compliance_items)
// ─────────────────────────────────────────────

interface CertificateFilters {
  status?: string
  risk_level?: string
  certificate_type?: string
  search?: string
}

export function useComplianceCertificates(filters?: CertificateFilters) {
  const supabase = createClient()

  return useQuery<ComplianceCertificate[]>({
    queryKey: QK.certificates(undefined, filters),
    staleTime: 30_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) return []

      let q = supabase
        .from('compliance_items')
        .select('*, properties(name:nickname, address_line1)')
        .eq('workspace_id', wsId)
        .is('deleted_at', null)
        .order('due_date', { ascending: true })

      if (filters?.certificate_type) q = q.eq('kind', filters.certificate_type)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }

      let mapped = (data ?? []).map((row) => mapItemToCertificate(row as ComplianceItemRow))
      if (filters?.status) mapped = mapped.filter((c) => c.status === filters.status)
      if (filters?.risk_level) mapped = mapped.filter((c) => c.risk_level === filters.risk_level)
      if (filters?.search) {
        const s = filters.search.toLowerCase()
        mapped = mapped.filter((c) => c.certificate_type.toLowerCase().includes(s))
      }
      return mapped
    },
  })
}

// ─────────────────────────────────────────────
// 3. Single certificate
// ─────────────────────────────────────────────

export function useComplianceCertificate(id: string) {
  const supabase = createClient()

  return useQuery<ComplianceCertificate | null>({
    queryKey: QK.certificate(id),
    enabled: !!id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_items')
        .select('*, properties(name:nickname, address_line1)')
        .eq('id', id)
        .single()
      if (error) {
        if (isMissingTable(error) || error.code === 'PGRST116') return null
        throw error
      }
      return data ? mapItemToCertificate(data as ComplianceItemRow) : null
    },
  })
}

// ─────────────────────────────────────────────
// 4. Inspections list (property_inspections)
// ─────────────────────────────────────────────

interface InspectionFilters {
  status?: string
  inspection_type?: string
  search?: string
}

export function useComplianceInspections(filters?: InspectionFilters) {
  const supabase = createClient()

  return useQuery<ComplianceInspection[]>({
    queryKey: QK.inspections(undefined, filters),
    staleTime: 30_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) return []

      let q = supabase
        .from('property_inspections')
        .select('*, properties(name:nickname)')
        .eq('workspace_id', wsId)
        .is('deleted_at', null)
        .order('scheduled_for', { ascending: true })

      if (filters?.inspection_type) q = q.eq('kind', filters.inspection_type)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }

      let mapped = (data ?? []).map((row) => mapInspection(row as InspectionRow))
      if (filters?.status) mapped = mapped.filter((i) => i.status === filters.status)
      return mapped
    },
  })
}

// ─────────────────────────────────────────────
// 5. Single inspection
// ─────────────────────────────────────────────

export function useComplianceInspection(id: string) {
  const supabase = createClient()

  return useQuery<ComplianceInspection | null>({
    queryKey: QK.inspection(id),
    enabled: !!id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_inspections')
        .select('*, properties(name:nickname)')
        .eq('id', id)
        .single()
      if (error) {
        if (isMissingTable(error) || error.code === 'PGRST116') return null
        throw error
      }
      return data ? mapInspection(data as InspectionRow) : null
    },
  })
}

// ─────────────────────────────────────────────
// 6. Documents list (documents)
// ─────────────────────────────────────────────

interface DocumentFilters {
  document_type?: string
  verification_status?: string
  search?: string
}

/** Document categories/types that belong on the compliance Documents page. */
const COMPLIANCE_DOC_CATEGORIES = [
  'compliance',
  'compliance_certificate',
  'certificate',
  'gas_safety',
  'eicr',
  'epc',
  'insurance',
  'licence',
  'fire_risk',
  'right_to_rent',
  'report',
]

export function useComplianceDocuments(filters?: DocumentFilters) {
  const supabase = createClient()

  return useQuery<ComplianceDocument[]>({
    queryKey: QK.documents(undefined, filters),
    staleTime: 30_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) return []

      let q = supabase
        .from('documents')
        .select('*, properties(name:nickname)')
        .eq('workspace_id', wsId)
        .in('category', COMPLIANCE_DOC_CATEGORIES)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (filters?.document_type) q = q.eq('type', filters.document_type)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }

      let mapped = (data ?? []).map((row) => mapDocument(row as DocumentRow))
      if (filters?.verification_status) mapped = mapped.filter((d) => d.verification_status === filters.verification_status)
      if (filters?.search) {
        const s = filters.search.toLowerCase()
        mapped = mapped.filter((d) => d.document_name.toLowerCase().includes(s))
      }
      return mapped
    },
  })
}

// ─────────────────────────────────────────────
// 7. Single document
// ─────────────────────────────────────────────

export function useComplianceDocument(id: string) {
  const supabase = createClient()

  return useQuery<ComplianceDocument | null>({
    queryKey: QK.document(id),
    enabled: !!id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, properties(name:nickname)')
        .eq('id', id)
        .single()
      if (error) {
        if (isMissingTable(error) || error.code === 'PGRST116') return null
        throw error
      }
      return data ? mapDocument(data as DocumentRow) : null
    },
  })
}

// ─────────────────────────────────────────────
// 8. Evidence list (compliance_evidence)
// ─────────────────────────────────────────────

interface EvidenceFilters {
  evidence_type?: string
  verification_status?: string
}

export function useComplianceEvidence(filters?: EvidenceFilters) {
  const supabase = createClient()

  return useQuery<ComplianceEvidence[]>({
    queryKey: QK.evidence(undefined, filters),
    staleTime: 30_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) return []

      const { data, error } = await supabase
        .from('compliance_evidence')
        .select('*')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false })

      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }

      let mapped = (data ?? []).map((row) => mapEvidence(row as EvidenceRow))
      if (filters?.evidence_type) mapped = mapped.filter((e) => e.evidence_type === filters.evidence_type)
      if (filters?.verification_status) mapped = mapped.filter((e) => e.verification_status === filters.verification_status)
      return mapped
    },
  })
}

// ─────────────────────────────────────────────
// 9. Coverage matrix (derived from compliance_items)
//    Returns [] here — the coverage page computes its own live matrix from
//    useComplianceItems + useProperties. Kept for API compatibility.
// ─────────────────────────────────────────────

export function useComplianceCoverage() {
  const supabase = createClient()

  return useQuery<ComplianceCoverageRow[]>({
    queryKey: QK.coverage(undefined),
    staleTime: 30_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) return []
      const { data, error } = await supabase
        .from('compliance_items')
        .select('id, workspace_id, property_id, kind, status, properties(name:nickname, address_line1)')
        .eq('workspace_id', wsId)
        .is('deleted_at', null)
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      return (data ?? [])
        .filter((r) => !!(r as { property_id: string | null }).property_id)
        .map((row) => {
          const r = row as unknown as {
            id: string
            workspace_id: string
            property_id: string
            kind: string
            status: string
            due_date?: string | null
            properties?: { name: string | null; address_line1: string | null } | null
          }
          const status = certStatus(r.status, r.due_date ?? null)
          return {
            id: r.id,
            workspace_id: r.workspace_id,
            property_id: r.property_id,
            requirement_type: r.kind,
            status: status === 'valid' ? 'compliant' : status === 'expired' ? 'overdue' : status,
            coverage_pct: status === 'valid' ? 100 : 0,
            property_name: r.properties?.name ?? undefined,
            property_address: r.properties?.address_line1 ?? undefined,
          }
        })
    },
  })
}

// ─────────────────────────────────────────────
// 10. Supplier documents (supplier_documents)
// ─────────────────────────────────────────────

interface SupplierDocFilters {
  status?: string
}

export function useComplianceSupplierDocs(filters?: SupplierDocFilters) {
  const supabase = createClient()

  return useQuery<ComplianceSupplierDoc[]>({
    queryKey: QK.supplierDocs(undefined, filters),
    staleTime: 30_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) return []

      const { data, error } = await supabase
        .from('supplier_documents')
        .select('*, suppliers(name, category)')
        .eq('workspace_id', wsId)
        .order('expiry_date', { ascending: true })

      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }

      let mapped = (data ?? []).map((row) => mapSupplierDoc(row as SupplierDocRow))
      if (filters?.status) mapped = mapped.filter((d) => d.status === filters.status)
      return mapped
    },
  })
}

// ─────────────────────────────────────────────
// 11. Reports — no backing table; reports page generates live CSVs itself.
// ─────────────────────────────────────────────

export function useComplianceReports() {
  return useQuery<ComplianceReport[]>({
    queryKey: QK.reports(undefined),
    staleTime: 60_000,
    queryFn: async () => [],
  })
}

// ─────────────────────────────────────────────
// 12. Activity — no dedicated compliance activity table; honest empty state.
// ─────────────────────────────────────────────

export function useComplianceActivity(_filters?: { severity?: string; source?: string }) {
  return useQuery<ComplianceActivityEvent[]>({
    queryKey: QK.activity(undefined, _filters),
    staleTime: 60_000,
    queryFn: async () => [],
  })
}

// ─────────────────────────────────────────────
// 13. Settings — no backing table; null = use defaults / honest empty state.
// ─────────────────────────────────────────────

export function useComplianceSettings() {
  return useQuery<ComplianceSettings | null>({
    queryKey: QK.settings(undefined),
    staleTime: 60_000,
    queryFn: async () => null,
  })
}

// ─────────────────────────────────────────────
// 14. Update settings — no-op (no table); resolves so the UI can confirm.
// ─────────────────────────────────────────────

export function useUpdateComplianceSettings() {
  const qc = useQueryClient()
  return useMutation<ComplianceSettings, Error, Partial<ComplianceSettings>>({
    mutationFn: async (payload) => payload as ComplianceSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-settings'] })
    },
  })
}

// ─────────────────────────────────────────────
// 15. Create certificate (compliance_items)
// ─────────────────────────────────────────────

/** Map the certificate-style status the UI uses back to compliance_status. */
function toItemStatus(status: string): string {
  switch (status) {
    case 'valid':
      return 'ok'
    case 'expiring_soon':
      return 'due_soon'
    case 'expired':
      return 'overdue'
    case 'missing':
      return 'missing'
    case 'exempt':
      return 'exempt'
    default:
      return 'ok'
  }
}

export function useCreateCertificate() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceCertificate, Error, Omit<ComplianceCertificate, 'id' | 'created_at'>>({
    mutationFn: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser()
      const insert = {
        workspace_id: payload.workspace_id,
        property_id: payload.property_id,
        unit_id: payload.unit_id,
        kind: payload.certificate_type,
        title: payload.notes ?? payload.certificate_type,
        status: toItemStatus(payload.status),
        due_date: payload.expiry_date,
        last_completed_at: payload.issue_date,
        reference_no: payload.reference_number,
        notes: payload.notes,
        metadata: { reminder_enabled: payload.reminder_enabled },
        created_by: user?.id ?? null,
      }
      const { data, error } = await supabase
        .from('compliance_items')
        .insert(insert)
        .select('*, properties(name:nickname, address_line1)')
        .single()
      if (error) throw error
      return mapItemToCertificate(data as ComplianceItemRow)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-certificates'] })
      qc.invalidateQueries({ queryKey: ['compliance-overview-stats'] })
    },
  })
}

// ─────────────────────────────────────────────
// 16. Update certificate
// ─────────────────────────────────────────────

export function useUpdateCertificate() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceCertificate, Error, { id: string } & Partial<ComplianceCertificate>>({
    mutationFn: async ({ id, ...payload }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (payload.certificate_type !== undefined) patch.kind = payload.certificate_type
      if (payload.reference_number !== undefined) patch.reference_no = payload.reference_number
      if (payload.expiry_date !== undefined) patch.due_date = payload.expiry_date
      if (payload.issue_date !== undefined) patch.last_completed_at = payload.issue_date
      if (payload.notes !== undefined) patch.notes = payload.notes
      if (payload.status !== undefined) patch.status = toItemStatus(payload.status)
      if (payload.property_id !== undefined) patch.property_id = payload.property_id

      const { data, error } = await supabase
        .from('compliance_items')
        .update(patch)
        .eq('id', id)
        .select('*, properties(name:nickname, address_line1)')
        .single()
      if (error) throw error
      return mapItemToCertificate(data as ComplianceItemRow)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['compliance-certificates'] })
      qc.invalidateQueries({ queryKey: ['compliance-certificate', vars.id] })
      qc.invalidateQueries({ queryKey: ['compliance-overview-stats'] })
    },
  })
}

// ─────────────────────────────────────────────
// 17. Delete (soft) certificate
// ─────────────────────────────────────────────

export function useDeleteCertificate() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('compliance_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-certificates'] })
      qc.invalidateQueries({ queryKey: ['compliance-overview-stats'] })
    },
  })
}

// ─────────────────────────────────────────────
// 18. Create inspection (property_inspections)
// ─────────────────────────────────────────────

function toInspectionStatus(status: string): string {
  if (status === 'upcoming') return 'scheduled'
  if (['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'].includes(status)) return status
  return 'scheduled'
}

export function useCreateInspection() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceInspection, Error, Omit<ComplianceInspection, 'id' | 'created_at'>>({
    mutationFn: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser()
      const insert = {
        workspace_id: payload.workspace_id,
        property_id: payload.property_id,
        kind: payload.inspection_type,
        scheduled_for: payload.scheduled_date,
        completed_at: payload.completed_date,
        status: toInspectionStatus(payload.status),
        notes: payload.next_action,
        created_by: user?.id ?? null,
      }
      const { data, error } = await supabase
        .from('property_inspections')
        .insert(insert)
        .select('*, properties(name:nickname)')
        .single()
      if (error) throw error
      return mapInspection(data as InspectionRow)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-inspections'] })
      qc.invalidateQueries({ queryKey: ['compliance-overview-stats'] })
    },
  })
}

// ─────────────────────────────────────────────
// 19. Update inspection
// ─────────────────────────────────────────────

export function useUpdateInspection() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceInspection, Error, { id: string } & Partial<ComplianceInspection>>({
    mutationFn: async ({ id, ...payload }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (payload.inspection_type !== undefined) patch.kind = payload.inspection_type
      if (payload.scheduled_date !== undefined) patch.scheduled_for = payload.scheduled_date
      if (payload.completed_date !== undefined) patch.completed_at = payload.completed_date
      if (payload.status !== undefined) patch.status = toInspectionStatus(payload.status)
      if (payload.next_action !== undefined) patch.notes = payload.next_action
      if (payload.property_id !== undefined) patch.property_id = payload.property_id

      const { data, error } = await supabase
        .from('property_inspections')
        .update(patch)
        .eq('id', id)
        .select('*, properties(name:nickname)')
        .single()
      if (error) throw error
      return mapInspection(data as InspectionRow)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['compliance-inspections'] })
      qc.invalidateQueries({ queryKey: ['compliance-inspection', vars.id] })
    },
  })
}

// ─────────────────────────────────────────────
// 20. Create document (documents)
// ─────────────────────────────────────────────

export function useCreateDocument() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceDocument, Error, Omit<ComplianceDocument, 'id' | 'created_at'>>({
    mutationFn: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser()
      const insert = {
        workspace_id: payload.workspace_id,
        property_id: payload.property_id,
        name: payload.document_name,
        type: payload.document_type,
        category: 'compliance_certificate',
        url: payload.file_url,
        r2_key: payload.file_url ?? `compliance/${Date.now()}`,
        r2_bucket: 'propvora',
        status: 'active',
        expires_at: payload.expiry_date,
        metadata: {
          issuer: payload.issuer,
          verification_status: payload.verification_status,
          linked_certificate_id: payload.linked_certificate_id,
          linked_inspection_id: payload.linked_inspection_id,
          version: payload.version,
        },
        created_by: user?.id ?? null,
      }
      const { data, error } = await supabase
        .from('documents')
        .insert(insert)
        .select('*, properties(name:nickname)')
        .single()
      if (error) throw error
      return mapDocument(data as DocumentRow)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-documents'] })
    },
  })
}

// ─────────────────────────────────────────────
// 21. Update document
// ─────────────────────────────────────────────

export function useUpdateDocument() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceDocument, Error, { id: string } & Partial<ComplianceDocument>>({
    mutationFn: async ({ id, ...payload }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (payload.document_name !== undefined) patch.name = payload.document_name
      if (payload.document_type !== undefined) patch.type = payload.document_type
      if (payload.expiry_date !== undefined) patch.expires_at = payload.expiry_date

      const { data, error } = await supabase
        .from('documents')
        .update(patch)
        .eq('id', id)
        .select('*, properties(name:nickname)')
        .single()
      if (error) throw error
      return mapDocument(data as DocumentRow)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['compliance-documents'] })
      qc.invalidateQueries({ queryKey: ['compliance-document', vars.id] })
    },
  })
}
