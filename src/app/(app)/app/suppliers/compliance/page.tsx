import { redirect } from "next/navigation"

/**
 * Retired — the Suppliers surface is now the marketplace only (see
 * /property-manager/suppliers). Supplier compliance lives in the main
 * Compliance area; this route redirects to the unified marketplace.
 */
export default function SuppliersCompliancePage() {
  redirect("/property-manager/marketplace/suppliers-hub")
}
