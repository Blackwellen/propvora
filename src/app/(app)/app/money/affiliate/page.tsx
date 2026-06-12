import { redirect } from "next/navigation"

// The affiliate programme has its own dedicated area at /affiliate. This legacy
// money sub-route (previously mock-only) now redirects there to avoid a duplicate
// workflow and any stale demo data.
export default function MoneyAffiliateRedirect() {
  redirect("/affiliate")
}
