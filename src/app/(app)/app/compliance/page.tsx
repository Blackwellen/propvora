import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function CompliancePage() {
  redirect("/property-manager/compliance/overview")
}
