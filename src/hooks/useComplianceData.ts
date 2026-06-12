"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────────
// Types
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
// 1. Overview Stats
// ─────────────────────────────────────────────

export function useComplianceOverviewStats() {
  const supabase = createClient()

  return useQuery<ComplianceOverviewStats>({
    queryKey: ['compliance-overview-stats'],
    staleTime: 30_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) throw new Error('No workspace')

      const [certsRes, inspRes, propsRes] = await Promise.all([
        supabase
          .from('compliance_certificates')
          .select('status, risk_level')
          .eq('workspace_id', wsId),
        supabase
          .from('compliance_inspections')
          .select('status')
          .eq('workspace_id', wsId),
        supabase
          .from('compliance_coverage_matrix')
          .select('property_id, status')
          .eq('workspace_id', wsId),
      ])

      const certs = certsRes.data ?? []
      const inspections = inspRes.data ?? []
      const coverage = propsRes.data ?? []

      const expiring_soon = certs.filter((c) => c.status === 'expiring_soon').length
      const overdue_inspections = inspections.filter((i) => i.status === 'overdue').length
      const propertyIds = [...new Set(coverage.map((c) => c.property_id))]
      const total_properties = propertyIds.length
      const atRiskIds = new Set(
        coverage.filter((c) => c.status === 'overdue' || c.status === 'missing').map((c) => c.property_id)
      )
      const at_risk_properties = atRiskIds.size
      const compliant_properties = total_properties - at_risk_properties
      const criticalOrHigh = certs.filter((c) => c.risk_level === 'critical' || c.risk_level === 'high').length
      const total = certs.length || 1
      const health_score = Math.max(0, Math.round(100 - (criticalOrHigh / total) * 100))

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
// 2. Certificates list
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
        .from('compliance_certificates')
        .select('*, properties(name:nickname, address_line1)')
        .eq('workspace_id', wsId)
        .is('archived_at', null)
        .order('expiry_date', { ascending: true })

      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.risk_level) q = q.eq('risk_level', filters.risk_level)
      if (filters?.certificate_type) q = q.eq('certificate_type', filters.certificate_type)
      if (filters?.search) q = q.ilike('certificate_type', `%${filters.search}%`)

      const { data, error } = await q
      if (error) throw error

      return (data ?? []).map((row) => {
        const { properties: prop, ...rest } = row as typeof row & {
          properties: { name: string; address_line1: string } | null
        }
        return {
          ...rest,
          property_name: prop?.name ?? undefined,
          property_address: prop?.address_line1 ?? undefined,
        }
      })
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
        .from('compliance_certificates')
        .select('*, properties(name:nickname, address_line1)')
        .eq('id', id)
        .single()
      if (error) throw error
      if (!data) return null
      const { properties: prop, ...rest } = data as typeof data & {
        properties: { name: string; address_line1: string } | null
      }
      return {
        ...rest,
        property_name: prop?.name ?? undefined,
        property_address: prop?.address_line1 ?? undefined,
      }
    },
  })
}

// ─────────────────────────────────────────────
// 4. Inspections list
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
        .from('compliance_inspections')
        .select('*, properties(name:nickname)')
        .eq('workspace_id', wsId)
        .is('archived_at', null)
        .order('scheduled_date', { ascending: true })

      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.inspection_type) q = q.eq('inspection_type', filters.inspection_type)
      if (filters?.search) q = q.ilike('inspector_name', `%${filters.search}%`)

      const { data, error } = await q
      if (error) throw error

      return (data ?? []).map((row) => {
        const { properties: prop, ...rest } = row as typeof row & {
          properties: { name: string } | null
        }
        return {
          ...rest,
          property_name: prop?.name ?? undefined,
        }
      })
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
        .from('compliance_inspections')
        .select('*, properties(name:nickname)')
        .eq('id', id)
        .single()
      if (error) throw error
      if (!data) return null
      const { properties: prop, ...rest } = data as typeof data & {
        properties: { name: string } | null
      }
      return { ...rest, property_name: prop?.name ?? undefined }
    },
  })
}

// ─────────────────────────────────────────────
// 6. Documents list
// ─────────────────────────────────────────────

interface DocumentFilters {
  document_type?: string
  verification_status?: string
  search?: string
}

export function useComplianceDocuments(filters?: DocumentFilters) {
  const supabase = createClient()

  return useQuery<ComplianceDocument[]>({
    queryKey: QK.documents(undefined, filters),
    staleTime: 30_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) return []

      let q = supabase
        .from('compliance_documents')
        .select('*, properties(name:nickname)')
        .eq('workspace_id', wsId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (filters?.document_type) q = q.eq('document_type', filters.document_type)
      if (filters?.verification_status) q = q.eq('verification_status', filters.verification_status)
      if (filters?.search) q = q.ilike('document_name', `%${filters.search}%`)

      const { data, error } = await q
      if (error) throw error

      return (data ?? []).map((row) => {
        const { properties: prop, ...rest } = row as typeof row & {
          properties: { name: string } | null
        }
        return { ...rest, property_name: prop?.name ?? undefined }
      })
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
        .from('compliance_documents')
        .select('*, properties(name:nickname)')
        .eq('id', id)
        .single()
      if (error) throw error
      if (!data) return null
      const { properties: prop, ...rest } = data as typeof data & {
        properties: { name: string } | null
      }
      return { ...rest, property_name: prop?.name ?? undefined }
    },
  })
}

// ─────────────────────────────────────────────
// 8. Evidence list
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

      let q = supabase
        .from('compliance_evidence')
        .select('*')
        .eq('workspace_id', wsId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (filters?.evidence_type) q = q.eq('evidence_type', filters.evidence_type)
      if (filters?.verification_status) q = q.eq('verification_status', filters.verification_status)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

// ─────────────────────────────────────────────
// 9. Coverage matrix
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
        .from('compliance_coverage_matrix')
        .select('*, properties(name:nickname, address_line1)')
        .eq('workspace_id', wsId)
        .order('property_id')

      if (error) throw error

      return (data ?? []).map((row) => {
        const { properties: prop, ...rest } = row as typeof row & {
          properties: { name: string; address_line1: string } | null
        }
        return {
          ...rest,
          property_name: prop?.name ?? undefined,
          property_address: prop?.address_line1 ?? undefined,
        }
      })
    },
  })
}

// ─────────────────────────────────────────────
// 10. Supplier documents
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

      let q = supabase
        .from('compliance_supplier_documents')
        .select('*, contacts(full_name, service_type)')
        .eq('workspace_id', wsId)
        .order('expiry_date', { ascending: true })

      if (filters?.status) q = q.eq('status', filters.status)

      const { data, error } = await q
      if (error) throw error

      return (data ?? []).map((row) => {
        const { contacts: contact, ...rest } = row as typeof row & {
          contacts: { full_name: string; service_type: string } | null
        }
        return {
          ...rest,
          supplier_name: contact?.full_name ?? undefined,
          supplier_service_type: contact?.service_type ?? undefined,
        }
      })
    },
  })
}

// ─────────────────────────────────────────────
// 11. Reports
// ─────────────────────────────────────────────

export function useComplianceReports() {
  const supabase = createClient()

  return useQuery<ComplianceReport[]>({
    queryKey: QK.reports(undefined),
    staleTime: 30_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) return []

      const { data, error } = await supabase
        .from('compliance_reports')
        .select('*')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

// ─────────────────────────────────────────────
// 12. Activity
// ─────────────────────────────────────────────

interface ActivityFilters {
  severity?: string
  source?: string
}

export function useComplianceActivity(filters?: ActivityFilters) {
  const supabase = createClient()

  return useQuery<ComplianceActivityEvent[]>({
    queryKey: QK.activity(undefined, filters),
    staleTime: 30_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) return []

      let q = supabase
        .from('compliance_activity')
        .select('*')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filters?.severity) q = q.eq('severity', filters.severity)
      if (filters?.source) q = q.eq('source', filters.source)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

// ─────────────────────────────────────────────
// 13. Settings
// ─────────────────────────────────────────────

export function useComplianceSettings() {
  const supabase = createClient()

  return useQuery<ComplianceSettings | null>({
    queryKey: QK.settings(undefined),
    staleTime: 60_000,
    queryFn: async () => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) return null

      const { data, error } = await supabase
        .from('compliance_settings')
        .select('*')
        .eq('workspace_id', wsId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data ?? null
    },
  })
}

// ─────────────────────────────────────────────
// 14. Update settings
// ─────────────────────────────────────────────

export function useUpdateComplianceSettings() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceSettings, Error, Partial<ComplianceSettings>>({
    mutationFn: async (payload) => {
      const wsId = await resolveWorkspaceId(supabase)
      if (!wsId) throw new Error('No workspace')

      const { data, error } = await supabase
        .from('compliance_settings')
        .upsert({ ...payload, workspace_id: wsId, updated_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-settings'] })
    },
  })
}

// ─────────────────────────────────────────────
// 15. Create certificate
// ─────────────────────────────────────────────

export function useCreateCertificate() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceCertificate, Error, Omit<ComplianceCertificate, 'id' | 'created_at'>>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('compliance_certificates')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
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
      const { data, error } = await supabase
        .from('compliance_certificates')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['compliance-certificates'] })
      qc.invalidateQueries({ queryKey: ['compliance-certificate', vars.id] })
      qc.invalidateQueries({ queryKey: ['compliance-overview-stats'] })
    },
  })
}

// ─────────────────────────────────────────────
// 17. Delete certificate
// ─────────────────────────────────────────────

export function useDeleteCertificate() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('compliance_certificates')
        .update({ archived_at: new Date().toISOString() })
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
// 18. Create inspection
// ─────────────────────────────────────────────

export function useCreateInspection() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceInspection, Error, Omit<ComplianceInspection, 'id' | 'created_at'>>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('compliance_inspections')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
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
      const { data, error } = await supabase
        .from('compliance_inspections')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['compliance-inspections'] })
      qc.invalidateQueries({ queryKey: ['compliance-inspection', vars.id] })
    },
  })
}

// ─────────────────────────────────────────────
// 20. Create document
// ─────────────────────────────────────────────

export function useCreateDocument() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceDocument, Error, Omit<ComplianceDocument, 'id' | 'created_at'>>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('compliance_documents')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
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
      const { data, error } = await supabase
        .from('compliance_documents')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['compliance-documents'] })
      qc.invalidateQueries({ queryKey: ['compliance-document', vars.id] })
    },
  })
}

// ─────────────────────────────────────────────
// 22. Create evidence
// ─────────────────────────────────────────────

export function useCreateEvidence() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceEvidence, Error, Omit<ComplianceEvidence, 'id' | 'created_at'>>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('compliance_evidence')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-evidence'] })
    },
  })
}

// ─────────────────────────────────────────────
// 23. Update evidence
// ─────────────────────────────────────────────

export function useUpdateEvidence() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<ComplianceEvidence, Error, { id: string } & Partial<ComplianceEvidence>>({
    mutationFn: async ({ id, ...payload }) => {
      const { data, error } = await supabase
        .from('compliance_evidence')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-evidence'] })
    },
  })
}
