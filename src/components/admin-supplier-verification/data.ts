import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { fileViewUrl } from "@/lib/r2"
import {
  LEVEL_LABELS,
  isSchemaGap,
  type SupplierVerificationLevel,
} from "@/lib/supplier-verification"

/**
 * Read layer for the platform-admin SUPPLIER verification review queue + detail.
 *
 * Cross-tenant BY DESIGN: a platform admin reviews supplier verifications across
 * ALL supplier workspaces. These reads use the service-role client and must only
 * run behind the (admin) layout guard + an explicit getAdminIdentity() check on
 * every page/route (fail-closed).
 *
 * Surfaces only the non-sensitive fields a reviewer needs. Document/policy/licence
 * NUMBERS are already MASKED at rest. Files live in R2 — served via the app's
 * authed file URL (fileViewUrl), never a public/storage URL. Schema-gap-safe.
 */

export function shortId(id: string | null | undefined): string {
  if (!id) return "—"
  return id.slice(0, 8)
}

/** Statuses that constitute the active review queue (awaiting an admin). */
export const QUEUE_STATUSES = ["pending_review"] as const

export interface SupplierQueueRow {
  id: string
  supplierWorkspaceId: string
  supplierName: string | null
  level: number
  levelLabel: string
  status: string
  documentCheckStatus: string
  selfieCheckStatus: string
  manualReviewStatus: string
  documentCount: number
  insuranceCount: number
  licenceCount: number
  openRiskFlags: number
  submittedAt: string | null
  updatedAt: string | null
}

export interface QueueResult {
  available: boolean
  rows: SupplierQueueRow[]
}

async function supplierNamesFor(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return out
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("supplier_workspace_profiles")
      .select("workspace_id, display_name")
      .in("workspace_id", unique)
    for (const p of data ?? []) {
      if (p.display_name) out[p.workspace_id as string] = p.display_name as string
    }
  } catch {
    /* ignore */
  }
  return out
}

async function countsByVerification(
  table: string,
  verificationIds: string[]
): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  if (verificationIds.length === 0) return out
  try {
    const admin = createAdminClient()
    const { data } = await admin.from(table).select("verification_id").in("verification_id", verificationIds)
    for (const r of data ?? []) {
      const k = r.verification_id as string
      out[k] = (out[k] ?? 0) + 1
    }
  } catch {
    /* ignore */
  }
  return out
}

async function openRiskFlagCounts(verificationIds: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  if (verificationIds.length === 0) return out
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("supplier_verification_risk_flags")
      .select("verification_id, resolved")
      .in("verification_id", verificationIds)
    for (const r of data ?? []) {
      if (r.resolved) continue
      const k = r.verification_id as string
      out[k] = (out[k] ?? 0) + 1
    }
  } catch {
    /* ignore */
  }
  return out
}

/** List supplier verifications awaiting admin review (oldest first). */
export async function listSupplierQueue(limit = 200): Promise<QueueResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }

  const { data, error } = await admin
    .from("supplier_identity_verifications")
    .select(
      "id, supplier_workspace_id, verification_level, status, document_check_status, selfie_check_status, manual_review_status, created_at, updated_at"
    )
    .in("status", QUEUE_STATUSES as unknown as string[])
    .order("created_at", { ascending: true })
    .limit(limit)

  if (error) {
    if (isSchemaGap(error.code)) return { available: false, rows: [] }
    return { available: true, rows: [] }
  }

  const rows = data ?? []
  const ids = rows.map((r) => r.id as string)
  const wsIds = rows.map((r) => r.supplier_workspace_id as string)

  const [names, docCounts, insCounts, licCounts, flagCounts] = await Promise.all([
    supplierNamesFor(wsIds),
    countsByVerification("supplier_identity_documents", ids),
    countsByVerification("supplier_insurance_policies", ids),
    countsByVerification("supplier_licence_verifications", ids),
    openRiskFlagCounts(ids),
  ])

  return {
    available: true,
    rows: rows.map((r) => {
      const id = r.id as string
      const wsId = r.supplier_workspace_id as string
      const level = (Number(r.verification_level) || 0) as SupplierVerificationLevel
      return {
        id,
        supplierWorkspaceId: wsId,
        supplierName: names[wsId] ?? null,
        level,
        levelLabel: LEVEL_LABELS[level],
        status: (r.status as string) ?? "pending_review",
        documentCheckStatus: (r.document_check_status as string) ?? "not_started",
        selfieCheckStatus: (r.selfie_check_status as string) ?? "not_started",
        manualReviewStatus: (r.manual_review_status as string) ?? "pending",
        documentCount: docCounts[id] ?? 0,
        insuranceCount: insCounts[id] ?? 0,
        licenceCount: licCounts[id] ?? 0,
        openRiskFlags: flagCounts[id] ?? 0,
        submittedAt: (r.created_at as string) ?? null,
        updatedAt: (r.updated_at as string) ?? (r.created_at as string) ?? null,
      }
    }),
  }
}

// ── Detail ───────────────────────────────────────────────────────────────────

export interface AdminDocumentRow {
  id: string
  docType: string
  documentCountry: string | null
  documentNumberMasked: string | null
  expiryDate: string | null
  nameOnDocument: string | null
  ocrStatus: string
  status: string
  frontUrl: string | null
  backUrl: string | null
  selfieUrl: string | null
  createdAt: string | null
}

export interface AdminInsuranceRow {
  id: string
  insuranceType: string
  provider: string | null
  policyNumberMasked: string | null
  coverageAmountPence: number | null
  validFrom: string | null
  validTo: string | null
  minimumCoverMet: boolean
  status: string
  fileUrl: string | null
  expired: boolean
}

export interface AdminLicenceRow {
  id: string
  licenceType: string
  issuingBody: string | null
  licenceNumberMasked: string | null
  country: string | null
  region: string | null
  validFrom: string | null
  validTo: string | null
  requiredForCategories: string[]
  status: string
  fileUrl: string | null
  expired: boolean
}

export interface AdminEventRow {
  id: string
  eventType: string
  fromStatus: string | null
  toStatus: string | null
  actorRole: string | null
  detail: string | null
  createdAt: string | null
}

export interface AdminRiskFlagRow {
  id: string
  flagType: string
  severity: string
  resolved: boolean
  detail: string | null
  createdAt: string | null
}

export interface SupplierVerificationDetail {
  id: string
  supplierWorkspaceId: string
  supplierName: string | null
  level: number
  levelLabel: string
  status: string
  provider: string
  stripeAccountId: string | null
  documentCheckStatus: string
  selfieCheckStatus: string
  manualReviewStatus: string
  submittedAt: string | null
  verifiedAt: string | null
  expiresAt: string | null
  updatedAt: string | null
  documents: AdminDocumentRow[]
  insurance: AdminInsuranceRow[]
  licences: AdminLicenceRow[]
  events: AdminEventRow[]
  riskFlags: AdminRiskFlagRow[]
}

export interface DetailResult {
  available: boolean
  detail: SupplierVerificationDetail | null
}

function isPast(date: string | null): boolean {
  if (!date) return false
  return new Date(date).getTime() < Date.now()
}

export async function getSupplierVerificationDetail(id: string): Promise<DetailResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, detail: null }
  }

  const { data: v, error } = await admin
    .from("supplier_identity_verifications")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    if (isSchemaGap(error.code)) return { available: false, detail: null }
    return { available: true, detail: null }
  }
  if (!v) return { available: true, detail: null }

  const wsId = v.supplier_workspace_id as string
  const level = (Number(v.verification_level) || 0) as SupplierVerificationLevel

  const [docs, ins, lics, events, flags, names] = await Promise.all([
    admin.from("supplier_identity_documents").select("*").eq("verification_id", id).order("created_at", { ascending: true }),
    admin.from("supplier_insurance_policies").select("*").eq("verification_id", id).order("created_at", { ascending: false }),
    admin.from("supplier_licence_verifications").select("*").eq("verification_id", id).order("created_at", { ascending: false }),
    admin.from("supplier_verification_events").select("*").eq("verification_id", id).order("created_at", { ascending: false }).limit(50),
    admin.from("supplier_verification_risk_flags").select("*").eq("verification_id", id).order("created_at", { ascending: false }),
    supplierNamesFor([wsId]),
  ])

  const sign = (k: string | null) => (k ? safeFileUrl(k) : null)

  return {
    available: true,
    detail: {
      id: v.id as string,
      supplierWorkspaceId: wsId,
      supplierName: names[wsId] ?? null,
      level,
      levelLabel: LEVEL_LABELS[level],
      status: (v.status as string) ?? "pending_review",
      provider: (v.provider as string) ?? "manual",
      stripeAccountId: (v.stripe_account_id as string) ?? null,
      documentCheckStatus: (v.document_check_status as string) ?? "not_started",
      selfieCheckStatus: (v.selfie_check_status as string) ?? "not_started",
      manualReviewStatus: (v.manual_review_status as string) ?? "pending",
      submittedAt: (v.created_at as string) ?? null,
      verifiedAt: (v.verified_at as string) ?? null,
      expiresAt: (v.expires_at as string) ?? null,
      updatedAt: (v.updated_at as string) ?? null,
      documents: (docs.data ?? []).map((d) => ({
        id: d.id as string,
        docType: (d.doc_type as string) ?? "other",
        documentCountry: (d.document_country as string) ?? null,
        documentNumberMasked: (d.document_number_masked as string) ?? null,
        expiryDate: (d.expiry_date as string) ?? null,
        nameOnDocument: (d.name_on_document as string) ?? null,
        ocrStatus: (d.ocr_status as string) ?? "not_run",
        status: (d.status as string) ?? "uploaded",
        frontUrl: sign(d.r2_key_front as string | null),
        backUrl: sign(d.r2_key_back as string | null),
        selfieUrl: sign(d.r2_key_selfie as string | null),
        createdAt: (d.created_at as string) ?? null,
      })),
      insurance: (ins.data ?? []).map((p) => ({
        id: p.id as string,
        insuranceType: (p.insurance_type as string) ?? "other",
        provider: (p.provider as string) ?? null,
        policyNumberMasked: (p.policy_number_masked as string) ?? null,
        coverageAmountPence: (p.coverage_amount_pence as number) ?? null,
        validFrom: (p.valid_from as string) ?? null,
        validTo: (p.valid_to as string) ?? null,
        minimumCoverMet: Boolean(p.minimum_cover_met),
        status: (p.status as string) ?? "uploaded",
        fileUrl: sign(p.r2_key as string | null),
        expired: (p.status as string) === "expired" || isPast(p.valid_to as string | null),
      })),
      licences: (lics.data ?? []).map((l) => ({
        id: l.id as string,
        licenceType: (l.licence_type as string) ?? "other",
        issuingBody: (l.issuing_body as string) ?? null,
        licenceNumberMasked: (l.licence_number_masked as string) ?? null,
        country: (l.country as string) ?? null,
        region: (l.region as string) ?? null,
        validFrom: (l.valid_from as string) ?? null,
        validTo: (l.valid_to as string) ?? null,
        requiredForCategories: (l.required_for_categories as string[]) ?? [],
        status: (l.status as string) ?? "uploaded",
        fileUrl: sign(l.r2_key as string | null),
        expired: (l.status as string) === "expired" || isPast(l.valid_to as string | null),
      })),
      events: (events.data ?? []).map((e) => ({
        id: e.id as string,
        eventType: (e.event_type as string) ?? "",
        fromStatus: (e.from_status as string) ?? null,
        toStatus: (e.to_status as string) ?? null,
        actorRole: (e.actor_role as string) ?? null,
        detail:
          e.detail == null ? null : typeof e.detail === "string" ? e.detail : JSON.stringify(e.detail),
        createdAt: (e.created_at as string) ?? null,
      })),
      riskFlags: (flags.data ?? []).map((f) => ({
        id: f.id as string,
        flagType: (f.flag_type as string) ?? "",
        severity: (f.severity as string) ?? "medium",
        resolved: Boolean(f.resolved),
        detail:
          f.detail == null ? null : typeof f.detail === "string" ? f.detail : JSON.stringify(f.detail),
        createdAt: (f.created_at as string) ?? null,
      })),
    },
  }
}

function safeFileUrl(key: string): string | null {
  try {
    return fileViewUrl(key)
  } catch {
    return null
  }
}
