import { SubscriptionBillingPage } from "@/features/billing/components/SubscriptionBillingPage"

// /property-manager/workspace/billing → defaults to the Plan checkout tab.
export default function WorkspaceBillingPage() {
  return <SubscriptionBillingPage tab="checkout" />
}
