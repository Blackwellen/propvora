import { redirect } from "next/navigation"

// Canonical URL is /admin/cron-management — redirect the legacy /admin/cron stub.
export default function AdminCronRedirect() {
  redirect("/admin/cron-management")
}
