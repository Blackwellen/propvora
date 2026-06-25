import { LegalJurisdictionGate } from "@/components/legal/LegalJurisdictionGate"

/**
 * Jurisdiction gate for the whole possession sub-tree — covers the list page,
 * the Section 8 wizard (/new/*) and case detail pages. Section 8 possession is
 * England & Wales statute; for any other jurisdiction the gate replaces the
 * content with a jurisdiction notice, so the E&W workflow is never reachable
 * (including by direct URL) outside England & Wales.
 */
export default function PossessionLayout({ children }: { children: React.ReactNode }) {
  return <LegalJurisdictionGate module="possession">{children}</LegalJurisdictionGate>
}
