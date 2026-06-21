import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function NewPossessionRedirectPage() {
  redirect("/property-manager/legal/possession/new/select-tenancy")
}
