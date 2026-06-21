import type { Metadata } from "next"
import { PauseCircle } from "lucide-react"
import StatePage from "@/components/states/StatePage"

export const metadata: Metadata = {
  title: "Subscription inactive | Propvora",
  robots: { index: false, follow: false },
}

export default function SubscriptionInactivePage() {
  return (
    <StatePage
      icon={PauseCircle}
      tone="amber"
      title="Subscription inactive"
      description="Your workspace subscription is paused, cancelled, or past due. Reactivate it to regain full access to your data and features."
      actions={[
        {
          label: "Manage subscription",
          href: "/property-manager/workspace-settings/subscription",
        },
        { label: "Back to dashboard", href: "/property-manager" },
      ]}
    />
  )
}
