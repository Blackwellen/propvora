import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Channel Sync Disclaimer | Propvora",
  description: "How iCal channel sync works and its limits: sync is periodic, not instant, and you remain responsible for avoiding double-bookings.",
}

export default function ChannelSyncDisclaimerPage() {
  return <BookingPolicyPage slug="channel-sync-disclaimer" />
}
