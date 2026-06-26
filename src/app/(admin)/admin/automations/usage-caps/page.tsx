import { redirect } from "next/navigation"

// Canonical URL is /admin/automation-usage — redirect the legacy nested stub.
export default function AutomationUsageCapsRedirect() {
  redirect("/admin/automation-usage")
}
