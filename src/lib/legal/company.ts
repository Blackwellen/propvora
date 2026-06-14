/**
 * Single source of truth for legal entity + contact details used across the
 * legal pages, footers, emails and compliance docs.
 *
 * Verified against Companies House (find-and-update.company-information.service.gov.uk)
 * on 2026-06-13:
 *   - BLACKWELLEN LIMITED, company number 16482166
 *   - Incorporated 29 May 2025 (formerly BLACKRIDGE GROUP LIMITED until 15 Oct 2025)
 *   - Registered office: 61 Bridge Street, Kington, England, HR5 3DJ
 *   - SIC 62012 — Business and domestic software development
 *
 * Propvora is a brand / trading name of Blackwellen Ltd.
 *
 * ICO Data Protection register (verified with founder 2026-06-13):
 *   - Registration reference ZC160806, data controller Blackwellen Ltd
 *   - Tier 1, registered 29 May 2026, expires 28 May 2027
 *   - Registered address 61 Bridge Street, Kington, HR5 3DJ
 */

export const COMPANY = {
  /** Public-facing product/brand name. */
  brand: "Propvora",
  /** Registered legal entity that operates the brand. */
  legalName: "Blackwellen Ltd",
  legalNameFull: "BLACKWELLEN LIMITED",
  companyNumber: "16482166",
  jurisdiction: "England and Wales",
  registeredOffice: "61 Bridge Street, Kington, England, HR5 3DJ",
  /** ICO Data Protection fee-payer reference (registration expires 28 May 2027). */
  icoNumber: "ZC160806" as string | null,

  emails: {
    /** Legal, privacy, data protection, SARs, DPA, terms, affiliate terms. */
    legal: "legal@propvora.com",
    /** Account/technical support, security reports, abuse, complaints, deletion help. */
    support: "support@propvora.com",
    /** General enquiries, newsletter, partnerships, press. */
    info: "info@propvora.com",
  },

  ico: {
    url: "https://ico.org.uk",
    helpline: "0303 123 1113",
  },
} as const

/** One-line entity attribution for legal footers. */
export function companyAttribution(): string {
  const ico = COMPANY.icoNumber
    ? ` · ICO registration ${COMPANY.icoNumber}`
    : ""
  return `${COMPANY.brand} is a trading name of ${COMPANY.legalName}, a company registered in ${COMPANY.jurisdiction} (No. ${COMPANY.companyNumber}). Registered office: ${COMPANY.registeredOffice}${ico}.`
}
