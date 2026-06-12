import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function ComplianceRenewalsRedirect() {
  redirect("/app/compliance/certificates")
}
