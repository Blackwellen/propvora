/**
 * Portal profile + purpose template defaults.
 *
 * These seed the Profiles / Purposes admin screens and the Grant wizard.
 * If the optional `portal_profiles` / `portal_purposes` config tables are
 * absent (42P01) the UI falls back to these built-in defaults so the
 * workspace always has a usable set of templates.
 */

export type PortalAccessType =
  | "landlord"
  | "supplier"
  | "tenant"
  | "applicant"
  | "accountant"
  | "solicitor"
  | "generic"

export interface PortalProfileTemplate {
  key: PortalAccessType
  label: string
  description: string
  /** maps to contact_portal_access.access_type */
  accessType: string
  /**
   * Release tier. "v1" profiles ship by default (landlord / supplier / tenant).
   * "extended" profiles (applicant / accountant / solicitor / generic) ALSO
   * have a real, dedicated recipient portal experience now, but remain gated
   * behind the extended-profiles feature flag so a workspace opts into them
   * explicitly. Each extended profile routes to its own vertical (applicant /
   * accountant / solicitor / generic) — no longer the supplier fallback.
   * See isExtendedPortalProfilesEnabled.
   */
  tier: "v1" | "extended"
}

/** The three portal profiles that ship in V1 — each has a real experience. */
export const V1_PORTAL_PROFILE_KEYS: PortalAccessType[] = ["landlord", "supplier", "tenant"]

/** True when `key` is an extended profile that must be gated behind the flag. */
export function isExtendedPortalProfile(key: string | null | undefined): boolean {
  if (!key) return false
  return !V1_PORTAL_PROFILE_KEYS.includes(key as PortalAccessType)
}

export interface PortalPurposeTemplate {
  key: string
  label: string
  description: string
  defaultExpiryDays: number
}

export const DEFAULT_PORTAL_PROFILES: PortalProfileTemplate[] = [
  {
    key: "landlord",
    label: "Landlord / Owner",
    description: "Owner-facing access to statements, documents and property updates.",
    accessType: "landlord",
    tier: "v1",
  },
  {
    key: "supplier",
    label: "Supplier / Contractor",
    description: "Contractor job view with invoice and document upload — no portfolio data.",
    accessType: "supplier",
    tier: "v1",
  },
  {
    key: "tenant",
    label: "Tenant / Occupier",
    description: "Occupier access to tenancy documents, requests and statements.",
    accessType: "tenant",
    tier: "v1",
  },
  {
    key: "applicant",
    label: "Applicant",
    description: "Prospective applicant access to application status, viewings and forms.",
    accessType: "applicant",
    tier: "extended",
  },
  {
    key: "accountant",
    label: "Accountant",
    description: "Read access to statements, transactions, invoices and financial documents.",
    accessType: "accountant",
    tier: "extended",
  },
  {
    key: "solicitor",
    label: "Solicitor",
    description: "Legal document exchange for conveyancing and possession matters.",
    accessType: "solicitor",
    tier: "extended",
  },
  {
    key: "generic",
    label: "Generic",
    description: "General-purpose document exchange for any external contact.",
    accessType: "generic",
    tier: "extended",
  },
]

export const DEFAULT_PORTAL_PURPOSES: PortalPurposeTemplate[] = [
  { key: "document_exchange", label: "Document exchange", description: "Share and collect documents securely.", defaultExpiryDays: 30 },
  { key: "invoice_upload", label: "Invoice upload", description: "Contractor uploads invoices against jobs.", defaultExpiryDays: 30 },
  { key: "quote_submission", label: "Quote submission", description: "Supplier submits quotes for works.", defaultExpiryDays: 14 },
  { key: "application", label: "Application", description: "Applicant completes an application form.", defaultExpiryDays: 14 },
  { key: "viewing", label: "Viewing", description: "Confirm or schedule a viewing.", defaultExpiryDays: 7 },
  { key: "lease_docs", label: "Lease docs", description: "Exchange tenancy / lease documents.", defaultExpiryDays: 60 },
  { key: "supplier_docs", label: "Supplier docs", description: "Collect supplier compliance documents.", defaultExpiryDays: 90 },
  { key: "legal_docs", label: "Legal docs", description: "Solicitor / legal document exchange.", defaultExpiryDays: 60 },
  { key: "custom", label: "Custom", description: "A custom purpose defined per grant.", defaultExpiryDays: 30 },
]

// ─── Status presentation (shared across screens) ───────────────────────

export type PortalGrantStatus =
  | "not_created"
  | "created"
  | "email_sent"
  | "opened"
  | "active"
  | "expired"
  | "revoked"
  | "completed"

export const GRANT_STATUS_META: Record<
  PortalGrantStatus,
  { label: string; cls: string }
> = {
  not_created: { label: "Not created", cls: "bg-slate-100 text-slate-500" },
  created: { label: "Created", cls: "bg-blue-100 text-blue-700" },
  email_sent: { label: "Email sent", cls: "bg-indigo-100 text-indigo-700" },
  opened: { label: "Opened", cls: "bg-cyan-100 text-cyan-700" },
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700" },
  expired: { label: "Expired", cls: "bg-amber-100 text-amber-700" },
  revoked: { label: "Revoked", cls: "bg-red-100 text-red-700" },
  completed: { label: "Completed", cls: "bg-slate-100 text-slate-600" },
}

export type TokenStatus = "active" | "expired" | "revoked" | "none"

export const TOKEN_STATUS_META: Record<
  TokenStatus,
  { label: string; cls: string }
> = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700" },
  expired: { label: "Expired", cls: "bg-amber-100 text-amber-700" },
  revoked: { label: "Revoked", cls: "bg-red-100 text-red-700" },
  none: { label: "No token", cls: "bg-slate-100 text-slate-500" },
}

export function profileLabel(key: string | null | undefined): string {
  if (!key) return "Generic"
  return DEFAULT_PORTAL_PROFILES.find((p) => p.key === key)?.label ?? key
}

export function purposeLabel(key: string | null | undefined): string {
  if (!key) return "—"
  return DEFAULT_PORTAL_PURPOSES.find((p) => p.key === key)?.label ?? key
}
