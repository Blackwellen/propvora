/**
 * Legal-document registry — the single source of truth for the CURRENT version
 * of each acceptable legal document.
 *
 * `version` is a date-stamped string that MUST be bumped whenever the published
 * document changes materially. Acceptance logging keys on (user, type, version),
 * so bumping a version here is what triggers a re-acceptance prompt for users
 * who only accepted an older version.
 *
 * These values are intentionally framework-agnostic (plain data) so they can be
 * imported by both server (acceptance logging) and client (UI) code.
 */

export type LegalDocumentType =
  | "terms_of_service"
  | "privacy_policy"
  | "acceptable_use"
  | "data_processing"
  | "cookie_policy"
  | "affiliate_terms"

export interface LegalDocument {
  type: LegalDocumentType
  /** Human label for UI. */
  title: string
  /** Public route where the document is published. */
  href: string
  /**
   * Current published version. Bump this (use the publish date) whenever the
   * document materially changes — that forces re-acceptance.
   */
  version: string
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentType, LegalDocument> = {
  terms_of_service: {
    type: "terms_of_service",
    title: "Terms of Service",
    href: "/legal/terms",
    version: "2025-06-02",
  },
  privacy_policy: {
    type: "privacy_policy",
    title: "Privacy Policy",
    href: "/legal/privacy",
    version: "2025-06-02",
  },
  acceptable_use: {
    type: "acceptable_use",
    title: "Acceptable Use Policy",
    href: "/legal/acceptable-use",
    version: "2025-06-02",
  },
  data_processing: {
    type: "data_processing",
    title: "Data Processing Addendum",
    href: "/legal/data-processing",
    version: "2025-06-02",
  },
  cookie_policy: {
    type: "cookie_policy",
    title: "Cookie Policy",
    href: "/legal/cookies",
    version: "2025-06-02",
  },
  affiliate_terms: {
    type: "affiliate_terms",
    title: "Affiliate Terms",
    href: "/legal/affiliate-terms",
    version: "2025-06-02",
  },
}

/**
 * The documents a user must accept to use the core product. These are recorded
 * at signup and re-prompted when their version changes.
 */
export const CORE_ACCEPTANCE_DOCUMENTS: LegalDocumentType[] = [
  "terms_of_service",
  "privacy_policy",
]

/** Current version string for a document type. */
export function currentVersion(type: LegalDocumentType): string {
  return LEGAL_DOCUMENTS[type].version
}
