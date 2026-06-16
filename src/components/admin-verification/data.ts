import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { fileViewUrl } from "@/lib/r2"

/**
 * Read layer for the platform-admin Identity / KYC verification review queue.
 *
 * Cross-tenant BY DESIGN: a platform admin reviews identity verifications across
 * ALL workspaces. Access is gated by the (admin) layout guard + an explicit
 * guard call on every page/route; these reads use the service-role client and
 * must only ever run behind that gate.
 *
 * Schema (migration 20260616110000_identity_kyc), verified live:
 *   identity_verifications(id, subject_type, subject_id, workspace_id, kind,
 *     provider, provider_ref, status, risk_level, verified_at, created_by,
 *     created_at, updated_at)
 *   verification_documents(id, verification_id, doc_type, r2_key, status, notes,
 *     created_at)  — docs live in R2; serve via the authed file URL, not storage.
 *   verification_checks(id, verification_id, check_type, result, detail, created_at)
 *   sanctions_screenings(id, workspace_id, subject_name, country_code, matched,
 *     match_detail, screened_at, screened_by)  — workspace-keyed history; the
 *     PER-verification sanctions signal comes from verification_checks.
 *
 * Every read is schema-gap-safe. No raw document bytes, secrets, or provider
 * payloads are surfaced — only the small, non-sensitive fields the reviewer
 * needs. Sanctions / PEP rows are SCREENING SIGNALS for a human reviewer, never
 * legal determinations. The system never auto-decides.
 */

const MISSING_RELATION = "42P01"
const UNDEFINED_COLUMN = "42703"
const PGRST_MISSING_RELATION = "PGRST205"
const PGRST_MISSING_COLUMN = "PGRST204"

function isSchemaGap(code?: string) {
  return (
    code === MISSING_RELATION ||
    code === UNDEFINED_COLUMN ||
    code === PGRST_MISSING_RELATION ||
    code === PGRST_MISSING_COLUMN
  )
}

/** Short, non-identifying display form of a UUID (first 8 chars). */
export function shortId(id: string | null | undefined): string {
  if (!id) return "—"
  return id.slice(0, 8)
}

/** Statuses that constitute the active review queue. */
export const QUEUE_STATUSES = ["pending", "processing", "requires_input"] as const

interface WorkspaceInfo {
  name: string
  country: string | null
}

/** Map of workspace_id -> {name, country}. Best-effort, never throws. */
async function workspaceInfoFor(ids: string[]): Promise<Record<string, WorkspaceInfo>> {
  const out: Record<string, WorkspaceInfo> = {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return out
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("workspaces")
      .select("id, name, business_country_code")
      .in("id", unique)
    for (const w of data ?? []) {
      out[w.id as string] = {
        name: (w.name as string) ?? "Workspace",
        country: (w.business_country_code as string) ?? null,
      }
    }
  } catch {
    /* ignore */
  }
  return out
}

/** Map of user_id -> display name (best-effort, for 'user' subjects). */
async function userNamesFor(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return out
  try {
    const admin = createAdminClient()
    // profiles has `display_name` (NOT `full_name`, which does not exist).
    const { data } = await admin.from("profiles").select("id, display_name").in("id", unique)
    for (const p of data ?? []) {
      if (p.display_name) out[p.id as string] = p.display_name as string
    }
  } catch {
    /* ignore */
  }
  return out
}

// ── Queue row ────────────────────────────────────────────────────────────────

export interface VerificationQueueRow {
  id: string
  subjectType: string | null
  subjectId: string | null
  userId: string | null
  workspaceId: string | null
  workspaceName: string | null
  status: string
  riskLevel: string | null
  country: string | null
  fullName: string | null
  documentCount: number
  sanctionsSignal: boolean
  submittedAt: string | null
  updatedAt: string | null
}

export interface QueueResult {
  available: boolean
  rows: VerificationQueueRow[]
}

/**
 * List verifications currently in the review queue
 * (status pending / processing / requires_input) across all workspaces.
 */
export async function listVerificationQueue(limit = 200): Promise<QueueResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }

  const { data, error } = await admin
    .from("identity_verifications")
    .select(
      "id, subject_type, subject_id, workspace_id, kind, status, risk_level, provider, created_at, updated_at"
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

  const userIds = rows
    .filter((r) => r.subject_type === "user")
    .map((r) => r.subject_id as string)

  const [docCounts, sanctionsFlags, wsInfo, userNames] = await Promise.all([
    documentCounts(admin, ids),
    sanctionsSignalFlags(admin, ids),
    workspaceInfoFor(rows.map((r) => r.workspace_id as string)),
    userNamesFor(userIds),
  ])

  return {
    available: true,
    rows: rows.map((r) => {
      const id = r.id as string
      const wsId = (r.workspace_id as string) ?? null
      const subjectId = (r.subject_id as string) ?? null
      const ws = wsId ? wsInfo[wsId] : undefined
      const subjectUserId = r.subject_type === "user" ? subjectId : null
      const fullName =
        (subjectUserId ? userNames[subjectUserId] : undefined) ?? ws?.name ?? null
      return {
        id,
        subjectType: (r.subject_type as string) ?? null,
        subjectId,
        userId: subjectUserId,
        workspaceId: wsId,
        workspaceName: ws?.name ?? null,
        status: (r.status as string) ?? "pending",
        riskLevel: (r.risk_level as string) ?? null,
        country: ws?.country ?? null,
        fullName,
        documentCount: docCounts[id] ?? 0,
        sanctionsSignal: sanctionsFlags.has(id),
        submittedAt: (r.created_at as string) ?? null,
        updatedAt: (r.updated_at as string) ?? (r.created_at as string) ?? null,
      }
    }),
  }
}

/** Count of verification_documents per verification id. Never throws. */
async function documentCounts(
  admin: ReturnType<typeof createAdminClient>,
  ids: string[]
): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  if (ids.length === 0) return out
  try {
    const { data, error } = await admin
      .from("verification_documents")
      .select("verification_id")
      .in("verification_id", ids)
    if (error) return out
    for (const d of data ?? []) {
      const k = d.verification_id as string
      out[k] = (out[k] ?? 0) + 1
    }
  } catch {
    /* ignore */
  }
  return out
}

/**
 * Set of verification ids with a non-clear sanctions/PEP SIGNAL. The per-
 * verification signal is recorded as a `verification_checks` row of check_type
 * 'sanctions' or 'pep' whose result is not a clean pass.
 */
async function sanctionsSignalFlags(
  admin: ReturnType<typeof createAdminClient>,
  ids: string[]
): Promise<Set<string>> {
  const out = new Set<string>()
  if (ids.length === 0) return out
  try {
    const { data, error } = await admin
      .from("verification_checks")
      .select("verification_id, check_type, result")
      .in("verification_id", ids)
      .in("check_type", ["sanctions", "pep"])
    if (error) return out
    for (const c of data ?? []) {
      const result = ((c.result as string) ?? "").toLowerCase()
      // Anything that is not an explicit pass is a SIGNAL for human review.
      if (result && result !== "pass" && result !== "unavailable") {
        out.add(c.verification_id as string)
      }
    }
  } catch {
    /* ignore */
  }
  return out
}

// ── Detail ───────────────────────────────────────────────────────────────────

export interface VerificationDocumentRow {
  id: string
  type: string | null
  fileKey: string | null
  fileName: string | null
  status: string | null
  uploadedAt: string | null
}

export interface VerificationCheckRow {
  id: string
  checkType: string | null
  status: string | null
  result: string | null
  detail: string | null
  createdAt: string | null
}

export interface SanctionsSignalRow {
  id: string
  provider: string | null
  result: string | null
  matchStatus: string | null
  listName: string | null
  pep: boolean | null
  score: number | null
  createdAt: string | null
}

export interface VerificationDetail {
  id: string
  subjectType: string | null
  subjectId: string | null
  userId: string | null
  workspaceId: string | null
  workspaceName: string | null
  status: string
  riskLevel: string | null
  country: string | null
  fullName: string | null
  dateOfBirth: string | null
  reviewNote: string | null
  submittedAt: string | null
  updatedAt: string | null
  documents: VerificationDocumentRow[]
  checks: VerificationCheckRow[]
  sanctions: SanctionsSignalRow[]
}

export interface DetailResult {
  available: boolean
  detail: VerificationDetail | null
}

/** Load a single verification with its documents, checks and screening signals. */
export async function getVerificationDetail(id: string): Promise<DetailResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, detail: null }
  }

  const { data: v, error } = await admin
    .from("identity_verifications")
    .select(
      "id, subject_type, subject_id, workspace_id, kind, status, risk_level, provider, provider_ref, verified_at, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    if (isSchemaGap(error.code)) return { available: false, detail: null }
    return { available: true, detail: null }
  }
  if (!v) return { available: true, detail: null }

  const wsId = (v.workspace_id as string) ?? null
  const subjectId = (v.subject_id as string) ?? null
  const subjectUserId = v.subject_type === "user" ? subjectId : null

  const [documents, checks, sanctions, wsInfo, userNames] = await Promise.all([
    loadDocuments(admin, id),
    loadChecks(admin, id),
    loadSanctions(admin, wsId),
    workspaceInfoFor([wsId as string]),
    userNamesFor([subjectUserId as string]),
  ])

  const ws = wsId ? wsInfo[wsId] : undefined

  return {
    available: true,
    detail: {
      id: v.id as string,
      subjectType: (v.subject_type as string) ?? null,
      subjectId,
      userId: subjectUserId,
      workspaceId: wsId,
      workspaceName: ws?.name ?? null,
      status: (v.status as string) ?? "pending",
      riskLevel: (v.risk_level as string) ?? null,
      country: ws?.country ?? null,
      fullName: (subjectUserId ? userNames[subjectUserId] : undefined) ?? ws?.name ?? null,
      dateOfBirth: null,
      reviewNote: null,
      submittedAt: (v.created_at as string) ?? null,
      updatedAt: (v.updated_at as string) ?? (v.created_at as string) ?? null,
      documents,
      checks,
      sanctions,
    },
  }
}

async function loadDocuments(
  admin: ReturnType<typeof createAdminClient>,
  id: string
): Promise<VerificationDocumentRow[]> {
  try {
    const { data, error } = await admin
      .from("verification_documents")
      .select("id, doc_type, r2_key, status, notes, created_at")
      .eq("verification_id", id)
      .order("created_at", { ascending: true })
    if (error) return []
    return (data ?? []).map((d) => ({
      id: d.id as string,
      type: (d.doc_type as string) ?? null,
      fileKey: (d.r2_key as string) ?? null,
      fileName: (d.notes as string) ?? null,
      status: (d.status as string) ?? null,
      uploadedAt: (d.created_at as string) ?? null,
    }))
  } catch {
    return []
  }
}

async function loadChecks(
  admin: ReturnType<typeof createAdminClient>,
  id: string
): Promise<VerificationCheckRow[]> {
  try {
    const { data, error } = await admin
      .from("verification_checks")
      .select("id, check_type, result, detail, created_at")
      .eq("verification_id", id)
      .order("created_at", { ascending: true })
    if (error) return []
    return (data ?? []).map((c) => ({
      id: c.id as string,
      checkType: (c.check_type as string) ?? null,
      status: null,
      result: (c.result as string) ?? null,
      detail:
        c.detail == null
          ? null
          : typeof c.detail === "string"
            ? c.detail
            : JSON.stringify(c.detail),
      createdAt: (c.created_at as string) ?? null,
    }))
  } catch {
    return []
  }
}

/**
 * Workspace-level sanctions screening history (the table is keyed by
 * workspace_id, not verification_id). Surfaced as context signals.
 */
async function loadSanctions(
  admin: ReturnType<typeof createAdminClient>,
  workspaceId: string | null
): Promise<SanctionsSignalRow[]> {
  if (!workspaceId) return []
  try {
    const { data, error } = await admin
      .from("sanctions_screenings")
      .select("id, subject_name, country_code, matched, match_detail, screened_at")
      .eq("workspace_id", workspaceId)
      .order("screened_at", { ascending: false })
    if (error) return []
    return (data ?? []).map((s) => {
      const detail = (s.match_detail as Record<string, unknown> | null) ?? null
      return {
        id: s.id as string,
        provider: "country_packs",
        result: s.matched ? "possible_match" : "clear",
        matchStatus: s.matched ? "match" : "no_match",
        listName: (detail?.list as string) ?? (s.country_code as string) ?? null,
        pep: null,
        score: null,
        createdAt: (s.screened_at as string) ?? null,
      }
    })
  } catch {
    return []
  }
}

/**
 * Resolve a viewable URL for a stored verification document. Documents are
 * stored in R2 (key in `verification_documents.r2_key`) and served through the
 * app's authed file-streaming URL — never a public/storage URL. Returns null if
 * no key.
 */
export async function signDocumentUrl(fileKey: string): Promise<string | null> {
  if (!fileKey) return null
  try {
    return fileViewUrl(fileKey)
  } catch {
    return null
  }
}
