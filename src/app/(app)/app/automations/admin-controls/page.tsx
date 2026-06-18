import UsageLimitsPage from "@/features/automations/pages/UsageLimitsPage"

export const metadata = {
  title: "Automation admin controls - Propvora",
  description: "Govern automation usage, enforce policies, and maintain operational guardrails.",
}

export default function AutomationAdminControlsRoute() {
  return <UsageLimitsPage initialTab="admin" />
}
