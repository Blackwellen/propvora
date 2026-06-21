import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function ComplianceRiskRedirect() {
  redirect("/property-manager/compliance/coverage")
}
