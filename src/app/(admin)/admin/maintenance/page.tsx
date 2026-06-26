import { redirect } from "next/navigation"

// Canonical URL is /admin/maintenance-mode — redirect the legacy /admin/maintenance stub.
export default function AdminMaintenanceRedirect() {
  redirect("/admin/maintenance-mode")
}
