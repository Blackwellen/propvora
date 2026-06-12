import { redirect } from "next/navigation"
import { getAdminIdentity } from "@/lib/admin/guard"
import AdminShell from "@/components/shells/AdminShell"

/**
 * Platform admin layout guard.
 *
 * Fails CLOSED: only a verified platform admin (platform_role = 'admin' OR
 * core role = 'platform_admin', checked server-side via the service-role
 * client) reaches the console. Any unauthenticated user, non-admin, or
 * verification error is redirected to /admin-login. No try/catch fall-through.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identity = await getAdminIdentity()
  if (!identity) {
    redirect("/admin-login")
  }
  return <AdminShell>{children}</AdminShell>
}
