import { redirect } from "next/navigation"

// Legacy single-page account settings — superseded by the multi-page
// /property-manager/account/* area (Section 9 audit, bloat consolidation).
// Permanently redirect to the canonical Account Settings overview.
export default function LegacyAccountSettingsRedirect() {
  redirect("/property-manager/account")
}
