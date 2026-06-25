import { redirect } from "next/navigation"

// The Automations landing tab was renamed Home → Overview. This route is kept
// so existing bookmarks / deep links to /automations/home land on the canonical
// /automations/overview surface.
export default function AutomationsHomeRedirect() {
  redirect("/property-manager/automations/overview")
}
