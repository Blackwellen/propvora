import { redirect } from "next/navigation"

// Canonical URL is /admin/bug-reports — redirect the legacy /admin/bugs route.
export default function AdminBugsRedirect() {
  redirect("/admin/bug-reports")
}
