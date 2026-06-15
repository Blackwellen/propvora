/**
 * Marketplace legal policy registry — the single source of truth (in app code)
 * for which marketplace policies exist, their current version and the
 * jurisdiction(s) they have been reviewed for.
 *
 * Mirrors the seeded rows in public.marketplace_legal_documents (see migration
 * 20260616170000_marketplace_legal.sql). The DB table is the durable mirror;
 * this registry is what the public pages, acceptance gate and policy banner
 * import so the "current version" shown to a user and the version recorded on
 * acceptance are guaranteed to match.
 *
 * Entity context (read from src/lib/legal/company.ts at render time): every
 * policy is published by Blackwellen Ltd t/a Propvora. Propvora is an
 * intermediary/facilitator — operators and suppliers are the contracting
 * parties for the underlying stay/service; Propvora facilitates discovery,
 * messaging and payments (via Stripe Connect) but is not the host, supplier,
 * travel agent, insurer or adviser.
 *
 * Jurisdiction: 'GB' is the reviewed jurisdiction. Other jurisdictions are
 * served the same documents as GENERAL terms with a "local law may vary" note —
 * the registry records GB as the reviewed locale; pages render the general note.
 */

export type PolicySlug =
  | "marketplace-terms"
  | "seller-agreement"
  | "buyer-terms"
  | "refund-policy"
  | "cancellation-policy"
  | "acceptable-use"

export interface PolicyMeta {
  slug: PolicySlug
  title: string
  /** Short, plain-English description for index/banner UI. */
  summary: string
  /** Version string; matches the seeded DB row + is recorded on acceptance. */
  currentVersion: string
  /** Effective date (ISO yyyy-mm-dd) shown on the page. */
  effectiveFrom: string
  /** Reviewed jurisdiction(s). GB is the reviewed locale; others get a note. */
  jurisdictions: string[]
  /** Public route for the rendered policy page. */
  href: string
}

/** Current marketplace policy versions. Keep in lockstep with the DB seed. */
export const MARKETPLACE_POLICIES: Record<PolicySlug, PolicyMeta> = {
  "marketplace-terms": {
    slug: "marketplace-terms",
    title: "Marketplace Terms",
    summary:
      "The umbrella terms for using the Propvora marketplace — Propvora's role as facilitator, your account, payments via Stripe, trust and verification, and dispute handling.",
    currentVersion: "2026-06-16",
    effectiveFrom: "2026-06-16",
    jurisdictions: ["GB"],
    href: "/legal/marketplace-terms",
  },
  "seller-agreement": {
    slug: "seller-agreement",
    title: "Seller Agreement",
    summary:
      "Terms for operators and suppliers who list stays or services — your responsibilities as the contracting party, fees, payouts, licensing and compliance obligations.",
    currentVersion: "2026-06-16",
    effectiveFrom: "2026-06-16",
    jurisdictions: ["GB"],
    href: "/legal/seller-agreement",
  },
  "buyer-terms": {
    slug: "buyer-terms",
    title: "Buyer Terms",
    summary:
      "Terms for guests and buyers booking stays or ordering services — who your contract is with, payment, your consumer rights, and how to raise an issue.",
    currentVersion: "2026-06-16",
    effectiveFrom: "2026-06-16",
    jurisdictions: ["GB"],
    href: "/legal/buyer-terms",
  },
  "refund-policy": {
    slug: "refund-policy",
    title: "Refund Policy",
    summary:
      "When and how refunds are issued for marketplace transactions, the role of the operator/supplier versus Propvora, and how refunds are processed back to your payment method.",
    currentVersion: "2026-06-16",
    effectiveFrom: "2026-06-16",
    jurisdictions: ["GB"],
    href: "/legal/refund-policy",
  },
  "cancellation-policy": {
    slug: "cancellation-policy",
    title: "Cancellation Policy",
    summary:
      "How cancellations work for stays and services, the cancellation tiers an operator may set, and your statutory cancellation rights where they apply.",
    currentVersion: "2026-06-16",
    effectiveFrom: "2026-06-16",
    jurisdictions: ["GB"],
    href: "/legal/cancellation-policy",
  },
  "acceptable-use": {
    slug: "acceptable-use",
    title: "Marketplace Acceptable Use Policy",
    summary:
      "What you may and may not do on the marketplace — prohibited listings and conduct, off-platform payment rules, fake reviews, and enforcement.",
    currentVersion: "2026-06-16",
    effectiveFrom: "2026-06-16",
    jurisdictions: ["GB"],
    href: "/legal/acceptable-use-marketplace",
  },
}

/** All policies as an ordered array (registry display order). */
export const POLICY_LIST: PolicyMeta[] = [
  MARKETPLACE_POLICIES["marketplace-terms"],
  MARKETPLACE_POLICIES["seller-agreement"],
  MARKETPLACE_POLICIES["buyer-terms"],
  MARKETPLACE_POLICIES["refund-policy"],
  MARKETPLACE_POLICIES["cancellation-policy"],
  MARKETPLACE_POLICIES["acceptable-use"],
]

/** Lookup a policy by slug. Returns undefined for unknown slugs. */
export function getPolicy(slug: string): PolicyMeta | undefined {
  return (MARKETPLACE_POLICIES as Record<string, PolicyMeta>)[slug]
}

/** Current version string for a slug, or null if unknown. */
export function currentVersion(slug: string): string | null {
  return getPolicy(slug)?.currentVersion ?? null
}

/** True when `slug` is a known marketplace policy slug. */
export function isPolicySlug(slug: string): slug is PolicySlug {
  return Object.prototype.hasOwnProperty.call(MARKETPLACE_POLICIES, slug)
}

/**
 * Whether a policy has been reviewed for the given ISO country code. GB is the
 * reviewed jurisdiction; everything else is served as general terms (the page
 * shows the "local law may vary" note rather than blocking).
 */
export function isReviewedJurisdiction(
  slug: string,
  countryCode: string,
): boolean {
  const p = getPolicy(slug)
  if (!p) return false
  return p.jurisdictions.includes(countryCode.toUpperCase())
}
