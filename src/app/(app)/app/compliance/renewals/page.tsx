import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function ComplianceRenewalsRedirect() {
  redirect("/property-manager/compliance/certificates")
}
