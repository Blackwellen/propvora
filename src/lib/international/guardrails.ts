// ============================================================================
// Jurisdiction-aware AI / legal / tax guardrails.
//
// Propvora is UK-operated. Its compliance, tenancy and tax intelligence is only
// REVIEWED (and therefore safe to present with jurisdiction-specific depth) for
// GB today. For every other supported country the country pack carries a
// per-domain status — `reviewed` | `research_only` | `offer` — and these guards
// translate that status into:
//
//   1. a STRONGER disclaimer for non-reviewed jurisdictions (general info only,
//      not yet supported, consult a local professional), and
//   2. a DOWNGRADE of legal/tax depth to "generic" so the AI never asserts a
//      jurisdiction-specific legal claim it cannot stand behind, and
//   3. a HARD BLOCK on sanctioned / non-offer countries at selection time.
//
// This module deliberately has NO runtime dependency on the sibling country/tax
// libs — it operates on the country pack status the caller already loaded (or a
// tolerant dynamic import). GB with status "reviewed" reproduces today's exact
// review-only behaviour; nothing about the UK experience changes.
// ============================================================================

/**
 * The per-domain country-pack status. Mirrors `country_packs.{legal,tax,...}_status`.
 * - `reviewed`      — counsel/specialist-reviewed pack; jurisdiction-specific depth allowed.
 * - `research_only` — internal research only; general info + strong disclaimer, generic depth.
 * - `offer`         — sellable but pack not yet reviewed; treat as non-reviewed.
 * Unknown / null values are treated as the most cautious ("research_only").
 */
export type CountryPackStatus = "reviewed" | "research_only" | "offer"

/**
 * The offer/eligibility classification (mirrors `country_packs.offer_status`).
 * - `offer`      — Stripe-supported, no comprehensive sanctions; selectable.
 * - `restricted` — manual review / friction; NOT self-serve selectable.
 * - `banned`     — comprehensively sanctioned; hard block.
 */
export type OfferStatus = "offer" | "restricted" | "banned"

/** The depth at which the AI may speak about legal/tax matters for a jurisdiction. */
export type LegalDepth = "jurisdiction_specific" | "generic"

/**
 * Hard-blocked countries. The authoritative gate is the live `offer_status` on
 * the country pack (banned/restricted) + a live sanctions feed; this constant is
 * a defence-in-depth backstop for the four comprehensively-embargoed states
 * called out in the build spec so selection can never succeed even if a pack row
 * is missing or stale. ISO-3166 alpha-2.
 */
export const SANCTIONED_COUNTRY_CODES: readonly string[] = [
  "RU", // Russia — broad sanctions; Stripe withdrawn
  "IR", // Iran — comprehensive embargo
  "KP", // North Korea (DPRK) — comprehensive embargo
  "SY", // Syria — comprehensive embargo
  // additional comprehensively-embargoed per master plan §6 (defence in depth)
  "CU", // Cuba
  "BY", // Belarus
] as const

/** Normalise any external status value to a known CountryPackStatus (fail safe). */
export function normalisePackStatus(status: string | null | undefined): CountryPackStatus {
  const s = (status ?? "").toLowerCase().trim()
  if (s === "reviewed") return "reviewed"
  if (s === "offer") return "offer"
  // research_only, draft, planned, "", null, anything unknown → most cautious.
  return "research_only"
}

/** True only for a counsel/specialist-reviewed pack (GB today). */
export function isReviewed(status: string | null | undefined): boolean {
  return normalisePackStatus(status) === "reviewed"
}

/**
 * Is this country code comprehensively sanctioned / hard-blocked?
 * Case-insensitive on ISO alpha-2.
 */
export function isSanctionedCode(code: string | null | undefined): boolean {
  const c = (code ?? "").toUpperCase().trim()
  return SANCTIONED_COUNTRY_CODES.includes(c)
}

/**
 * Depth the AI/legal/tax surfaces may use for a jurisdiction given its pack
 * status. Reviewed (GB) → may make jurisdiction-specific statements; everything
 * else → generic only (no country-specific legal/tax claims).
 */
export function legalDepthFor(status: string | null | undefined): LegalDepth {
  return isReviewed(status) ? "jurisdiction_specific" : "generic"
}

/**
 * The user-facing disclaimer for a jurisdiction, keyed off the pack status.
 *
 * - reviewed (GB): the EXISTING review-only framing — general information, not a
 *   substitute for professional advice, Propvora prepares but does not file.
 * - non-reviewed: a STRONGER disclaimer — this jurisdiction is not yet fully
 *   supported, content is general information only, and a LOCAL professional
 *   must be consulted. No jurisdiction-specific claims are made.
 */
export function jurisdictionDisclaimer(status: string | null | undefined): {
  level: "standard" | "strong"
  title: string
  body: string
} {
  if (isReviewed(status)) {
    return {
      level: "standard",
      title: "General information — not legal, financial or tax advice",
      body:
        "Propvora helps you prepare and organise documents and compliance records. " +
        "It does not provide legal, financial or tax advice and does not file or serve " +
        "anything on your behalf. Confirm anything important with a qualified solicitor " +
        "or accountant before you act.",
    }
  }
  return {
    level: "strong",
    title: "This jurisdiction is not yet fully supported — general information only",
    body:
      "Propvora's compliance, tenancy and tax features are reviewed for the United Kingdom only. " +
      "For this country they are not yet supported and any guidance shown is GENERAL INFORMATION " +
      "ONLY — it is not tailored to local law and may be incomplete or out of date. Propvora does " +
      "not give legal, financial or tax advice. You must consult a qualified local professional " +
      "before acting on anything in this workspace.",
  }
}

/**
 * Build the jurisdiction clause injected into the AI system prompt. This is
 * ADDED to the existing SAFETY_CLAUSES (which already forbid presenting legal/
 * financial/tax guidance as fact). For non-reviewed jurisdictions it instructs
 * the model to downgrade to generic depth and surface the strong disclaimer.
 *
 * `profile` is intentionally loose so this works whether the caller passes a
 * sibling-lib country profile or a raw country-pack row.
 */
export function aiJurisdictionClause(profile: {
  countryCode?: string | null
  countryName?: string | null
  /** Domain status used to drive depth — typically legal_status (or worst-of). */
  status?: string | null
  /** Optional explicit currency/locale to keep the model regionally accurate. */
  currency?: string | null
  locale?: string | null
}): string {
  const code = (profile.countryCode ?? "GB").toUpperCase()
  const name = profile.countryName ?? (code === "GB" ? "the United Kingdom" : code)
  const depth = legalDepthFor(profile.status)
  const currencyLine = profile.currency ? ` Use ${profile.currency} for monetary values.` : ""

  if (depth === "jurisdiction_specific" && code === "GB") {
    // GB — full review-only depth (unchanged behaviour).
    return [
      `JURISDICTION: This workspace operates in ${name} (${code}), a fully reviewed jurisdiction.`,
      `You MAY reference UK-specific regulations by name (EPC, Gas Safety, EICR, AST, Section 21/8, HMO licensing, Right to Rent) where relevant, as general information only.`,
      `Never present this as definitive legal, financial or tax advice; always recommend confirming with a qualified UK solicitor or accountant before acting.${currencyLine}`,
    ].join("\n")
  }

  // Non-reviewed jurisdiction — generic depth + STRONGER disclaimer.
  return [
    `JURISDICTION: This workspace operates in ${name} (${code}). Propvora's legal, tax and compliance content is REVIEWED FOR THE UNITED KINGDOM ONLY and is NOT yet supported for ${name}.`,
    `You MUST treat any legal, tax or compliance topic at a GENERIC level only: do NOT cite ${name}-specific statutes, forms, notice periods, tax rates or filing rules, and do NOT apply UK rules (EPC, Right to Rent, Section 21/8, HMO, Gas Safety) to ${name} — they may not apply.`,
    `State clearly that this is general information only, that this jurisdiction is not yet fully supported, and that the user must consult a qualified local professional in ${name} before acting. If asked for ${name}-specific legal/tax detail, decline and direct the user to a local professional.${currencyLine}`,
  ].join("\n")
}

/**
 * Assert a country may be self-serve onboarded. Returns a structured verdict;
 * throwing variant below for call sites that prefer exceptions.
 *
 * Allowed = code present, not sanctioned, and (when an offer status is known)
 * `offer`. Restricted/banned/unknown-non-offer are rejected. This is the
 * defence-in-depth check; the authoritative gate remains the live pack +
 * sanctions feed enforced server-side.
 */
export function canOnboardCode(
  code: string | null | undefined,
  offerStatus?: string | null
): { allowed: boolean; reason?: string } {
  const c = (code ?? "").toUpperCase().trim()
  if (!c || c.length !== 2) {
    return { allowed: false, reason: "A valid country must be selected." }
  }
  if (isSanctionedCode(c)) {
    return {
      allowed: false,
      reason: "This country is sanctioned and cannot be selected.",
    }
  }
  if (offerStatus != null) {
    const o = String(offerStatus).toLowerCase().trim()
    if (o === "banned") {
      return { allowed: false, reason: "This country is not available." }
    }
    if (o === "restricted") {
      return {
        allowed: false,
        reason: "This country requires manual review before it can be enabled. Contact support.",
      }
    }
    if (o !== "offer") {
      return { allowed: false, reason: "This country is not yet open for onboarding." }
    }
  }
  return { allowed: true }
}

/** Throwing form of {@link canOnboardCode} for server routes. */
export function assertCanOnboard(code: string | null | undefined, offerStatus?: string | null): void {
  const verdict = canOnboardCode(code, offerStatus)
  if (!verdict.allowed) {
    throw new Error(verdict.reason ?? "This country cannot be selected.")
  }
}
