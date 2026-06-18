import type { Metadata } from "next"

/**
 * Public checkout layout — UNAUTHENTICATED (guest checkout).
 *
 * This group sits OUTSIDE every protected prefix in `src/proxy.ts`
 * (`/app`, `/property-manager`, `/supplier`, `/user`, `/admin`) so `/checkout/*`
 * is reachable by anonymous guests. Access to the underlying checkout rows is
 * scoped by a session token (RLS `request.checkout_session_token`), NOT by an
 * auth account. The screens supply their own secure-checkout chrome via
 * `CheckoutShell`, so this layout is a thin metadata wrapper. Never `dark:`.
 */
export const metadata: Metadata = {
  title: "Secure checkout · Propvora",
  description:
    "Complete your booking or service securely. Escrow-protected payments, transparent pricing, 256-bit SSL.",
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
