import type { Metadata } from "next"
import { MailX } from "lucide-react"
import StatePage from "@/components/states/StatePage"

export const metadata: Metadata = {
  title: "Invite expired | Propvora",
  robots: { index: false, follow: false },
}

export default function InviteExpiredPage() {
  return (
    <StatePage
      icon={MailX}
      tone="rose"
      title="This invite has expired"
      description="Your invitation link is no longer valid or has already been used. Ask your workspace admin to send you a new invitation."
      actions={[
        { label: "Back to home", href: "/" },
        { label: "Sign in", href: "/login" },
      ]}
    />
  )
}
