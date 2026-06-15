/* Propvora identity / KYC verification UI — premium, status-driven, mobile-
   complete. Everything renders from the real `/api/identity/status` response;
   nothing claims "verified" unless the status says so. */

export { VerificationCentre } from "./VerificationCentre"
export { VerificationStepper } from "./VerificationStepper"
export { TrustBadge } from "./TrustBadge"
export { ProviderHandoff } from "./ProviderHandoff"
export { DocumentUpload } from "./DocumentUpload"
export { useVerification } from "./useVerification"
export {
  normalisePhase,
  phaseMeta,
  screeningSignalLabel,
  STEPPER_STAGES,
  type VerificationPhase,
  type VerificationStatus,
  type VerificationDocument,
} from "./status"
