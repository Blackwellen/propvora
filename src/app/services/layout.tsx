import { redirect } from "next/navigation"
import { getGlobalFlag } from "@/lib/flags/public"

/**
 * Marketplace flag guard for ALL `/services/*` routes (Feature Flag Gate Rule).
 * Mirrors the `/stays` guard: `/services/[slug]`, `/services/map` etc. must
 * redirect to `/` when `marketplaceEnabled` is OFF, not just the index page.
 * Fails closed.
 */
export default async function ServicesFlagLayout({ children }: { children: React.ReactNode }) {
  if (!(await getGlobalFlag("marketplaceEnabled"))) redirect("/")
  return <>{children}</>
}
