import UsageLimitsPage from "@/features/automations/pages/UsageLimitsPage"

export const metadata = {
  title: "Admin Controls - Automations - Propvora",
  description: "Govern automation usage, enforce policies, and maintain operational guardrails.",
}

// Admin Controls is consolidated into Usage & Limits (Admin Controls sub-tab).
// This route is kept to preserve any bookmarked links.
export default function AutomationAdminControlsRoute() {
  return <UsageLimitsPage initialTab="admin" />
}
