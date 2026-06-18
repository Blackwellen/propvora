import { redirect } from "next/navigation"

// The affiliate programme is now an internal-tabbed section under the Property
// Manager app at /property-manager/affiliates. This legacy money sub-route
// (previously mock-only) redirects there to avoid a duplicate workflow.
export default function MoneyAffiliateRedirect() {
  redirect("/property-manager/affiliates")
}
