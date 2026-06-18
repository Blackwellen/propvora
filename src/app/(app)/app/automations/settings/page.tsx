import { redirect } from "next/navigation"

// Settings is no longer a top-level tab. Governance/admin controls live under
// Admin Controls (part of Usage & Limits).
export default function AutomationSettingsRedirect() {
  redirect("/property-manager/automations/admin-controls")
}
