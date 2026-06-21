import ActivityPage from "@/features/automations/pages/ActivityPage"

export const metadata = {
  title: "Automation Activity - Propvora",
  description: "Full audit feed of all automation events: created, edited, enabled, paused, deleted, run, error, and approval.",
}

export default function AutomationActivityRoute() {
  return <ActivityPage />
}
