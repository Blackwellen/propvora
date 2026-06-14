import type { Metadata } from "next"
import { Compass } from "lucide-react"
import StatePage from "@/components/states/StatePage"

export const metadata: Metadata = {
  title: "Page not found | Propvora",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <StatePage
      icon={Compass}
      tone="blue"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved. Check the address, or head back to a familiar place."
      actions={[
        { label: "Back to dashboard", href: "/app" },
        { label: "Back to home", href: "/" },
      ]}
    />
  )
}
