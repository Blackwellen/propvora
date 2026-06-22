import { redirect } from "next/navigation"

/**
 * /property-manager/suppliers — the "Suppliers" sidebar item (flagged
 * `marketplaceEnabled`) is the marketplace entry point, so this lands on the
 * unified suppliers marketplace (Suppliers | Services | Emergency), keeping it
 * 1:1 with the public marketplace at /services.
 *
 * The internal supplier-network tools (directory, compliance, performance)
 * remain available at /property-manager/suppliers/{directory,compliance,performance}.
 */
export default function SuppliersIndexPage() {
  redirect("/property-manager/marketplace/suppliers-hub")
}
