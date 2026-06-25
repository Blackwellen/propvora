import { redirect } from "next/navigation"

// Admin Controls (workspace automation governance) has moved out of the
// Automations module tab strip into Workspace Settings → Automation Governance,
// where it was fully redesigned. This route is kept so existing links land in
// the right place.
export default function AutomationAdminControlsRedirect() {
  redirect("/property-manager/workspace-settings/automations")
}
