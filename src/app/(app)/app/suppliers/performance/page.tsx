import { redirect } from "next/navigation"

/**
 * Retired — the Suppliers surface is now the marketplace only (see
 * /property-manager/suppliers). This route redirects to the unified marketplace.
 */
export default function SuppliersPerformancePage() {
  redirect("/property-manager/marketplace/suppliers-hub")
}
