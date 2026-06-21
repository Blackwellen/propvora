import { redirect } from "next/navigation"

/**
 * /suppliers — redirects to the unified /services page.
 *
 * Suppliers and services are now combined into a single discovery surface at
 * /services. This redirect keeps any existing bookmarks / links working.
 */
export default function SuppliersPage() {
  redirect("/services")
}
