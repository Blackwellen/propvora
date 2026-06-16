/**
 * Supplier-facing verification centre components.
 *
 * Consumed by the supplier-workspace pages (built in another wave). Honest by
 * construction: badges/labels reflect evidence reviewed only — never "fully
 * vetted" or "government verified" — and nothing here auto-approves identity.
 */

export { default as VerificationCentre } from "./VerificationCentre"
export { default as VerificationCentrePanel } from "./VerificationCentrePanel"
export { default as VerificationBadges } from "./VerificationBadges"
export { default as LevelLadder } from "./LevelLadder"
