import { redirect } from "next/navigation"

// Webhooks management has been consolidated into the Integrations tab as a
// sub-tab: /property-manager/automations/integrations (select "Webhooks").
// This route is kept so any bookmarks or existing links land in the right place.
export default function AutomationWebhooksRedirect() {
  redirect("/property-manager/automations/integrations")
}
