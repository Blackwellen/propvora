import UsageLimitsPage from "@/features/automations/pages/UsageLimitsPage"

export const metadata = {
  title: "Usage & limits - Automations - Propvora",
  description: "Govern automation usage, enforce policies, and maintain operational guardrails.",
}

export default function AutomationUsageLimitsRoute() {
  return <UsageLimitsPage initialTab="usage" />
}
