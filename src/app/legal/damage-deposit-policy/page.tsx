import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Damage & Deposit Policy | Propvora",
  description: "How security deposits and damage charges work, what they cover, and how disputes about damage are handled.",
}

export default function DamageDepositPolicyPage() {
  return <BookingPolicyPage slug="damage-deposit-policy" />
}
