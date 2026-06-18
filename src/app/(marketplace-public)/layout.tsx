import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { MarketplaceShell } from "@/components/marketplace-public/MarketplaceShell"
import { getGlobalFlag } from "@/lib/flags/public"

/**
 * Public marketplace layout — UNAUTHENTICATED (anon-readable).
 *
 * This group sits OUTSIDE every protected prefix in `src/proxy.ts`
 * (`/app`, `/supplier-portal`, `/admin`, `/affiliate`) so `/marketplace/*` is
 * reachable by anonymous visitors. The only data it reads is PUBLISHED/active
 * listings (anon RLS via `marketplace_listings_public_read`) and it only ever
 * writes via the sanctioned enquiry/checkout APIs. Light tokens only — never
 * `dark:` classes.
 */
export const metadata: Metadata = {
  title: "Marketplace · Propvora",
  description:
    "Discover stays, vetted suppliers, emergency call-outs and service packages across the Propvora property marketplace. Escrow-protected payments, verified suppliers.",
  robots: { index: true, follow: true },
}

export default async function MarketplacePublicLayout({ children }: { children: React.ReactNode }) {
  // Staged platform: the public marketplace is hidden until the global
  // `marketplaceEnabled` flag is on (V1 default OFF). No URL leak, no checkout.
  if (!(await getGlobalFlag("marketplaceEnabled"))) {
    redirect("/")
  }
  return <MarketplaceShell>{children}</MarketplaceShell>
}
