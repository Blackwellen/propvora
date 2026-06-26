import { redirect } from "next/navigation"

// Canonical URL is /admin/audit-log — redirect the legacy /admin/audit route.
export default function AdminAuditRedirect() {
  redirect("/admin/audit-log")
}
