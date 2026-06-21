import { redirect } from "next/navigation"

/**
 * /customer/home → redirect to the canonical customer dashboard at /customer.
 *
 * The live-data server-component dashboard lives at src/app/(customer)/customer/page.tsx.
 * This redirect ensures any bookmarked /customer/home URL is sent to the real page.
 */
export default function CustomerHomeRedirect() {
  redirect("/customer")
}
