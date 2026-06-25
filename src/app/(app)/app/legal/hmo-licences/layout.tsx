import { LegalJurisdictionGate } from "@/components/legal/LegalJurisdictionGate"

/**
 * Jurisdiction gate for the whole HMO licences sub-tree — covers the list page
 * and licence detail pages. "HMO licensing" is an England & Wales Housing Act
 * 2004 concept; for any other jurisdiction the gate replaces the content with a
 * jurisdiction notice so the E&W tooling is never reachable (including by direct
 * URL) outside England & Wales.
 */
export default function HmoLicencesLayout({ children }: { children: React.ReactNode }) {
  return <LegalJurisdictionGate module="hmo">{children}</LegalJurisdictionGate>
}
