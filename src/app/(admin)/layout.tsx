import { redirect } from "next/navigation"
import { getAdminIdentity, getAdminMfaState } from "@/lib/admin/guard"
import AdminShell from "@/components/shells/AdminShell"

/**
 * Platform admin layout guard.
 *
 * Fails CLOSED on role: only a verified platform admin (platform_role = 'admin'
 * OR core role = 'platform_admin', checked server-side via the service-role
 * client) reaches the console. Any unauthenticated user, non-admin, or
 * verification error is redirected to /bw-console-x9f3. No try/catch fall-through.
 *
 * MFA step-up: once role is confirmed, the console additionally requires that an
 * admin who has enrolled a TOTP factor has satisfied it on this session (AAL2).
 * Admins with a factor enrolled but only an aal1 session are sent to the verify
 * step. Admins without MFA are not locked out (so existing admins keep access);
 * they should enrol MFA from account security.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identity = await getAdminIdentity()
  if (!identity) {
    redirect("/bw-console-x9f3")
  }

  const mfa = await getAdminMfaState()
  if (mfa === "challenge") {
    redirect("/verify-2fa?redirectTo=/admin")
  }

  return <AdminShell>{children}</AdminShell>
}
