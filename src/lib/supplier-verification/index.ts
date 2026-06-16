/**
 * Supplier ID Verification — public module surface.
 *
 * SUPPLIER-specific verification stack the marketplace gates on. SEPARATE from
 * the P6 identity/KYC module (src/lib/identity/*). Compliance honesty: badges and
 * levels reflect EVIDENCE REVIEWED only — never "government verified" or "fully
 * vetted", never a guarantee. No path auto-approves identity, insurance, or a
 * licence; admin decisions are explicit and audited.
 */

export * from "./types"

export {
  LEVEL_LABELS,
  LEVEL_DESCRIPTIONS,
  BADGE_LABELS,
  deriveLevel,
  deriveBadges,
  isPayoutVerified,
  isSchemaGap,
  currentLevel,
  getStatusSummary,
  loadVerification,
  ensureVerification,
  markContactStep,
  syncPayoutVerified,
} from "./levels"

export {
  maskNumber,
  recordDocument,
  listDocuments,
  isDocumentExpired,
  applyOcrPrefill,
} from "./documents"

export {
  MINIMUM_COVER_PENCE,
  meetsMinimumCover,
  isInsuranceExpired,
  blocksJobIfExpired as insuranceBlocksJobIfExpired,
  recordInsurance,
  listInsurance,
  hasValidInsurance,
  expireStalePolicies,
} from "./insurance"

export {
  isLicenceExpired,
  blocksJobIfExpired as licenceBlocksJobIfExpired,
  requiredForCategory,
  recordLicence,
  listLicences,
  hasValidLicence,
  hasValidLicenceForCategory,
  expireStaleLicences,
} from "./licences"

export { requirementsForRisk, canAcceptJob } from "./gating"

export {
  decide,
  recordEvent,
  acceptEvidence,
  listEvents,
} from "./review"
