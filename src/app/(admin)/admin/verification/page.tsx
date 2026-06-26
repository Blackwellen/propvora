import { redirect } from "next/navigation"

// Canonical URL is /admin/id-verification — redirect the legacy /admin/verification route.
export default function AdminVerificationRedirect() {
  redirect("/admin/id-verification")
}
