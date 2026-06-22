import { redirect } from "next/navigation"

/**
 * Retired — the Suppliers surface is now the marketplace only (see
 * /property-manager/suppliers). The internal supplier-network directory has
 * been folded away; this route redirects to the unified marketplace.
 */
export default function SuppliersDirectoryPage() {
  redirect("/property-manager/marketplace/suppliers-hub")
}
