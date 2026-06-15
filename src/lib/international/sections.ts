// ============================================================================
// Jurisdiction section gating.
//
// Decides which app sections / features apply to a given workspace jurisdiction.
//
//   * UNIVERSAL sections (properties, contacts, money, marketplace, bookings,
//     work/tasks, documents, calendar, reports, settings) apply EVERYWHERE a
//     country is supported — they carry no UK-specific legal assumptions.
//
//   * UK-ONLY sections/features encode British statute and so are valid only for
//     GB: Right to Rent, EPC, HMO licensing, Gas Safety (CP12), EICR, the
//     Section 21 / Section 8 eviction flow, the AST tenancy model and the
//     deposit-protection scheme rules.
//
// Default GB behaviour is unchanged: every section returns true for GB, exactly
// as the app behaves today. For other supported countries the universal sections
// stay on while the UK-only ones switch off, so we never present British legal
// machinery as if it applied in, say, Ireland or Australia.
// ============================================================================

/** Canonical section / feature keys this gate understands. */
export type SectionKey =
  // universal
  | "properties"
  | "portfolio"
  | "contacts"
  | "money"
  | "marketplace"
  | "bookings"
  | "work"
  | "tasks"
  | "documents"
  | "calendar"
  | "reports"
  | "settings"
  | "messaging"
  | "automations"
  // UK-specific
  | "right_to_rent"
  | "epc"
  | "hmo"
  | "gas_safety"
  | "eicr"
  | "section_21"
  | "section_8"
  | "ast"
  | "deposit_protection"

/**
 * Sections that exist everywhere Propvora is supported. Property operations,
 * money, contacts, marketplace and bookings are jurisdiction-neutral.
 */
export const UNIVERSAL_SECTIONS: readonly SectionKey[] = [
  "properties",
  "portfolio",
  "contacts",
  "money",
  "marketplace",
  "bookings",
  "work",
  "tasks",
  "documents",
  "calendar",
  "reports",
  "settings",
  "messaging",
  "automations",
] as const

/**
 * Sections / features that encode UK statute and therefore apply to GB only.
 * These are gated OFF for any non-GB jurisdiction.
 */
export const UK_ONLY_SECTIONS: readonly SectionKey[] = [
  "right_to_rent",
  "epc",
  "hmo",
  "gas_safety",
  "eicr",
  "section_21",
  "section_8",
  "ast",
  "deposit_protection",
] as const

/** Normalise an arbitrary section identifier to a known key (lenient, lowercase, kebab/snake tolerant). */
function normaliseSection(section: string): string {
  return section.toLowerCase().trim().replace(/[\s-]+/g, "_")
}

const UK_ONLY_SET = new Set<string>(UK_ONLY_SECTIONS as readonly string[])
const UNIVERSAL_SET = new Set<string>(UNIVERSAL_SECTIONS as readonly string[])

/** Some common aliases callers may pass, mapped to canonical keys. */
const SECTION_ALIASES: Record<string, SectionKey> = {
  right_to_rent_check: "right_to_rent",
  rtr: "right_to_rent",
  energy_performance_certificate: "epc",
  hmo_licence: "hmo",
  hmo_license: "hmo",
  gas_safety_certificate: "gas_safety",
  cp12: "gas_safety",
  electrical_safety: "eicr",
  s21: "section_21",
  s8: "section_8",
  assured_shorthold_tenancy: "ast",
  tenancy_deposit: "deposit_protection",
  people: "contacts",
  finance: "money",
  jobs: "work",
}

/**
 * Does a section/feature apply to a workspace operating in `code`?
 *
 * - UK-only sections → true only for GB.
 * - Universal sections → true for any non-empty country code (i.e. any supported
 *   jurisdiction). Whether a country is *selectable* is enforced separately by
 *   the onboarding/eligibility guard; this function answers "if you're here,
 *   does this section make sense".
 * - Unknown sections default to UNIVERSAL (true) so a new neutral feature is not
 *   accidentally hidden; anything UK-specific must be added to UK_ONLY_SECTIONS.
 */
export function sectionAppliesToJurisdiction(
  section: string,
  code: string | null | undefined
): boolean {
  const c = (code ?? "GB").toUpperCase().trim()
  let key = normaliseSection(section)
  if (SECTION_ALIASES[key]) key = SECTION_ALIASES[key]

  if (UK_ONLY_SET.has(key)) return c === "GB"
  if (UNIVERSAL_SET.has(key)) return c.length === 2
  // Unknown → treat as universal (visible) but only for a valid country code.
  return c.length === 2
}

/** Is this a UK-only section regardless of the active jurisdiction? */
export function isUkOnlySection(section: string): boolean {
  let key = normaliseSection(section)
  if (SECTION_ALIASES[key]) key = SECTION_ALIASES[key]
  return UK_ONLY_SET.has(key)
}

/**
 * Return the full list of UK-only sections that are HIDDEN for a given non-GB
 * jurisdiction (empty for GB). Useful for the settings capability banner.
 */
export function hiddenUkSectionsFor(code: string | null | undefined): SectionKey[] {
  const c = (code ?? "GB").toUpperCase().trim()
  if (c === "GB") return []
  return [...UK_ONLY_SECTIONS]
}

/** Human labels for the UK-only sections (for the capability banner). */
export const SECTION_LABELS: Record<SectionKey, string> = {
  properties: "Properties",
  portfolio: "Portfolio",
  contacts: "Contacts",
  money: "Money & Finance",
  marketplace: "Marketplace",
  bookings: "Bookings",
  work: "Work & Maintenance",
  tasks: "Tasks",
  documents: "Documents",
  calendar: "Calendar",
  reports: "Reports",
  settings: "Settings",
  messaging: "Messaging",
  automations: "Automations",
  right_to_rent: "Right to Rent checks",
  epc: "EPC (Energy Performance)",
  hmo: "HMO licensing",
  gas_safety: "Gas Safety (CP12)",
  eicr: "EICR (Electrical)",
  section_21: "Section 21 notices",
  section_8: "Section 8 notices",
  ast: "AST tenancies",
  deposit_protection: "Deposit protection",
}
