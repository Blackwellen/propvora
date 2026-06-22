import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function ComplianceSettingsRedirect() {
  redirect("/property-manager/settings/compliance")
}
