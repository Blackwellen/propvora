import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function NewPossessionRedirectPage() {
  redirect("/app/legal/possession/new/select-tenancy")
}
