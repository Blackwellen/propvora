import { redirect } from "next/navigation"
import { getGlobalFlag } from "@/lib/flags/public"

/**
 * Marketplace flag guard for ALL `/stays/*` routes (Feature Flag Gate Rule).
 * The index page already redirected, but `/stays/[slug]`, `/stays/map`,
 * `/stays/long-term/*` etc. were reachable by direct URL while the marketplace
 * flag was OFF — UI suppression without route protection. This layout closes
 * that hole: every child route redirects to `/` when `marketplaceEnabled` is off.
 * Fails closed (getGlobalFlag → false on any error).
 */
export default async function StaysFlagLayout({ children }: { children: React.ReactNode }) {
  if (!(await getGlobalFlag("marketplaceEnabled"))) redirect("/")
  return <>{children}</>
}
