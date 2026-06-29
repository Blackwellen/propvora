/**
 * Notice service methods (dimension 25 — how a possession / rent-chase notice
 * may lawfully be served, per jurisdiction).
 *
 * England & Wales: by hand, first-class post (with a deemed-service allowance
 * under the tenancy's service clause / CPR), recorded or special delivery, or a
 * process server; email only where the tenancy expressly permits it. Scotland:
 * recorded delivery or sheriff officer. Ireland (RTB): by hand or registered
 * post. Other jurisdictions fall back to a generic, non-advice set.
 *
 * SOURCED / indicative — NOT legal advice. Drives the possession Record-Service
 * step and the rent-chase notice service log so the methods offered, and the
 * deemed-service hint, match the PROPERTY's jurisdiction rather than a fixed
 * England-centric list.
 */

/** lucide icon key the UI maps to a component (keeps this file React-free). */
export type ServiceMethodIcon = "user" | "mail" | "send" | "briefcase" | "shield"

export interface ServiceMethod {
  id: string
  label: string
  /** Plain-English description of the method. */
  description: string
  icon: ServiceMethodIcon
  /**
   * Indicative deemed-service / delivery allowance in days to add to the served
   * date before a notice is treated as received (review-only — the actual rule
   * depends on the tenancy clause and local civil-procedure rules). null = none.
   */
  deemedServiceDays?: number | null
  /** True where the method is only valid if the tenancy/contract permits it. */
  requiresAgreementClause?: boolean
}

export interface ServiceMethodSet {
  jurisdiction: string
  methods: ServiceMethod[]
  /** Short non-advice note shown beside the method picker. */
  note: string
  citation: string
}

// ── method building blocks (reused across jurisdictions) ─────────────────────

const HAND: ServiceMethod = {
  id: "hand",
  label: "Hand delivered",
  description: "Delivered in person to the tenant.",
  icon: "user",
  deemedServiceDays: 0,
}
const FIRST_CLASS_POST: ServiceMethod = {
  id: "post",
  label: "First-class post",
  description: "Sent by first-class post to the tenant's address.",
  icon: "mail",
  deemedServiceDays: 2,
}
const RECORDED_DELIVERY: ServiceMethod = {
  id: "recorded",
  label: "Recorded / special delivery",
  description: "Sent by a tracked, signed-for postal service.",
  icon: "shield",
  deemedServiceDays: 2,
}
const REGISTERED_POST: ServiceMethod = {
  id: "registered",
  label: "Registered post",
  description: "Sent by registered/recorded post with proof of posting.",
  icon: "shield",
  deemedServiceDays: 2,
}
const PROCESS_SERVER: ServiceMethod = {
  id: "process",
  label: "Process server",
  description: "Served by a professional process server.",
  icon: "briefcase",
  deemedServiceDays: 0,
}
const SHERIFF_OFFICER: ServiceMethod = {
  id: "sheriff",
  label: "Sheriff officer",
  description: "Served by a sheriff officer.",
  icon: "briefcase",
  deemedServiceDays: 0,
}
const EMAIL_IF_PERMITTED: ServiceMethod = {
  id: "email",
  label: "Email",
  description: "Sent by email — only valid where the agreement permits e-service.",
  icon: "send",
  deemedServiceDays: 0,
  requiresAgreementClause: true,
}

function set(
  jurisdiction: string,
  methods: ServiceMethod[],
  note: string,
  citation: string,
): ServiceMethodSet {
  return { jurisdiction, methods, note, citation }
}

// ── registry ─────────────────────────────────────────────────────────────────

const EW = set(
  "GB-EW",
  [HAND, FIRST_CLASS_POST, RECORDED_DELIVERY, PROCESS_SERVER, EMAIL_IF_PERMITTED],
  "Serve in line with the tenancy's service clause. First-class post is usually deemed served after 2 working days; email is only valid where the agreement allows it.",
  "England & Wales — tenancy service clause / CPR 6",
)

const SCOTLAND = set(
  "GB-SCT",
  [HAND, RECORDED_DELIVERY, SHERIFF_OFFICER, EMAIL_IF_PERMITTED],
  "Scotland: serve by recorded delivery or sheriff officer. Notice to Leave periods run from receipt — keep proof of service.",
  "Scotland — recorded delivery / sheriff officer",
)

const NI = set(
  "GB-NI",
  [HAND, FIRST_CLASS_POST, RECORDED_DELIVERY, PROCESS_SERVER],
  "Northern Ireland: serve by hand or post and retain proof of service.",
  "Northern Ireland — service of notice to quit",
)

const IRELAND = set(
  "IE",
  [HAND, REGISTERED_POST],
  "Ireland (RTB): a notice of termination must be served by hand or by registered post, with the date and method recorded.",
  "RTB — service of a notice of termination",
)

const REGISTRY: Record<string, ServiceMethodSet> = {
  GB: EW,
  "GB:EW": EW,
  "GB:SCT": SCOTLAND,
  "GB:NI": NI,
  IE: IRELAND,
}

const GENERIC = set(
  "generic",
  [HAND, FIRST_CLASS_POST, REGISTERED_POST, EMAIL_IF_PERMITTED],
  "No reviewed service rule for this jurisdiction — serve in line with the agreement and local law, and keep proof of service.",
  "Verify local service-of-notice rules",
)

/**
 * Resolve the valid service methods for a jurisdiction. Pass a property's
 * record-true `country_code`/`region_code`. Falls back to a generic, non-advice
 * set for unreviewed jurisdictions.
 */
export function serviceMethodsFor(
  countryCode: string | null | undefined,
  region?: string | null,
): ServiceMethodSet {
  const country = (countryCode || "GB").toUpperCase()
  const reg = (region || "").toUpperCase()
  if (reg && REGISTRY[`${country}:${reg}`]) return REGISTRY[`${country}:${reg}`]
  if (REGISTRY[country]) return REGISTRY[country]
  return GENERIC
}

/** Look up a single method label by id within a resolved set (UI convenience). */
export function serviceMethodLabel(setOrMethods: ServiceMethodSet | ServiceMethod[], id: string): string {
  const methods = Array.isArray(setOrMethods) ? setOrMethods : setOrMethods.methods
  return methods.find((m) => m.id === id)?.label ?? id
}
