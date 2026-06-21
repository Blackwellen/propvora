import type { Metadata } from "next"
import { CreditCard } from "lucide-react"
import StatePage from "@/components/states/StatePage"

export const metadata: Metadata = {
  title: "Payment required | Propvora",
  robots: { index: false, follow: false },
}

export default function PaymentRequiredPage() {
  return (
    <StatePage
      icon={CreditCard}
      tone="amber"
      title="Payment required"
      description="This feature needs an active, paid plan. Update your billing details to restore access for your workspace."
      actions={[
        { label: "Go to billing", href: "/property-manager/workspace-settings/billing" },
        { label: "Back to dashboard", href: "/property-manager" },
      ]}
    />
  )
}
