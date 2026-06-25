import { redirect } from "next/navigation"

// Settings is no longer a top-level tab. Automation governance moved to
// Workspace Settings → Automation Governance.
export default function AutomationSettingsRedirect() {
  redirect("/property-manager/workspace-settings/automations")
}
