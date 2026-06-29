/**
 * Legal review / sign-off register.
 *
 * The owner and director of Blackwellen Ltd reviewed and authorised the legal
 * documents listed below for production publication on the date shown. This is
 * the in-code record of that sign-off (the LegalLayout `reviewNotice` banner is
 * therefore off for these pages — they are published, not drafts).
 *
 * NOTE: this records the COMPANY's own authorisation to publish. It is not a
 * substitute for independent legal advice; documents should be re-reviewed when
 * the law, the company's processing, or the product materially changes.
 */

export const LEGAL_REVIEW = {
  signedOffBy: "Director, Blackwellen Ltd (trading as Propvora)",
  signedOffOn: "2026-06-29",
  jurisdiction: "England and Wales",
  /** Routes covered by the 2026-06-29 sign-off. */
  documents: [
    "/legal/terms",
    "/legal/privacy",
    "/legal/cookies",
    "/legal/acceptable-use",
    "/legal/ai-disclaimer",
    "/legal/affiliate-terms",
    "/legal/data-processing",
    "/legal/security",
    "/legal/subprocessors",
    "/legal/data-retention",
    "/legal/sla",
    "/legal/accessibility",
    "/legal/complaints",
    "/legal/modern-slavery",
  ],
} as const
